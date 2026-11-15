import React, { useRef, useEffect, useCallback } from 'react';
import { UploadCloud, Crosshair } from 'lucide-react';
import type { FloorPlan, EquipmentPin, MapTransform, EquipmentType } from '../../types';
import { calculateNormalizedCoords } from '../../utils/coordinates';
import { EquipmentPinMarker } from './EquipmentPinMarker';

interface MapCanvasProps {
  floorPlan: FloorPlan | null;
  equipment: EquipmentPin[];
  hiddenTypes: Set<EquipmentType>;
  selectedPinId: string | null;
  isAddMode: boolean;
  transform: MapTransform;
  onSelectPin: (pin: EquipmentPin) => void;
  onMovePin: (pinId: string, x: number, y: number) => void;
  onMapClickToAdd: (coords: { x: number; y: number }) => void;
  onWheelZoom: (deltaY: number, clientX: number, clientY: number, containerRect: DOMRect) => void;
  onStartPan: (clientX: number, clientY: number) => void;
  onUpdatePan: (clientX: number, clientY: number) => void;
  onEndPan: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent, containerRect: DOMRect) => void;
  onTouchEnd: () => void;
  onOpenUploadModal: () => void;
  onFitToScreen: (
    containerWidth: number,
    containerHeight: number,
    imageWidth: number,
    imageHeight: number
  ) => void;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({
  floorPlan,
  equipment,
  hiddenTypes,
  selectedPinId,
  isAddMode,
  transform,
  onSelectPin,
  onMovePin,
  onMapClickToAdd,
  onWheelZoom,
  onStartPan,
  onUpdatePan,
  onEndPan,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onOpenUploadModal,
  onFitToScreen,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapImageRef = useRef<HTMLImageElement>(null);
  const isMouseDownRef = useRef(false);
  const didPanRef = useRef(false);
  const panStartCoordRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (floorPlan && containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      if (clientWidth > 0 && clientHeight > 0) {
        onFitToScreen(clientWidth, clientHeight, floorPlan.width, floorPlan.height);
      }
    }
  }, [floorPlan, onFitToScreen]);

  useEffect(() => {
    const handleResize = () => {
      if (floorPlan && containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        if (clientWidth > 0 && clientHeight > 0) {
          onFitToScreen(clientWidth, clientHeight, floorPlan.width, floorPlan.height);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [floorPlan, onFitToScreen]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!floorPlan || !containerRef.current) return;
      e.preventDefault();
      const rect = containerRef.current.getBoundingClientRect();
      onWheelZoom(e.deltaY, e.clientX, e.clientY, rect);
    },
    [floorPlan, onWheelZoom]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isMouseDownRef.current = true;
    didPanRef.current = false;
    panStartCoordRef.current = { x: e.clientX, y: e.clientY };
    onStartPan(e.clientX, e.clientY);
  }, [onStartPan]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isMouseDownRef.current) return;
      const dx = Math.abs(e.clientX - panStartCoordRef.current.x);
      const dy = Math.abs(e.clientY - panStartCoordRef.current.y);
      if (dx > 3 || dy > 3) {
        didPanRef.current = true;
      }
      onUpdatePan(e.clientX, e.clientY);
    },
    [onUpdatePan]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!isMouseDownRef.current) return;
      isMouseDownRef.current = false;
      onEndPan();

      if (!didPanRef.current && isAddMode && floorPlan && mapImageRef.current) {
        const mapRect = mapImageRef.current.getBoundingClientRect();
        if (
          e.clientX >= mapRect.left &&
          e.clientX <= mapRect.right &&
          e.clientY >= mapRect.top &&
          e.clientY <= mapRect.bottom
        ) {
          const coords = calculateNormalizedCoords(e.clientX, e.clientY, mapRect);
          onMapClickToAdd(coords);
        }
      }
    },
    [isAddMode, floorPlan, onEndPan, onMapClickToAdd]
  );

  const handleTouchStartContainer = useCallback(
    (e: React.TouchEvent) => {
      onTouchStart(e);
    },
    [onTouchStart]
  );

  const handleTouchMoveContainer = useCallback(
    (e: React.TouchEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      onTouchMove(e, rect);
    },
    [onTouchMove]
  );

  const visibleEquipment = equipment.filter((eq) => !hiddenTypes.has(eq.type));

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStartContainer}
      onTouchMove={handleTouchMoveContainer}
      onTouchEnd={onTouchEnd}
      className={`relative w-full h-full overflow-hidden select-none bg-slate-950 flex items-center justify-center ${
        isAddMode ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
      }`}
      style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.05) 1px, transparent 0)`,
        backgroundSize: '24px 24px',
      }}
    >
      {isAddMode && (
        <div className="absolute top-4 inset-x-0 mx-auto w-fit z-30 pointer-events-none animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-full shadow-lg text-xs font-semibold backdrop-blur-md">
            <Crosshair className="w-4 h-4 animate-spin" />
            <span>โหมดเพิ่มจุดติดตั้ง: คลิกตำแหน่งบนแผนที่เพื่อวางจุด หรือกด Esc เพื่อยกเลิก</span>
          </div>
        </div>
      )}

      {floorPlan ? (
        <div
          style={{
            transform: `translate3d(${transform.translateX}px, ${transform.translateY}px, 0) scale(${transform.scale})`,
            transformOrigin: '0 0',
            transition: isMouseDownRef.current ? 'none' : 'transform 0.05s ease-out',
            width: `${floorPlan.width}px`,
            height: `${floorPlan.height}px`,
          }}
          className="relative shadow-2xl rounded-lg will-change-transform"
        >
          <img
            ref={mapImageRef}
            src={floorPlan.dataUrl}
            alt={floorPlan.name}
            draggable={false}
            className="w-full h-full object-contain pointer-events-none rounded-lg bg-white shadow-2xl block"
          />

          <div
            className="absolute inset-0 pointer-events-auto"
            onClick={(e) => {
              if (isAddMode) {
                e.stopPropagation();
                const mapRect = e.currentTarget.getBoundingClientRect();
                const coords = calculateNormalizedCoords(e.clientX, e.clientY, mapRect);
                onMapClickToAdd(coords);
              }
            }}
          >
            {visibleEquipment.map((pin) => (
              <EquipmentPinMarker
                key={pin.id}
                pin={pin}
                isSelected={pin.id === selectedPinId}
                mapScale={transform.scale}
                onSelect={onSelectPin}
                onMove={onMovePin}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 text-center max-w-md pointer-events-auto">
          <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5 shadow-2xl shadow-indigo-500/10">
            <UploadCloud className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">ยังไม่มีแผนที่ผังอาคาร</h2>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            เริ่มต้นใช้งานโดยการอัปโหลดไฟล์ภาพผังอาคาร (Floor Plan) ของท่าน รองรับไฟล์ PNG, JPG, JPEG
            และ SVG
          </p>
          <button
            onClick={onOpenUploadModal}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <UploadCloud className="w-5 h-5" />
            <span>อัปโหลดแผนที่ผังอาคาร</span>
          </button>
        </div>
      )}
    </div>
  );
};
