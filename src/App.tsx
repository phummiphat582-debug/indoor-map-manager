import React, { useState, useEffect, useRef } from 'react';
import type {
  FloorPlan,
  EquipmentPin,
  EquipmentType,
  EquipmentPhoto,
  UserProfile,
  ConnectionStatus,
} from './types';
import {
  getAllFloorPlansFromDB,
  saveFloorPlanToDB,
  updateFloorPlanNameInDB,
  deleteFloorPlanFromDB,
  clearAllFloorPlansFromDB,
  saveAllFloorPlansToDB,
  getAllEquipmentFromDB,
  saveEquipmentToDB,
  deleteEquipmentFromDB,
  clearAllEquipmentFromDB,
  saveAllEquipmentToDB,
  getActiveMapIdFromDB,
  saveActiveMapIdToDB,
} from './services/db';
import {
  getCurrentUser,
  setCurrentUser as saveCurrentUserToStorage,
  canEditEquipment,
} from './services/auth';
import {
  getSupabaseClient,
  mapSupabaseToEquipment,
  mapSupabaseToFloorPlan,
} from './services/supabaseClient';
import { realtimeEngine } from './services/realtime/realtimeEngine';
import { exportProjectToJSON, validateImportJSON } from './services/importExport';
import { useMapTransform } from './hooks/useMapTransform';
import { useToasts } from './hooks/useToasts';
import { Header } from './components/Header';
import { Sidebar } from './components/sidebar/Sidebar';
import { MapCanvas } from './components/map/MapCanvas';
import { MapToolbar } from './components/map/MapToolbar';
import { MapUploadModal } from './components/map/MapUploadModal';
import { MapEditModal } from './components/map/MapEditModal';
import { EquipmentFormModal } from './components/equipment/EquipmentFormModal';
import { EquipmentDetailDrawer } from './components/equipment/EquipmentDetailDrawer';
import { AuthModal } from './components/auth/AuthModal';
import { CloudConfigModal } from './components/cloud/CloudConfigModal';
import { ConfirmModal } from './components/common/ConfirmModal';
import { Lightbox } from './components/common/Lightbox';
import { ToastContainer } from './components/common/ToastContainer';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Loader2 } from 'lucide-react';

export const AppContent: React.FC = () => {
  // 1. Data States (IndexedDB backed cache)
  const [maps, setMaps] = useState<FloorPlan[]>([]);
  const [activeMapId, setActiveMapId] = useState<string | null>(null);
  const [allEquipment, setAllEquipment] = useState<EquipmentPin[]>([]);
  const [isLoadingDB, setIsLoadingDB] = useState(true);

  // 2. Auth & Realtime States
  const [currentUser, setCurrentUser] = useState<UserProfile>(getCurrentUser());
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    realtimeEngine.getStatus()
  );
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(realtimeEngine.getLastSyncAt());
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(
    realtimeEngine.getOfflineQueueCount()
  );
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);

  // 3. Interaction States
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [hiddenTypes, setHiddenTypes] = useState<Set<EquipmentType>>(new Set());

  // 4. Modal & Drawer States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditMapModalOpen, setIsEditMapModalOpen] = useState(false);
  const [mapToEdit, setMapToEdit] = useState<FloorPlan | null>(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formInitialData, setFormInitialData] = useState<Partial<EquipmentPin> | null>(null);
  const [pendingCoords, setPendingCoords] = useState<{ x: number; y: number } | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Lightbox
  const [lightboxPhotos, setLightboxPhotos] = useState<EquipmentPhoto[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Confirmation Modals
  const [pinToDelete, setPinToDelete] = useState<EquipmentPin | null>(null);
  const [mapToDelete, setMapToDelete] = useState<FloorPlan | null>(null);
  const [isClearActivePinsConfirmOpen, setIsClearActivePinsConfirmOpen] = useState(false);
  const [isClearAllDataConfirmOpen, setIsClearAllDataConfirmOpen] = useState(false);

  // Responsive UI States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Hooks
  const { toasts, addToast, removeToast } = useToasts();
  const {
    transform,
    zoomIn,
    zoomOut,
    zoomAtPoint,
    fitToScreen,
    resetView,
    startPan,
    updatePan,
    endPan,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useMapTransform();

  const importFileInputRef = useRef<HTMLInputElement>(null);

  // Active Map & Active Equipment calculation (100% strict separation)
  const activeMap = maps.find((m) => m.id === activeMapId) || (maps.length > 0 ? maps[0] : null);
  const activeEquipment = activeMap ? allEquipment.filter((p) => p.mapId === activeMap.id) : [];
  const selectedPin = activeEquipment.find((p) => p.id === selectedPinId) || null;

  // Ref สำหรับส่งมอบข้อมูลล่าสุดให้เครื่องอื่นเมื่อได้รับสัญญาณขอซิงก์ (REQUEST_SYNC)
  const mapsRef = useRef(maps);
  const allEquipmentRef = useRef(allEquipment);

  useEffect(() => {
    mapsRef.current = maps;
    allEquipmentRef.current = allEquipment;
  }, [maps, allEquipment]);

  useEffect(() => {
    realtimeEngine.setSyncDataProvider(() => ({
      maps: mapsRef.current,
      pins: allEquipmentRef.current,
    }));
  }, []);

  // Initial load from IndexedDB cache & Supabase Cloud (with 1000ms safety timer)
  useEffect(() => {
    let isMounted = true;

    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setIsLoadingDB(false);
      }
    }, 1000);

    const loadInitialData = async () => {
      try {
        let [savedMaps, savedEquipment, lastActiveId] = await Promise.all([
          getAllFloorPlansFromDB(),
          getAllEquipmentFromDB(),
          getActiveMapIdFromDB(),
        ]);

        // หากเชื่อมต่อ Supabase สำเร็จ ให้ดึงข้อมูลล่าสุดจากตารางบนคลาวด์มาผสาน
        const client = getSupabaseClient();
        if (client && navigator.onLine) {
          try {
            const [remoteMapsRes, remotePinsRes] = await Promise.all([
              client.from('indoor_floor_plans').select('*'),
              client.from('indoor_equipment').select('*'),
            ]);

            if (remoteMapsRes.data && remoteMapsRes.data.length > 0) {
              const mappedRemoteMaps = remoteMapsRes.data.map(mapSupabaseToFloorPlan);
              const mapMap = new Map(savedMaps.map((m) => [m.id, m]));
              mappedRemoteMaps.forEach((rm) => {
                mapMap.set(rm.id, rm);
                saveFloorPlanToDB(rm);
              });
              savedMaps = Array.from(mapMap.values());
            }

            if (remotePinsRes.data && remotePinsRes.data.length > 0) {
              const mappedRemotePins = remotePinsRes.data.map(mapSupabaseToEquipment);
              const pinMap = new Map(savedEquipment.map((p) => [p.id, p]));
              mappedRemotePins.forEach((rp) => {
                pinMap.set(rp.id, rp);
                saveEquipmentToDB(rp);
              });
              savedEquipment = Array.from(pinMap.values());
            }
          } catch {
            // หากตารางบน Supabase ยังไม่ได้ถูกสร้าง ให้พึ่งพา Peer Sync และ IndexedDB
          }
        }

        if (isMounted) {
          setMaps(savedMaps);
          setAllEquipment(savedEquipment);

          if (savedMaps.length > 0) {
            const hasValidLast = lastActiveId && savedMaps.some((m) => m.id === lastActiveId);
            setActiveMapId(hasValidLast ? lastActiveId : savedMaps[0].id);
          } else {
            setActiveMapId(null);
          }
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        clearTimeout(safetyTimer);
        if (isMounted) {
          setIsLoadingDB(false);
        }
      }
    };

    loadInitialData();
    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, []);

  // Initialize Real-time Engine & Setup Subscriptions
  useEffect(() => {
    realtimeEngine.init();

    const unsubscribe = realtimeEngine.subscribe({
      onStatusChange: (status) => {
        setConnectionStatus(status);
        setOfflineQueueCount(realtimeEngine.getOfflineQueueCount());
      },
      onLastSyncChange: (date) => {
        setLastSyncAt(date);
      },
      onRemotePinUpsert: (remotePin, senderName) => {
        setAllEquipment((prev) => {
          const existing = prev.find((p) => p.id === remotePin.id);
          // ป้องกันข้อมูลชนกัน (Optimistic Concurrency Control):
          // หากข้อมูลในเครื่องมี version สูงกว่าหรือเท่ากันและเพิ่งแก้ไข ให้คงค่าเดิมไว้
          if (
            existing &&
            existing.version &&
            remotePin.version &&
            existing.version > remotePin.version
          ) {
            return prev;
          }

          if (existing) {
            return prev.map((p) => (p.id === remotePin.id ? remotePin : p));
          } else {
            return [...prev, remotePin];
          }
        });

        // อัปเดตลงหน่วยความจำแคชในเครื่องทันที
        saveEquipmentToDB(remotePin);

        addToast({
          type: 'info',
          title: 'หมุดอัปเดตเรียลไทม์',
          message: `"${remotePin.name}" (${remotePin.code}) ถูกอัปเดตโดย ${senderName}`,
          duration: 2500,
        });
      },
      onRemotePinDelete: (pinId, senderName) => {
        setAllEquipment((prev) => prev.filter((p) => p.id !== pinId));
        deleteEquipmentFromDB(pinId);

        if (selectedPinId === pinId) {
          setSelectedPinId(null);
          setIsDetailOpen(false);
        }

        addToast({
          type: 'info',
          title: 'หมุดถูกลบเรียลไทม์',
          message: `หมุดถูกลบโดย ${senderName}`,
          duration: 2500,
        });
      },
      onRemoteMapUpsert: (remoteMap, senderName) => {
        setMaps((prev) => {
          const idx = prev.findIndex((m) => m.id === remoteMap.id);
          if (idx >= 0) {
            return prev.map((m) => (m.id === remoteMap.id ? remoteMap : m));
          } else {
            return [...prev, remoteMap];
          }
        });
        saveFloorPlanToDB(remoteMap);

        // หากยังไม่มีแผนที่ที่เปิดอยู่ ให้สลับมาแสดงแผนที่นี้ทันที
        setActiveMapId((currentActiveId) => currentActiveId || remoteMap.id);

        addToast({
          type: 'info',
          title: 'แผนที่อัปเดตเรียลไทม์',
          message: `แผนที่ "${remoteMap.name}" ถูกปรับปรุงโดย ${senderName}`,
          duration: 2500,
        });
      },
      onRemoteMapDelete: (mapId, senderName) => {
        setMaps((prev) => prev.filter((m) => m.id !== mapId));
        deleteFloorPlanFromDB(mapId);

        setActiveMapId((currentActiveId) => (currentActiveId === mapId ? null : currentActiveId));

        addToast({
          type: 'info',
          title: 'แผนที่ถูกลบเรียลไทม์',
          message: `แผนที่ถูกลบโดย ${senderName}`,
          duration: 2500,
        });
      },
      onOfflineQueueSynced: (count) => {
        setOfflineQueueCount(0);
        addToast({
          type: 'success',
          title: 'ซิงก์ข้อมูลออฟไลน์สำเร็จ',
          message: `ข้อมูลที่บันทึกไว้ระหว่างออฟไลน์ ${count} รายการถูกส่งขึ้นระบบเรียลไทม์แล้ว`,
          duration: 3500,
        });
      },
    });

    return () => {
      unsubscribe();
    };
  }, [addToast, selectedPinId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName) ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if (e.key === 'Escape') {
        if (isAddMode) {
          setIsAddMode(false);
          addToast({ type: 'info', title: 'ยกเลิกโหมดเพิ่มจุดติดตั้งแล้ว' });
        }
      } else if (e.key === '+' || e.key === '=') {
        zoomIn();
      } else if (e.key === '-' || e.key === '_') {
        zoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddMode, zoomIn, zoomOut, addToast]);

  // Handle Switch User / Login
  const handleSelectUser = (user: UserProfile) => {
    setCurrentUser(user);
    saveCurrentUserToStorage(user);
    addToast({
      type: 'success',
      title: 'เข้าสู่ระบบสำเร็จ',
      message: `คุณเข้าใช้งานในฐานะ ${user.name} (${user.role.toUpperCase()})`,
    });
  };

  const handleLogout = () => {
    saveCurrentUserToStorage(null);
    setCurrentUser({
      id: 'guest',
      name: 'ผู้เยี่ยมชม (Guest)',
      email: 'guest@local',
      role: 'viewer',
      avatar: '👤',
    });
    addToast({
      type: 'info',
      title: 'ออกจากระบบแล้ว',
      message: 'สลับไปยังโหมดผู้ดูข้อมูล (Viewer) เรียบร้อย',
    });
  };

  // Handle Switch Active Map
  const handleSelectMap = async (mapId: string) => {
    if (mapId === activeMapId) return;

    setActiveMapId(mapId);
    setSelectedPinId(null);
    setIsDetailOpen(false);
    setIsAddMode(false);
    await saveActiveMapIdToDB(mapId);

    const targetMap = maps.find((m) => m.id === mapId);
    if (targetMap) {
      addToast({
        type: 'info',
        title: `สลับไปยังแผนที่ "${targetMap.name}" แล้ว`,
        duration: 2000,
      });
    }
  };

  // Handle Save New Map
  const handleSaveFloorPlan = async (newMap: FloorPlan) => {
    try {
      const planToSave: FloorPlan = {
        ...newMap,
        updatedAt: new Date().toISOString(),
        updatedBy: `${currentUser.name} (${currentUser.role})`,
        version: 1,
      };

      await saveFloorPlanToDB(planToSave);
      setMaps((prev) => [...prev, planToSave]);
      setActiveMapId(planToSave.id);
      await saveActiveMapIdToDB(planToSave.id);

      // กระจาย Realtime ขึ้นคลาวด์และอุปกรณ์อื่น
      await realtimeEngine.broadcastMapUpsert(planToSave);

      addToast({
        type: 'success',
        title: 'เพิ่มแผนที่สำเร็จ',
        message: `แผนที่ "${planToSave.name}" ซิงก์ออนไลน์เรียบร้อยแล้ว`,
      });
    } catch (err) {
      console.error('Failed to save map:', err);
      addToast({
        type: 'error',
        title: 'เพิ่มแผนที่ไม่สำเร็จ',
        message: 'หน่วยความจำอาจไม่เพียงพอ',
      });
    }
  };

  // Handle Edit Map Name
  const handleSaveMapName = async (mapId: string, newName: string) => {
    try {
      const existing = maps.find((m) => m.id === mapId);
      const updatedMap: FloorPlan = {
        ...(existing || ({} as FloorPlan)),
        id: mapId,
        name: newName,
        updatedAt: new Date().toISOString(),
        updatedBy: `${currentUser.name} (${currentUser.role})`,
        version: ((existing?.version || 1) + 1),
      };

      await updateFloorPlanNameInDB(mapId, newName);
      setMaps((prev) => prev.map((m) => (m.id === mapId ? updatedMap : m)));

      await realtimeEngine.broadcastMapUpsert(updatedMap);

      addToast({
        type: 'success',
        title: 'เปลี่ยนชื่อแผนที่สำเร็จ',
        message: `เปลี่ยนเป็น "${newName}" เรียบร้อย`,
      });
    } catch {
      addToast({
        type: 'error',
        title: 'เปลี่ยนชื่อแผนที่ล้มเหลว',
      });
    }
  };

  // Handle Delete Map (with confirmation)
  const handleConfirmDeleteMap = async () => {
    if (!mapToDelete) return;
    const deletedId = mapToDelete.id;
    const deletedName = mapToDelete.name;

    try {
      await deleteFloorPlanFromDB(deletedId);

      const remainingMaps = maps.filter((m) => m.id !== deletedId);
      const remainingEquipment = allEquipment.filter((p) => p.mapId !== deletedId);

      setMaps(remainingMaps);
      setAllEquipment(remainingEquipment);
      setMapToDelete(null);

      // กระจายคำสั่งลบไปยังอุปกรณ์อื่นแบบเรียลไทม์
      await realtimeEngine.broadcastMapDelete(deletedId);

      if (activeMapId === deletedId) {
        const nextMap = remainingMaps[0] || null;
        const nextId = nextMap ? nextMap.id : null;
        setActiveMapId(nextId);
        await saveActiveMapIdToDB(nextId);
      }

      addToast({
        type: 'success',
        title: 'ลบแผนที่สำเร็จ',
        message: `ลบแผนที่ "${deletedName}" และหมุดที่เกี่ยวข้องเรียบร้อยแล้ว`,
      });
    } catch (err) {
      console.error('Failed to delete map:', err);
      addToast({
        type: 'error',
        title: 'ไม่สามารถลบแผนที่ได้',
      });
    }
  };

  // Handle Click on Map to Add Pin
  const handleMapClickToAdd = (coords: { x: number; y: number }) => {
    if (!activeMap) return;
    if (!canEditEquipment(currentUser)) {
      addToast({
        type: 'warning',
        title: 'ไม่มีสิทธิ์เพิ่มจุดติดตั้ง',
        message: 'กรุณาเข้าสู่ระบบด้วยสิทธิ์ผู้แก้ไข (Editor) หรือผู้ดูแลระบบ (Admin)',
      });
      return;
    }
    setPendingCoords(coords);
    setFormInitialData(null);
    setIsFormModalOpen(true);
    setIsAddMode(false);
  };

  // Handle Save / Update Equipment Pin
  const handleSaveEquipment = async (
    data: Omit<EquipmentPin, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ) => {
    if (!activeMap) return;

    const now = new Date().toISOString();
    const isNew = !data.id;
    const pinId = data.id || `eq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const existing = data.id ? allEquipment.find((p) => p.id === data.id) : null;

    const savedPin: EquipmentPin = {
      ...data,
      id: pinId,
      mapId: data.mapId || activeMap.id,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
      updatedBy: `${currentUser.name} (${currentUser.role})`,
      version: (existing?.version || 0) + 1,
    };

    try {
      await saveEquipmentToDB(savedPin);

      setAllEquipment((prev) => {
        if (isNew) {
          return [...prev, savedPin];
        }
        return prev.map((item) => (item.id === pinId ? savedPin : item));
      });

      setSelectedPinId(pinId);
      setIsDetailOpen(true);

      // กระจาย Realtime ออกไปยังผู้ใช้อื่นทันที
      await realtimeEngine.broadcastPinUpsert(savedPin);

      addToast({
        type: 'success',
        title: isNew ? 'เพิ่มจุดติดตั้งสำเร็จ' : 'แก้ไขข้อมูลอุปกรณ์สำเร็จ',
        message: `${savedPin.name} (${savedPin.code}) ซิงก์ออนไลน์เรียบร้อย`,
      });
    } catch (err) {
      console.error('Failed to save equipment:', err);
      addToast({
        type: 'error',
        title: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
      });
    }
  };

  // Handle Move Pin Coordinates (Drag & Drop)
  const handleMovePin = async (pinId: string, newX: number, newY: number) => {
    if (!canEditEquipment(currentUser)) {
      addToast({
        type: 'warning',
        title: 'ไม่มีสิทธิ์ย้ายตำแหน่ง',
        message: 'กรุณาเข้าสู่ระบบด้วยสิทธิ์ผู้แก้ไข (Editor) หรือผู้ดูแลระบบ (Admin)',
      });
      return;
    }

    const pin = allEquipment.find((p) => p.id === pinId);
    if (!pin) return;

    const updatedPin: EquipmentPin = {
      ...pin,
      x: newX,
      y: newY,
      updatedAt: new Date().toISOString(),
      updatedBy: `${currentUser.name} (${currentUser.role})`,
      version: (pin.version || 1) + 1,
    };

    try {
      await saveEquipmentToDB(updatedPin);
      setAllEquipment((prev) => prev.map((item) => (item.id === pinId ? updatedPin : item)));

      // กระจาย Realtime พิกัดใหม่ทันที ไม่กระตุก
      await realtimeEngine.broadcastPinUpsert(updatedPin);

      addToast({
        type: 'info',
        title: 'ย้ายตำแหน่งและซิงก์เรียลไทม์แล้ว',
        message: `${pin.code}: ${(newX * 100).toFixed(1)}%, ${(newY * 100).toFixed(1)}%`,
        duration: 2000,
      });
    } catch (err) {
      console.error('Failed to update pin coordinates:', err);
    }
  };

  // Handle Delete Equipment Pin
  const handleConfirmDeletePin = async () => {
    if (!pinToDelete) return;
    const id = pinToDelete.id;
    const name = pinToDelete.name;

    try {
      await deleteEquipmentFromDB(id);
      setAllEquipment((prev) => prev.filter((p) => p.id !== id));
      if (selectedPinId === id) {
        setSelectedPinId(null);
        setIsDetailOpen(false);
      }
      setPinToDelete(null);

      // กระจายคำสั่งลบเรียลไทม์
      await realtimeEngine.broadcastPinDelete(id);

      addToast({
        type: 'success',
        title: 'ลบจุดติดตั้งสำเร็จ',
        message: `ลบ ${name} และซิงก์เรียลไทม์แล้ว`,
      });
    } catch (err) {
      console.error('Failed to delete equipment:', err);
      addToast({
        type: 'error',
        title: 'ไม่สามารถลบจุดติดตั้งได้',
      });
    }
  };

  // Clear Active Map Equipment Pins
  const handleConfirmClearActiveEquipment = async () => {
    if (!activeMap) return;
    try {
      for (const eq of activeEquipment) {
        await deleteEquipmentFromDB(eq.id);
        await realtimeEngine.broadcastPinDelete(eq.id);
      }
      setAllEquipment((prev) => prev.filter((p) => p.mapId !== activeMap.id));
      setSelectedPinId(null);
      setIsDetailOpen(false);
      setIsClearActivePinsConfirmOpen(false);

      addToast({
        type: 'success',
        title: 'ล้างข้อมูลหมุดบนแผนที่นี้สำเร็จ',
        message: `ลบหมุดจำนวน ${activeEquipment.length} จุดบน "${activeMap.name}" เรียบร้อยแล้ว`,
      });
    } catch {
      addToast({ type: 'error', title: 'เกิดข้อผิดพลาดในการล้างข้อมูลหมุด' });
    }
  };

  // Clear All Data
  const handleConfirmClearAllData = async () => {
    try {
      await clearAllFloorPlansFromDB();
      await clearAllEquipmentFromDB();
      await saveActiveMapIdToDB(null);

      setMaps([]);
      setAllEquipment([]);
      setActiveMapId(null);
      setSelectedPinId(null);
      setIsDetailOpen(false);
      setIsClearAllDataConfirmOpen(false);

      addToast({
        type: 'success',
        title: 'ล้างข้อมูลทั้งหมดสำเร็จ',
        message: 'ระบบกลับสู่สถานะเริ่มต้นเรียบร้อยแล้ว',
      });
    } catch {
      addToast({ type: 'error', title: 'เกิดข้อผิดพลาดในการล้างข้อมูลระบบ' });
    }
  };

  // Export JSON Backup
  const handleExportJSON = () => {
    try {
      exportProjectToJSON(maps, allEquipment, activeMapId);
      addToast({
        type: 'success',
        title: 'ส่งออกไฟล์สำรองสำเร็จ',
        message: `บันทึกข้อมูล ${maps.length} แผนที่ และ ${allEquipment.length} หมุด`,
      });
    } catch (err) {
      console.error('Export failed:', err);
      addToast({ type: 'error', title: 'การส่งออกไฟล์ล้มเหลว' });
    }
  };

  // Import JSON Backup
  const handleImportFile = async (file: File) => {
    try {
      const result = await validateImportJSON(file);
      if (!result.valid || !result.data) {
        addToast({
          type: 'error',
          title: 'ไฟล์ JSON ไม่ถูกต้อง',
          message: result.error || 'โครงสร้างไฟล์ไม่ตรงตามมาตรฐานที่กำหนด',
        });
        return;
      }

      await saveAllFloorPlansToDB(result.data.maps);
      await saveAllEquipmentToDB(result.data.equipment);

      setMaps(result.data.maps);
      setAllEquipment(result.data.equipment);

      const nextActiveId =
        result.data.activeMapId && result.data.maps.some((m) => m.id === result.data!.activeMapId)
          ? result.data.activeMapId
          : result.data.maps[0]?.id || null;

      setActiveMapId(nextActiveId);
      await saveActiveMapIdToDB(nextActiveId);

      setSelectedPinId(null);
      setIsDetailOpen(false);

      // กระจาย Realtime ชุดข้อมูลใหม่
      for (const m of result.data.maps) {
        realtimeEngine.broadcastMapUpsert(m);
      }
      for (const p of result.data.equipment) {
        realtimeEngine.broadcastPinUpsert(p);
      }

      addToast({
        type: 'success',
        title: 'นำเข้าข้อมูลสำเร็จ',
        message: `นำเข้า ${result.data.maps.length} แผนที่ และ ${result.data.equipment.length} หมุดอุปกรณ์`,
      });
    } catch (err) {
      console.error('Import failed:', err);
      addToast({
        type: 'error',
        title: 'นำเข้าข้อมูลล้มเหลว',
        message: 'กรุณาตรวจสอบว่าไฟล์ JSON สมบูรณ์และถูกต้อง',
      });
    }
  };

  const handleToggleTypeVisibility = (type: EquipmentType) => {
    setHiddenTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const handleFocusPin = (pin: EquipmentPin) => {
    if (!activeMap) return;
    const container = document.querySelector('.cursor-grab, .cursor-crosshair') as HTMLElement;
    if (!container) return;

    const targetScale = Math.max(transform.scale, 1.5);
    const containerW = container.clientWidth;
    const containerH = container.clientHeight;
    const pinPixelX = pin.x * activeMap.width * targetScale;
    const pinPixelY = pin.y * activeMap.height * targetScale;

    const newTranslateX = containerW / 2 - pinPixelX;
    const newTranslateY = containerH / 2 - pinPixelY;

    zoomAtPoint(0, 0, 0, container.getBoundingClientRect());
    startPan(0, 0);
    updatePan(newTranslateX - transform.translateX, newTranslateY - transform.translateY);
    endPan();
  };

  const handleOpenLightbox = (photos: EquipmentPhoto[], index: number) => {
    setLightboxPhotos(photos);
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  if (isLoadingDB) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-800 p-6 text-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-base font-semibold text-slate-700">กำลังโหลดระบบจัดการแผนที่อุปกรณ์...</p>
        <p className="text-xs text-slate-500 mt-1 mb-6">กำลังเชื่อมต่อพื้นที่จัดเก็บข้อมูลและ Real-time คลาวด์</p>
        <button
          type="button"
          onClick={() => setIsLoadingDB(false)}
          className="min-h-[44px] px-6 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-medium rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          เข้าสู่ระบบทันที
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 font-sans">
      {/* Top Header */}
      <Header
        maps={maps}
        activeMap={activeMap}
        equipment={activeEquipment}
        isAddMode={isAddMode}
        currentUser={currentUser}
        connectionStatus={connectionStatus}
        lastSyncAt={lastSyncAt}
        offlineQueueCount={offlineQueueCount}
        onSelectMap={handleSelectMap}
        onToggleAddMode={() => {
          if (!activeMap) {
            setIsUploadModalOpen(true);
            return;
          }
          if (!canEditEquipment(currentUser)) {
            addToast({
              type: 'warning',
              title: 'ไม่มีสิทธิ์เพิ่มจุดติดตั้ง',
              message: 'กรุณาเข้าสู่ระบบด้วยสิทธิ์ผู้แก้ไข (Editor) หรือผู้ดูแลระบบ (Admin)',
            });
            return;
          }
          setIsAddMode((prev) => !prev);
        }}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        onExportJSON={handleExportJSON}
        onImportClick={() => importFileInputRef.current?.click()}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenCloudModal={() => setIsCloudModalOpen(true)}
      />

      {/* Hidden File Input for JSON Import */}
      <input
        ref={importFileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleImportFile(file);
            e.target.value = '';
          }
        }}
      />

      {/* Main Workspace Area (Sidebar + Map Canvas) */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          maps={maps}
          activeMapId={activeMapId}
          equipment={activeEquipment}
          allEquipment={allEquipment}
          currentUser={currentUser}
          selectedPinId={selectedPinId}
          hiddenTypes={hiddenTypes}
          isOpen={isSidebarOpen}
          isMobileOpen={isMobileSidebarOpen}
          onToggleOpen={() => setIsSidebarOpen((prev) => !prev)}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onSelectMap={handleSelectMap}
          onOpenAddMapModal={() => setIsUploadModalOpen(true)}
          onEditMapName={(map) => {
            setMapToEdit(map);
            setIsEditMapModalOpen(true);
          }}
          onRequestDeleteMap={(map) => setMapToDelete(map)}
          onSelectEquipment={(pin) => {
            setSelectedPinId(pin.id);
            setIsDetailOpen(true);
            if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
          }}
          onToggleTypeVisibility={handleToggleTypeVisibility}
          onExportJSON={handleExportJSON}
          onImportFile={handleImportFile}
          onRequestClearActiveEquipment={() => setIsClearActivePinsConfirmOpen(true)}
          onRequestClearAllData={() => setIsClearAllDataConfirmOpen(true)}
          onRequestClearMap={() => {
            if (activeMap) setMapToDelete(activeMap);
          }}
        />

        {/* Center: Map Canvas Viewport */}
        <main className="flex-1 relative h-full w-full overflow-hidden bg-slate-100">
          <MapCanvas
            floorPlan={activeMap}
            equipment={activeEquipment}
            hiddenTypes={hiddenTypes}
            selectedPinId={selectedPinId}
            isAddMode={isAddMode}
            canDragPins={canEditEquipment(currentUser)}
            transform={transform}
            onSelectPin={(pin) => {
              setSelectedPinId(pin.id);
              setIsDetailOpen(true);
            }}
            onMovePin={handleMovePin}
            onMapClickToAdd={handleMapClickToAdd}
            onWheelZoom={zoomAtPoint}
            onStartPan={startPan}
            onUpdatePan={updatePan}
            onEndPan={endPan}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
            onFitToScreen={fitToScreen}
          />

          {/* Floating Map Toolbar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
            <MapToolbar
              scale={transform.scale}
              isAddMode={isAddMode}
              hasFloorPlan={Boolean(activeMap)}
              canAddPin={canEditEquipment(currentUser)}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onFitToScreen={() => {
                const container = document.querySelector(
                  '.cursor-grab, .cursor-crosshair'
                ) as HTMLElement;
                if (container && activeMap) {
                  fitToScreen(
                    container.clientWidth,
                    container.clientHeight,
                    activeMap.width,
                    activeMap.height
                  );
                }
              }}
              onResetView={() => {
                const container = document.querySelector(
                  '.cursor-grab, .cursor-crosshair'
                ) as HTMLElement;
                if (container && activeMap) {
                  resetView(
                    container.clientWidth,
                    container.clientHeight,
                    activeMap.width,
                    activeMap.height
                  );
                }
              }}
              onToggleAddMode={() => {
                if (!activeMap) {
                  setIsUploadModalOpen(true);
                  return;
                }
                if (!canEditEquipment(currentUser)) {
                  addToast({
                    type: 'warning',
                    title: 'ไม่มีสิทธิ์เพิ่มจุดติดตั้ง',
                    message: 'กรุณาเข้าสู่ระบบด้วยสิทธิ์ผู้แก้ไข (Editor) หรือผู้ดูแลระบบ (Admin)',
                  });
                  return;
                }
                setIsAddMode((prev) => !prev);
              }}
              onOpenUploadModal={() => setIsUploadModalOpen(true)}
            />
          </div>

          {/* Equipment Detail: Bottom Sheet on Mobile, Side Panel on Desktop */}
          <EquipmentDetailDrawer
            pin={selectedPin}
            mapName={activeMap?.name}
            isOpen={isDetailOpen && Boolean(selectedPin)}
            currentUser={currentUser}
            onClose={() => {
              setIsDetailOpen(false);
              setSelectedPinId(null);
            }}
            onEdit={(pin) => {
              setFormInitialData(pin);
              setPendingCoords(null);
              setIsFormModalOpen(true);
            }}
            onDeleteRequest={(pin) => setPinToDelete(pin)}
            onFocusPin={handleFocusPin}
            onOpenLightbox={handleOpenLightbox}
          />
        </main>
      </div>

      {/* Upload New Map Modal */}
      <MapUploadModal
        isOpen={isUploadModalOpen}
        mapCount={maps.length}
        onClose={() => setIsUploadModalOpen(false)}
        onSaveFloorPlan={handleSaveFloorPlan}
      />

      {/* Edit Map Name Modal */}
      <MapEditModal
        map={mapToEdit}
        isOpen={isEditMapModalOpen}
        onClose={() => {
          setIsEditMapModalOpen(false);
          setMapToEdit(null);
        }}
        onSaveName={handleSaveMapName}
      />

      {/* Equipment Add/Edit Form Modal */}
      <EquipmentFormModal
        isOpen={isFormModalOpen}
        mapId={activeMap?.id || ''}
        mapName={activeMap?.name || ''}
        initialData={formInitialData}
        defaultCoordinates={pendingCoords}
        onClose={() => {
          setIsFormModalOpen(false);
          setPendingCoords(null);
          setFormInitialData(null);
        }}
        onSave={handleSaveEquipment}
        onViewPhoto={(photos, idx) => handleOpenLightbox(photos, idx)}
      />

      {/* Photo Lightbox */}
      <Lightbox
        photos={lightboxPhotos}
        currentIndex={lightboxIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        onNavigate={(idx) => setLightboxIndex(idx)}
      />

      {/* Auth & RBAC Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        currentUser={currentUser}
        onClose={() => setIsAuthModalOpen(false)}
        onSelectUser={handleSelectUser}
        onLogout={handleLogout}
      />

      {/* Cloud & Realtime Config Modal */}
      <CloudConfigModal
        isOpen={isCloudModalOpen}
        status={connectionStatus}
        lastSyncAt={lastSyncAt}
        onClose={() => setIsCloudModalOpen(false)}
        onTriggerSync={() => realtimeEngine.flushOfflineQueue()}
      />

      {/* Confirmation: Delete Single Pin */}
      <ConfirmModal
        isOpen={Boolean(pinToDelete)}
        title="ยืนยันการลบจุดติดตั้ง"
        message={`คุณแน่ใจหรือไม่ว่าต้องการลบ "${pinToDelete?.name}" (${pinToDelete?.code})? การกระทำนี้ไม่สามารถย้อนกลับได้`}
        confirmLabel="ลบจุดติดตั้ง"
        cancelLabel="ยกเลิก"
        isDanger={true}
        onConfirm={handleConfirmDeletePin}
        onCancel={() => setPinToDelete(null)}
      />

      {/* Confirmation: Delete Floor Plan */}
      <ConfirmModal
        isOpen={Boolean(mapToDelete)}
        title="ยืนยันการลบแผนที่ผังอาคาร"
        message={`คุณแน่ใจหรือไม่ว่าต้องการลบแผนที่ "${mapToDelete?.name}"? หมุดและข้อมูลอุปกรณ์ทั้งหมดบนแผนที่นี้จะถูกลบออกด้วย`}
        confirmLabel="ลบแผนที่นี้"
        cancelLabel="ยกเลิก"
        isDanger={true}
        onConfirm={handleConfirmDeleteMap}
        onCancel={() => setMapToDelete(null)}
      />

      {/* Confirmation: Clear Active Map Pins */}
      <ConfirmModal
        isOpen={isClearActivePinsConfirmOpen}
        title="ยืนยันการลบหมุดบนแผนที่นี้"
        message={`คุณต้องการลบจุดติดตั้งทั้งหมดจำนวน ${activeEquipment.length} จุดบนแผนที่ "${activeMap?.name}" ใช่หรือไม่?`}
        confirmLabel="ลบหมุดทั้งหมด"
        cancelLabel="ยกเลิก"
        isDanger={true}
        onConfirm={handleConfirmClearActiveEquipment}
        onCancel={() => setIsClearActivePinsConfirmOpen(false)}
      />

      {/* Confirmation: Clear All System Data */}
      <ConfirmModal
        isOpen={isClearAllDataConfirmOpen}
        title="ยืนยันการล้างข้อมูลทั้งหมดในระบบ"
        message={`คุณต้องการลบแผนที่ทั้งหมด (${maps.length} แผนที่) และหมุดทั้งหมด (${allEquipment.length} จุด) ออกจากระบบใช่หรือไม่?`}
        confirmLabel="ล้างข้อมูลทั้งหมด"
        cancelLabel="ยกเลิก"
        isDanger={true}
        onConfirm={handleConfirmClearAllData}
        onCancel={() => setIsClearAllDataConfirmOpen(false)}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
