import React, { useRef, useEffect, useCallback } from 'react';
import { UploadCloud, Crosshair } from 'lucide-react';
import type { FloorPlan, EquipmentPin, MapTransform, EquipmentType } from '../../types';
import { calculateNormalizedCoords } from '../../utils/coordinates';
import { EquipmentPinMarker } from './EquipmentPinMarker';

interface MapCanvasProps {
  floorPlan: FloorPlan | null;
  equipment: EquipmentPin[]; // Pins belonging only to this map
  hiddenTypes: Set<EquipmentType>;
  selectedPinId: string | null;
  isAddMode: boolean;
  canDragPins?: boolean;
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
  canDragPins = true,
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

  // Auto-fit to screen whenever map changes
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
      className={`relative w-full h-full overflow-hidden select-none bg-slate-100 flex items-center justify-center ${
        isAddMode ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
      }`}
      style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(100, 116, 139, 0.15) 1px, transparent 0)`,
        backgroundSize: '24px 24px',
      }}
    >
      {/* Floating Add Mode Banner */}
      {isAddMode && (
        <div className="absolute top-4 inset-x-0 mx-auto w-fit z-30 pointer-events-none animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white rounded-full shadow-lg text-xs sm:text-sm font-semibold">
            <Crosshair className="w-4 h-4 animate-spin" />
            <span>โหมดเพิ่มจุดติดตั้ง: คลิกตำแหน่งบนแผนที่เพื่อวางจุด หรือกด Esc เพื่อยกเลิก</span>
          </div>
        </div>
      )}

      {/* When Floor Plan is Available */}
      {floorPlan ? (
        <div
          style={{
            transform: `translate3d(${transform.translateX}px, ${transform.translateY}px, 0) scale(${transform.scale})`,
            transformOrigin: '0 0',
            transition: isMouseDownRef.current ? 'none' : 'transform 0.05s ease-out',
            width: `${floorPlan.width}px`,
            height: `${floorPlan.height}px`,
          }}
          className="relative shadow-xl rounded-lg will-change-transform border border-slate-300/60 bg-white"
        >
          {/* Floor Plan Image */}
          <img
            ref={mapImageRef}
            src={floorPlan.dataUrl}
            alt={floorPlan.name}
            draggable={false}
            className="w-full h-full object-contain pointer-events-none rounded-lg bg-white block"
          />

          {/* Interactive Pins Layer (Matches Map Dimensions Exactly) */}
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
                canDrag={canDragPins}
                onSelect={onSelectPin}
                onMove={onMovePin}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Empty State: Prompt to Upload First Map */
        <div className="flex flex-col items-center justify-center p-8 text-center max-w-md pointer-events-auto bg-white rounded-3xl border border-slate-200 shadow-xl mx-4">
          <div className="w-20 h-20 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 shadow-xs">
            <UploadCloud className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">ยังไม่มีแผนที่ในระบบ</h2>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            เริ่มต้นใช้งานโดยการเพิ่มแผนที่ผังอาคารแรกของคุณ (เช่น ชั้น 1, ชั้น 2, อาคาร A) รองรับไฟล์
            PNG, JPG, JPEG และ SVG
          </p>
          <button
            onClick={onOpenUploadModal}
            className="min-h-[44px] flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition shadow-md shadow-blue-600/20 hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="เพิ่มแผนที่แรก"
          >
            <UploadCloud className="w-5 h-5" />
            <span>เพิ่มแผนที่แรก</span>
          </button>
        </div>
      )}
    </div>
  );
};
