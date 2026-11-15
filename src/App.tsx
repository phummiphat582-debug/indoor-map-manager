import React, { useState, useEffect, useRef } from 'react';
import type { FloorPlan, EquipmentPin, EquipmentType, EquipmentPhoto } from './types';
import {
  saveFloorPlanToDB,
  getFloorPlanFromDB,
  deleteFloorPlanFromDB,
  getAllEquipmentFromDB,
  saveEquipmentToDB,
  deleteEquipmentFromDB,
  clearAllEquipmentFromDB,
  saveAllEquipmentToDB,
} from './services/db';
import { exportProjectToJSON, validateImportJSON } from './services/importExport';
import { useMapTransform } from './hooks/useMapTransform';
import { useToasts } from './hooks/useToasts';
import { Header } from './components/Header';
import { Sidebar } from './components/sidebar/Sidebar';
import { MapCanvas } from './components/map/MapCanvas';
import { MapToolbar } from './components/map/MapToolbar';
import { MapUploadModal } from './components/map/MapUploadModal';
import { EquipmentFormModal } from './components/equipment/EquipmentFormModal';
import { EquipmentDetailDrawer } from './components/equipment/EquipmentDetailDrawer';
import { ConfirmModal } from './components/common/ConfirmModal';
import { Lightbox } from './components/common/Lightbox';
import { ToastContainer } from './components/common/ToastContainer';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Loader2 } from 'lucide-react';

export const AppContent: React.FC = () => {
  // App primary states (IndexedDB backed)
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [equipment, setEquipment] = useState<EquipmentPin[]>([]);
  const [isLoadingDB, setIsLoadingDB] = useState(true);

  // Interaction states
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [hiddenTypes, setHiddenTypes] = useState<Set<EquipmentType>>(new Set());

  // Modal & Drawer states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
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
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false);
  const [isClearMapConfirmOpen, setIsClearMapConfirmOpen] = useState(false);

  // Responsive UI states
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

  // 1. Initial Load from IndexedDB
  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      try {
        const [savedMap, savedEquipment] = await Promise.all([
          getFloorPlanFromDB(),
          getAllEquipmentFromDB(),
        ]);

        if (isMounted) {
          setFloorPlan(savedMap);
          setEquipment(savedEquipment);
        }
      } catch (err) {
        console.error('Failed to load initial data from IndexedDB:', err);
        addToast({
          type: 'error',
          title: 'ไม่สามารถโหลดข้อมูลจากหน่วยความจำได้',
          message: 'กรุณาตรวจสอบการตั้งค่าพื้นที่เก็บข้อมูลของเบราว์เซอร์',
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

  // 2. Keyboard shortcuts
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

  const selectedPin = equipment.find((p) => p.id === selectedPinId) || null;

  const handleSaveFloorPlan = async (newFloorPlan: FloorPlan) => {
    try {
      await saveFloorPlanToDB(newFloorPlan);
      setFloorPlan(newFloorPlan);
      addToast({
        type: 'success',
        title: 'บันทึกแผนที่ผังอาคารสำเร็จ',
        message: `ไฟล์ ${newFloorPlan.name} (${newFloorPlan.width} × ${newFloorPlan.height} px)`,
      });
    } catch (err) {
      console.error('Save floor plan failed:', err);
      addToast({
        type: 'error',
        title: 'บันทึกแผนที่ล้มเหลว',
        message: 'พื้นที่จัดเก็บบนอุปกรณ์อาจเต็มหรือไม่เพียงพอ',
      });
    }
  };

  const handleMapClickToAdd = (coords: { x: number; y: number }) => {
    setPendingCoords(coords);
    setFormInitialData(null);
    setIsFormModalOpen(true);
    setIsAddMode(false);
  };

  const handleSaveEquipment = async (
    data: Omit<EquipmentPin, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ) => {
    const now = new Date().toISOString();
    const isNew = !data.id;
    const pinId = data.id || `eq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const savedPin: EquipmentPin = {
      ...data,
      id: pinId,
      createdAt: data.id ? equipment.find((p) => p.id === data.id)?.createdAt || now : now,
      updatedAt: now,
    };

    try {
      await saveEquipmentToDB(savedPin);

      setEquipment((prev) => {
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
        message: `${savedPin.name} (${savedPin.code})`,
      });
    } catch (err) {
      console.error('Failed to save equipment:', err);
      addToast({
        type: 'error',
        title: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
        message: 'กรุณาลองใหม่อีกครั้ง',
      });
    }
  };

  const handleMovePin = async (pinId: string, newX: number, newY: number) => {
    const pin = equipment.find((p) => p.id === pinId);
    if (!pin) return;

    const updatedPin: EquipmentPin = {
      ...pin,
      x: newX,
      y: newY,
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveEquipmentToDB(updatedPin);
      setEquipment((prev) => prev.map((item) => (item.id === pinId ? updatedPin : item)));
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

  const handleConfirmDeletePin = async () => {
    if (!pinToDelete) return;
    const id = pinToDelete.id;
    const name = pinToDelete.name;

    try {
      await deleteEquipmentFromDB(id);
      setEquipment((prev) => prev.filter((p) => p.id !== id));
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

  const handleConfirmClearAll = async () => {
    try {
      await clearAllEquipmentFromDB();
      setEquipment([]);
      setSelectedPinId(null);
      setIsDetailOpen(false);
      setIsClearAllConfirmOpen(false);
      addToast({
        type: 'info',
        title: 'ล้างข้อมูลอุปกรณ์ทั้งหมดเรียบร้อยแล้ว',
      });
    } catch {
      addToast({
        type: 'error',
        title: 'เกิดข้อผิดพลาดในการล้างข้อมูล',
      });
    }
  };

  const handleConfirmClearMap = async () => {
    try {
      await deleteFloorPlanFromDB();
      setFloorPlan(null);
      setIsClearMapConfirmOpen(false);
      addToast({
        type: 'info',
        title: 'ลบแผนที่ปัจจุบันออกแล้ว',
      });
    } catch {
      addToast({
        type: 'error',
        title: 'เกิดข้อผิดพลาดในการลบแผนที่',
      });
    }
  };

  const handleSelectPin = (pin: EquipmentPin) => {
    setSelectedPinId(pin.id);
    setIsDetailOpen(true);
    if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
  };

  const handleFocusPin = (pin: EquipmentPin) => {
    if (!floorPlan) return;
    const container = document.querySelector('.cursor-grab, .cursor-crosshair') as HTMLElement;
    if (container) {
      const { clientWidth, clientHeight } = container;
      const targetScale = Math.max(1.2, transform.scale);
      const targetPinX = pin.x * floorPlan.width * targetScale;
      const targetPinY = pin.y * floorPlan.height * targetScale;

      const translateX = clientWidth / 2 - targetPinX;
      const translateY = clientHeight / 2 - targetPinY;

      transform.scale = targetScale;
      transform.translateX = Math.round(translateX);
      transform.translateY = Math.round(translateY);
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

  const handleExportJSON = () => {
    try {
      exportProjectToJSON(floorPlan, equipment);
      addToast({
        type: 'success',
        title: 'ส่งออกข้อมูลสำเร็จ',
        message: `แผนที่และอุปกรณ์จำนวน ${equipment.length} รายการ`,
      });
    } catch (err) {
      console.error('Export failed:', err);
      addToast({
        type: 'error',
        title: 'เกิดข้อผิดพลาดในการส่งออกไฟล์',
      });
    }
  };

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

      if (importedData.floorPlan) {
        await saveFloorPlanToDB(importedData.floorPlan);
        setFloorPlan(importedData.floorPlan);
      }

      await clearAllEquipmentFromDB();
      await saveAllEquipmentToDB(importedData.equipment);
      setEquipment(importedData.equipment);

      setSelectedPinId(null);
      setIsDetailOpen(false);

      addToast({
        type: 'success',
        title: 'นำเข้าข้อมูลสำเร็จ',
        message: `โหลดแผนที่และอุปกรณ์จำนวน ${importedData.equipment.length} รายการแล้ว`,
      });
    } catch (err) {
      console.error('Import failed:', err);
      addToast({
        type: 'error',
        title: 'ไม่สามารถนำเข้าข้อมูลได้',
        message: err instanceof Error ? err.message : 'ไฟล์ JSON มีความเสียหายหรือรูปแบบผิดพลาด',
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
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-300">กำลังโหลดระบบจัดการแผนที่อุปกรณ์...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      <Header
        floorPlan={floorPlan}
        equipment={equipment}
        isAddMode={isAddMode}
        onToggleAddMode={() => {
          if (!floorPlan) {
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

      <div className="flex flex-1 relative overflow-hidden">
        <Sidebar
          floorPlan={floorPlan}
          equipment={equipment}
          selectedPinId={selectedPinId}
          hiddenTypes={hiddenTypes}
          isOpen={isSidebarOpen}
          isMobileOpen={isMobileSidebarOpen}
          onToggleOpen={() => setIsSidebarOpen((prev) => !prev)}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onSelectEquipment={handleSelectPin}
          onToggleTypeVisibility={handleToggleTypeVisibility}
          onExportJSON={handleExportJSON}
          onImportFile={handleImportFile}
          onRequestClearAllEquipment={() => setIsClearAllConfirmOpen(true)}
          onRequestClearMap={() => setIsClearMapConfirmOpen(true)}
        />

        <main className="flex-1 relative h-full w-full overflow-hidden">
          <MapCanvas
            floorPlan={floorPlan}
            equipment={equipment}
            hiddenTypes={hiddenTypes}
            selectedPinId={selectedPinId}
            isAddMode={isAddMode}
            transform={transform}
            onSelectPin={handleSelectPin}
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

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30">
            <MapToolbar
              scale={transform.scale}
              isAddMode={isAddMode}
              hasFloorPlan={Boolean(floorPlan)}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onFitToScreen={() => {
                const container = document.querySelector('.cursor-grab, .cursor-crosshair') as HTMLElement;
                if (container && floorPlan) {
                  fitToScreen(
                    container.clientWidth,
                    container.clientHeight,
                    floorPlan.width,
                    floorPlan.height
                  );
                }
              }}
              onResetView={() => {
                const container = document.querySelector('.cursor-grab, .cursor-crosshair') as HTMLElement;
                if (container && floorPlan) {
                  resetView(
                    container.clientWidth,
                    container.clientHeight,
                    floorPlan.width,
                    floorPlan.height
                  );
                }
              }}
              onToggleAddMode={() => {
                if (!floorPlan) {
                  setIsUploadModalOpen(true);
                  return;
                }
                setIsAddMode((prev) => !prev);
              }}
              onOpenUploadModal={() => setIsUploadModalOpen(true)}
            />
          </div>

          <EquipmentDetailDrawer
            pin={selectedPin}
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

      <MapUploadModal
        isOpen={isUploadModalOpen}
        hasExistingMap={Boolean(floorPlan)}
        onClose={() => setIsUploadModalOpen(false)}
        onSaveFloorPlan={handleSaveFloorPlan}
      />

      <EquipmentFormModal
        isOpen={isFormModalOpen}
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

      <Lightbox
        photos={lightboxPhotos}
        currentIndex={lightboxIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        onNavigate={(idx) => setLightboxIndex(idx)}
      />

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

      <ConfirmModal
        isOpen={isClearAllConfirmOpen}
        title="ยืนยันการล้างข้อมูลอุปกรณ์ทั้งหมด"
        message={`คุณต้องการลบจุดติดตั้งทั้งหมดจำนวน ${equipment.length} รายการใช่หรือไม่? ข้อมูลทั้งหมดจะถูกลบออกจากหน่วยความจำ`}
        confirmLabel="ล้างข้อมูลทั้งหมด"
        cancelLabel="ยกเลิก"
        isDanger={true}
        onConfirm={handleConfirmClearAll}
        onCancel={() => setIsClearAllConfirmOpen(false)}
      />

      <ConfirmModal
        isOpen={isClearMapConfirmOpen}
        title="ยืนยันการลบแผนที่ผังอาคาร"
        message="คุณต้องการลบภาพแผนที่ปัจจุบันออกใช่หรือไม่? จุดติดตั้งเดิมจะยังคงอยู่และจะแสดงเมื่อคุณอัปโหลดแผนที่ใหม่"
        confirmLabel="ลบแผนที่"
        cancelLabel="ยกเลิก"
        isDanger={true}
        onConfirm={handleConfirmClearMap}
        onCancel={() => setIsClearMapConfirmOpen(false)}
      />

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
