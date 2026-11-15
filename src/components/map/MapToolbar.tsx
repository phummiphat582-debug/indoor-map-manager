import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, Plus, Image as ImageIcon, Crosshair } from 'lucide-react';

interface MapToolbarProps {
  scale: number;
  isAddMode: boolean;
  hasFloorPlan: boolean;
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
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onResetView,
  onToggleAddMode,
  onOpenUploadModal,
}) => {
  const zoomPercentage = Math.round(scale * 100);

  return (
    <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800/80 select-none pointer-events-auto">
      {/* Add Pin Button */}
      <button
        onClick={onToggleAddMode}
        disabled={!hasFloorPlan}
        title={isAddMode ? 'ยกเลิกโหมดเพิ่มจุด (Esc)' : 'เพิ่มจุดติดตั้งอุปกรณ์บนแผนที่'}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
          isAddMode
            ? 'bg-amber-500 hover:bg-amber-600 text-white ring-4 ring-amber-500/30 animate-pulse-subtle'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
        }`}
      >
        {isAddMode ? <Crosshair className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        <span className="hidden sm:inline">
          {isAddMode ? 'คลิกบนแผนที่เพื่อวางจุด' : 'เพิ่มจุดติดตั้ง'}
        </span>
        <span className="sm:hidden">{isAddMode ? 'วางจุด' : 'เพิ่ม'}</span>
      </button>

      <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

      {/* Zoom In */}
      <button
        onClick={onZoomIn}
        disabled={!hasFloorPlan}
        className="p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        title="ซูมเข้า (+)"
        aria-label="ซูมเข้า"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      {/* Zoom Indicator */}
      <span
        onClick={onResetView}
        title="คลิกเพื่อรีเซ็ตขนาด 100%"
        className="px-2 py-1 text-xs font-mono font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
      >
        {zoomPercentage}%
      </span>

      {/* Zoom Out */}
      <button
        onClick={onZoomOut}
        disabled={!hasFloorPlan}
        className="p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        title="ซูมออก (-)"
        aria-label="ซูมออก"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      {/* Fit to Screen */}
      <button
        onClick={onFitToScreen}
        disabled={!hasFloorPlan}
        className="p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        title="พอดีหน้าจอ (Fit to Screen)"
        aria-label="ปรับให้พอดีหน้าจอ"
      >
        <Maximize2 className="w-4 h-4" />
      </button>

      {/* Reset View */}
      <button
        onClick={onResetView}
        disabled={!hasFloorPlan}
        className="p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hidden sm:block"
        title="รีเซ็ตมุมมอง 100%"
        aria-label="รีเซ็ตมุมมอง"
      >
        <RotateCcw className="w-4 h-4" />
      </button>

      <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

      {/* Upload / Change Map */}
      <button
        onClick={onOpenUploadModal}
        className="flex items-center gap-1.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-medium transition cursor-pointer"
        title="อัปโหลดหรือเปลี่ยนแผนที่ใหม่"
      >
        <ImageIcon className="w-4 h-4 text-indigo-500" />
        <span className="hidden md:inline">{hasFloorPlan ? 'เปลี่ยนแผนที่' : 'อัปโหลดแผนที่'}</span>
      </button>
    </div>
  );
};
