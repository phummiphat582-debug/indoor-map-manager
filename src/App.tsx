import React, { useState, useEffect, useRef } from 'react';
import type { FloorPlan, EquipmentPin, EquipmentType, EquipmentPhoto } from './types';
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
import { ConfirmModal } from './components/common/ConfirmModal';
import { Lightbox } from './components/common/Lightbox';
import { ToastContainer } from './components/common/ToastContainer';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Loader2 } from 'lucide-react';

export const AppContent: React.FC = () => {
  // 1. Data States (IndexedDB backed)
  const [maps, setMaps] = useState<FloorPlan[]>([]);
  const [activeMapId, setActiveMapId] = useState<string | null>(null);
  const [allEquipment, setAllEquipment] = useState<EquipmentPin[]>([]);
  const [isLoadingDB, setIsLoadingDB] = useState(true);

  // 2. Interaction States
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [hiddenTypes, setHiddenTypes] = useState<Set<EquipmentType>>(new Set());

  // 3. Modal & Drawer States
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

  // Initial load from IndexedDB
  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      try {
        const [savedMaps, savedEquipment, lastActiveId] = await Promise.all([
          getAllFloorPlansFromDB(),
          getAllEquipmentFromDB(),
          getActiveMapIdFromDB(),
        ]);

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
        addToast({
          type: 'error',
          title: 'ไม่สามารถโหลดข้อมูลจากหน่วยความจำได้',
          message: 'กรุณาตรวจสอบการตั้งค่าพื้นที่จัดเก็บของเบราว์เซอร์',
        });
      } finally {
        if (isMounted) {
          setIsLoadingDB(false);
        }
      }
    };

    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, [addToast]);

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
      await saveFloorPlanToDB(newMap);
      setMaps((prev) => [...prev, newMap]);
      setActiveMapId(newMap.id);
      await saveActiveMapIdToDB(newMap.id);

      addToast({
        type: 'success',
        title: 'เพิ่มแผนที่สำเร็จ',
        message: `แผนที่ "${newMap.name}" พร้อมใช้งานแล้ว`,
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
      await updateFloorPlanNameInDB(mapId, newName);
      setMaps((prev) =>
        prev.map((m) => (m.id === mapId ? { ...m, name: newName, updatedAt: new Date().toISOString() } : m))
      );
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

      // ถ้าแผนที่ที่ลบคือแผนที่ที่กำลังเปิดดูอยู่ ให้สลับไปแผนที่แรกที่เหลือ
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

    const savedPin: EquipmentPin = {
      ...data,
      id: pinId,
      mapId: data.mapId || activeMap.id,
      createdAt: data.id ? allEquipment.find((p) => p.id === data.id)?.createdAt || now : now,
      updatedAt: now,
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

      addToast({
        type: 'success',
        title: isNew ? 'เพิ่มจุดติดตั้งสำเร็จ' : 'แก้ไขข้อมูลอุปกรณ์สำเร็จ',
        message: `${savedPin.name} (${savedPin.code}) บน ${activeMap.name}`,
      });
    } catch (err) {
      console.error('Failed to save equipment:', err);
      addToast({
        type: 'error',
        title: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
      });
    }
  };

  // Handle Move Pin Coordinates
  const handleMovePin = async (pinId: string, newX: number, newY: number) => {
    const pin = allEquipment.find((p) => p.id === pinId);
    if (!pin) return;

    const updatedPin: EquipmentPin = {
      ...pin,
      x: newX,
      y: newY,
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveEquipmentToDB(updatedPin);
      setAllEquipment((prev) => prev.map((item) => (item.id === pinId ? updatedPin : item)));
      addToast({
        type: 'info',
        title: 'ย้ายตำแหน่งจุดติดตั้งแล้ว',
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

      addToast({
        type: 'success',
        title: 'ลบจุดติดตั้งสำเร็จ',
        message: `ลบ ${name} ออกจากระบบแล้ว`,
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
      const activeIds = new Set(activeEquipment.map((p) => p.id));
      for (const id of activeIds) {
        await deleteEquipmentFromDB(id);
      }

      setAllEquipment((prev) => prev.filter((p) => p.mapId !== activeMap.id));
      setSelectedPinId(null);
      setIsDetailOpen(false);
      setIsClearActivePinsConfirmOpen(false);

      addToast({
        type: 'info',
        title: `ลบจุดติดตั้งบน "${activeMap.name}" ทั้งหมดแล้ว`,
      });
    } catch {
      addToast({
        type: 'error',
        title: 'เกิดข้อผิดพลาดในการลบข้อมูล',
      });
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
        type: 'info',
        title: 'ล้างข้อมูลทั้งหมดในระบบเรียบร้อยแล้ว',
      });
    } catch {
      addToast({
        type: 'error',
        title: 'เกิดข้อผิดพลาดในการล้างข้อมูล',
      });
    }
  };

  // Focus Pin
  const handleFocusPin = (pin: EquipmentPin) => {
    if (!activeMap) return;
    const container = document.querySelector('.cursor-grab, .cursor-crosshair') as HTMLElement;
    if (container) {
      const { clientWidth, clientHeight } = container;
      const targetScale = Math.max(1.2, transform.scale);
      const targetPinX = pin.x * activeMap.width * targetScale;
      const targetPinY = pin.y * activeMap.height * targetScale;

      const translateX = clientWidth / 2 - targetPinX;
      const translateY = clientHeight / 2 - targetPinY;

      transform.scale = targetScale;
      transform.translateX = Math.round(translateX);
      transform.translateY = Math.round(translateY);
    }
  };

  // Visibility toggle
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

  // JSON Export (All maps and all pins)
  const handleExportJSON = () => {
    try {
      exportProjectToJSON(maps, allEquipment, activeMapId);
      addToast({
        type: 'success',
        title: 'ส่งออกข้อมูลสำเร็จ',
        message: `${maps.length} แผนที่ และจุดติดตั้ง ${allEquipment.length} รายการ`,
      });
    } catch (err) {
      console.error('Export failed:', err);
      addToast({
        type: 'error',
        title: 'เกิดข้อผิดพลาดในการส่งออกไฟล์',
      });
    }
  };

  // JSON Import
  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const result = validateImportJSON(parsed);

      if (!result.valid || !result.data) {
        addToast({
          type: 'error',
          title: 'ไฟล์ JSON ไม่ถูกต้อง',
          message: result.error || 'โครงสร้างไฟล์ไม่ตรงกับระบบ',
        });
        return;
      }

      const importedData = result.data;

      // บันทึกลง IndexedDB
      await clearAllFloorPlansFromDB();
      await saveAllFloorPlansToDB(importedData.maps);

      await clearAllEquipmentFromDB();
      await saveAllEquipmentToDB(importedData.equipment);

      setMaps(importedData.maps);
      setAllEquipment(importedData.equipment);

      const targetActiveId =
        importedData.activeMapId && importedData.maps.some((m) => m.id === importedData.activeMapId)
          ? importedData.activeMapId
          : importedData.maps[0]?.id || null;

      setActiveMapId(targetActiveId);
      await saveActiveMapIdToDB(targetActiveId);

      setSelectedPinId(null);
      setIsDetailOpen(false);

      addToast({
        type: 'success',
        title: 'นำเข้าข้อมูลสำเร็จ',
        message: `โหลด ${importedData.maps.length} แผนที่ และ ${importedData.equipment.length} จุดติดตั้งแล้ว`,
      });
    } catch (err) {
      console.error('Import failed:', err);
      addToast({
        type: 'error',
        title: 'ไม่สามารถนำเข้าข้อมูลได้',
        message: err instanceof Error ? err.message : 'ไฟล์ JSON มีความเสียหาย',
      });
    }
  };

  const handleOpenLightbox = (photos: EquipmentPhoto[], index: number) => {
    setLightboxPhotos(photos);
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  if (isLoadingDB) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-800">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-700">กำลังโหลดระบบจัดการแผนที่อุปกรณ์...</p>
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
        onSelectMap={handleSelectMap}
        onToggleAddMode={() => {
          if (!activeMap) {
            setIsUploadModalOpen(true);
            return;
          }
          setIsAddMode((prev) => !prev);
        }}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        onExportJSON={handleExportJSON}
        onImportClick={() => importFileInputRef.current?.click()}
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
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onFitToScreen={() => {
                const container = document.querySelector('.cursor-grab, .cursor-crosshair') as HTMLElement;
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
                const container = document.querySelector('.cursor-grab, .cursor-crosshair') as HTMLElement;
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

      {/* Upload/Add New Map Modal */}
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
        onViewPhoto={handleOpenLightbox}
      />

      {/* Photo Lightbox */}
      <Lightbox
        photos={lightboxPhotos}
        currentIndex={lightboxIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        onNavigate={(idx) => setLightboxIndex(idx)}
      />

      {/* Confirm Delete Single Pin Modal */}
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

      {/* Confirm Delete Map Modal */}
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

      {/* Confirm Clear Active Map Pins Modal */}
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

      {/* Confirm Clear All Data Modal */}
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

      {/* Global Toast Container */}
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
