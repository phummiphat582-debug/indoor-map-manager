import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, Plus, Layers, Crosshair } from 'lucide-react';

interface MapToolbarProps {
  scale: number;
  isAddMode: boolean;
  hasFloorPlan: boolean;
  canAddPin?: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  onResetView: () => void;
  onToggleAddMode: () => void;
  onOpenUploadModal: () => void;
}

export const MapToolbar: React.FC<MapToolbarProps> = ({
  scale,
  isAddMode,
  hasFloorPlan,
  canAddPin = true,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onResetView,
  onToggleAddMode,
  onOpenUploadModal,
}) => {
  const zoomPercentage = Math.round(scale * 100);

  return (
    <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/90 select-none pointer-events-auto">
      {/* Add Pin Button (Min-h 44px, Orange Accent) */}
      <button
        onClick={onToggleAddMode}
        disabled={!hasFloorPlan || !canAddPin}
        title={
          !canAddPin
            ? 'เฉพาะผู้มีสิทธิ์แก้ไข (Editor / Admin)'
            : isAddMode
            ? 'ยกเลิกโหมดเพิ่มจุด (Esc)'
            : 'เพิ่มจุดติดตั้งอุปกรณ์บนแผนที่นี้'
        }
        aria-label={isAddMode ? 'ยกเลิกโหมดเพิ่มจุด (Esc)' : 'เพิ่มจุดติดตั้งอุปกรณ์บนแผนที่นี้'}
        className={`min-h-[44px] flex items-center gap-2 px-4 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs ${
          isAddMode
            ? 'bg-amber-500 hover:bg-amber-600 text-white ring-2 ring-amber-400'
            : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/20'
        }`}
      >
        {isAddMode ? <Crosshair className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        <span className="hidden sm:inline">
          {isAddMode ? 'คลิกบนแผนที่เพื่อวางจุด' : 'เพิ่มจุดติดตั้ง'}
        </span>
        <span className="sm:hidden">{isAddMode ? 'วางจุด' : 'เพิ่มจุด'}</span>
      </button>

      <div className="h-6 w-px bg-slate-200 mx-1" />

      {/* Zoom In (Min-h 44px) */}
      <button
        onClick={onZoomIn}
        disabled={!hasFloorPlan}
        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        title="ซูมเข้า (+)"
        aria-label="ซูมเข้า"
      >
        <ZoomIn className="w-5 h-5" />
      </button>

      {/* Zoom Indicator */}
      <span
        onClick={onResetView}
        title="คลิกเพื่อรีเซ็ตขนาด 100%"
        aria-label={`ระดับการซูมปัจจุบัน ${zoomPercentage}% คลิกเพื่อรีเซ็ต`}
        className="min-h-[44px] flex items-center justify-center px-2.5 text-xs font-mono font-bold text-slate-700 hover:text-blue-600 cursor-pointer rounded-xl hover:bg-slate-100 transition"
      >
        {zoomPercentage}%
      </span>

      {/* Zoom Out (Min-h 44px) */}
      <button
        onClick={onZoomOut}
        disabled={!hasFloorPlan}
        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        title="ซูมออก (-)"
        aria-label="ซูมออก"
      >
        <ZoomOut className="w-5 h-5" />
      </button>

      {/* Fit to Screen (Min-h 44px) */}
      <button
        onClick={onFitToScreen}
        disabled={!hasFloorPlan}
        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        title="ปรับให้พอดีหน้าจอ (Fit to Screen)"
        aria-label="ปรับให้พอดีหน้าจอ"
      >
        <Maximize2 className="w-5 h-5" />
      </button>

      {/* Reset View 1:1 (Min-h 44px) */}
      <button
        onClick={onResetView}
        disabled={!hasFloorPlan}
        className="min-h-[44px] min-w-[44px] hidden sm:flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        title="รีเซ็ตมุมมอง 100%"
        aria-label="รีเซ็ตมุมมอง 100%"
      >
        <RotateCcw className="w-5 h-5" />
      </button>

      <div className="h-6 w-px bg-slate-200 mx-1" />

      {/* Upload/Add New Map (Min-h 44px) */}
      <button
        onClick={onOpenUploadModal}
        className="min-h-[44px] flex items-center gap-1.5 px-3 rounded-xl text-slate-700 hover:text-blue-600 hover:bg-slate-100 text-xs sm:text-sm font-medium transition cursor-pointer"
        title="เพิ่มแผนที่ผังอาคารใหม่"
        aria-label="เพิ่มแผนที่ผังอาคารใหม่"
      >
        <Layers className="w-4 h-4 text-blue-600" />
        <span className="hidden md:inline">เพิ่มแผนที่</span>
      </button>
    </div>
  );
};
