import React, { useState, useRef, useCallback } from 'react';
import type { EquipmentPin } from '../../types';
import { EQUIPMENT_TYPES, EQUIPMENT_STATUSES } from '../../constants/equipmentConfig';
import { clamp } from '../../utils/coordinates';

interface EquipmentPinMarkerProps {
  pin: EquipmentPin;
  isSelected: boolean;
  mapScale: number;
  canDrag?: boolean;
  onSelect: (pin: EquipmentPin) => void;
  onMove: (pinId: string, newX: number, newY: number) => void;
}

export const EquipmentPinMarker: React.FC<EquipmentPinMarkerProps> = ({
  pin,
  isSelected,
  mapScale,
  canDrag = true,
  onSelect,
  onMove,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const dragStartPosRef = useRef<{ clientX: number; clientY: number }>({ clientX: 0, clientY: 0 });
  const hasMovedRef = useRef(false);

  const typeConfig = EQUIPMENT_TYPES[pin.type] || EQUIPMENT_TYPES.cctv;
  const statusConfig = EQUIPMENT_STATUSES[pin.status] || EQUIPMENT_STATUSES.normal;

  // ปรับขนาดหมุดตาม scale เล็กน้อยเพื่อให้มองเห็นง่ายแต่ไม่ใหญ่ล้น
  const pinScale = Math.max(0.65, Math.min(1.4, 1 / Math.sqrt(mapScale)));

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    if (!canDrag) {
      onSelect(pin);
      return;
    }

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    dragStartPosRef.current = { clientX: e.clientX, clientY: e.clientY };
    hasMovedRef.current = false;
    setIsDragging(true);
    setDragOffset({ x: pin.x, y: pin.y });
  }, [canDrag, onSelect, pin]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      e.stopPropagation();

      const dx = Math.abs(e.clientX - dragStartPosRef.current.clientX);
      const dy = Math.abs(e.clientY - dragStartPosRef.current.clientY);

      if (dx > 3 || dy > 3) {
        hasMovedRef.current = true;
      }

      const mapContainer = (e.currentTarget.parentElement as HTMLElement)?.getBoundingClientRect();
      if (!mapContainer || mapContainer.width <= 0 || mapContainer.height <= 0) return;

      const relativeX = e.clientX - mapContainer.left;
      const relativeY = e.clientY - mapContainer.top;

      const newX = clamp(relativeX / mapContainer.width, 0, 1);
      const newY = clamp(relativeY / mapContainer.height, 0, 1);

      setDragOffset({ x: newX, y: newY });
    },
    [isDragging]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      e.stopPropagation();

      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }

      setIsDragging(false);

      if (hasMovedRef.current && dragOffset) {
        const roundedX = Math.round(dragOffset.x * 1000000) / 1000000;
        const roundedY = Math.round(dragOffset.y * 1000000) / 1000000;
        onMove(pin.id, roundedX, roundedY);
      } else {
        onSelect(pin);
      }

      setDragOffset(null);
    },
    [isDragging, dragOffset, onMove, onSelect, pin]
  );

  const currentX = dragOffset ? dragOffset.x : pin.x;
  const currentY = dragOffset ? dragOffset.y : pin.y;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${typeConfig.label}: ${pin.name} (${pin.code})`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(pin);
        }
      }}
      style={{
        position: 'absolute',
        left: `${currentX * 100}%`,
        top: `${currentY * 100}%`,
        transform: `translate(-50%, -100%) scale(${pinScale})`,
        transformOrigin: 'bottom center',
        zIndex: isDragging ? 50 : isSelected ? 40 : 20,
      }}
      className={`group select-none transition-shadow touch-none ${
        canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      } ${isDragging ? 'opacity-90 scale-110' : ''}`}
    >
      {/* Pin Body */}
      <div
        className={`relative flex items-center justify-center w-10 h-10 rounded-full shadow-lg border-2 transition-all duration-150 ${
          isSelected
            ? 'ring-4 ring-offset-2 ring-indigo-500 scale-110 shadow-indigo-500/50'
            : 'hover:scale-110 hover:shadow-xl'
        }`}
        style={{
          backgroundColor: typeConfig.colorHex,
          borderColor: '#ffffff',
        }}
      >
        <span className="text-lg leading-none select-none drop-shadow-sm pointer-events-none">
          {typeConfig.emoji}
        </span>

        <span
          className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm pointer-events-none"
          style={{ backgroundColor: statusConfig.colorHex }}
          title={`สถานะ: ${statusConfig.label}`}
        />

        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] pointer-events-none"
          style={{ borderTopColor: typeConfig.colorHex }}
        />
      </div>

      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-1.5 py-0.5 bg-slate-900/90 text-white rounded text-[10px] font-mono whitespace-nowrap shadow-md pointer-events-none border border-slate-700/50">
        {pin.code}
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 min-w-[160px] max-w-xs bg-slate-900 text-white rounded-xl p-2.5 shadow-2xl border border-slate-700/80 text-xs text-left">
        <div className="flex items-center gap-1.5 mb-1 font-semibold text-slate-100 truncate">
          <span>{typeConfig.emoji}</span>
          <span className="truncate">{pin.name}</span>
        </div>
        <div className="text-[11px] text-slate-300 space-y-0.5">
          <p>
            <span className="text-slate-400">รหัส:</span> {pin.code}
          </p>
          {pin.zone && (
            <p className="truncate">
              <span className="text-slate-400">โซน:</span> {pin.zone}
            </p>
          )}
          <p className="flex items-center gap-1 pt-1 border-t border-slate-800">
            <span
              className="w-2 h-2 rounded-full inline-block shrink-0"
              style={{ backgroundColor: statusConfig.colorHex }}
            />
            <span className="text-slate-200">{statusConfig.label}</span>
          </p>
        </div>
      </div>
    </div>
  );
};
