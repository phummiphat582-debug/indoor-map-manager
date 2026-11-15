import React from 'react';
import { Map, Menu, Plus, Upload, Download, Layers, ChevronDown } from 'lucide-react';
import type { FloorPlan, EquipmentPin } from '../types';

interface HeaderProps {
  maps: FloorPlan[];
  activeMap: FloorPlan | null;
  equipment: EquipmentPin[]; // Pins belonging to the active map
  isAddMode: boolean;
  onSelectMap: (mapId: string) => void;
  onToggleAddMode: () => void;
  onOpenUploadModal: () => void;
  onOpenMobileSidebar: () => void;
  onExportJSON: () => void;
  onImportClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  maps,
  activeMap,
  equipment,
  isAddMode,
  onSelectMap,
  onToggleAddMode,
  onOpenUploadModal,
  onOpenMobileSidebar,
  onExportJSON,
  onImportClick,
}) => {
  return (
    <header className="min-h-[64px] px-3 sm:px-5 bg-white border-b border-slate-200 flex items-center justify-between text-slate-800 shrink-0 z-30 select-none shadow-xs">
      {/* Left: Mobile Menu & Logo/Title */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        <button
          onClick={onOpenMobileSidebar}
          className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          aria-label="เปิดเมนูแถบข้าง"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <Map className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2 truncate">
              <span className="truncate">ระบบจัดการแผนที่ติดตั้งอุปกรณ์</span>
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:flex items-center gap-2">
              <span>{maps.length} แผนที่ในระบบ</span>
              {activeMap && (
                <>
                  <span className="text-slate-300">•</span>
                  <span>กำลังดู: <strong className="text-slate-700">{activeMap.name}</strong> ({equipment.length} จุด)</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Middle: Map Switcher Dropdown (when 2+ maps exist) */}
      {maps.length > 0 && (
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <Layers className="w-4 h-4 text-slate-500 ml-2" />
          <div className="relative">
            <select
              value={activeMap?.id || ''}
              onChange={(e) => onSelectMap(e.target.value)}
              className="min-h-[38px] pl-2 pr-8 text-xs font-semibold text-slate-800 bg-transparent rounded-lg focus:outline-none cursor-pointer appearance-none"
              aria-label="เลือกแผนที่ที่ต้องการดู"
            >
              {maps.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Right: Quick Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Add Pin Button (Vibrant Orange Accent) */}
        <button
          onClick={onToggleAddMode}
          disabled={!activeMap}
          className={`min-h-[44px] flex items-center gap-2 px-4 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs ${
            isAddMode
              ? 'bg-amber-500 hover:bg-amber-600 text-white ring-2 ring-amber-400'
              : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/20'
          }`}
          aria-label={isAddMode ? 'คลิกบนแผนที่เพื่อวางจุด หรือกด Esc เพื่อยกเลิก' : 'เพิ่มจุดติดตั้งอุปกรณ์บนแผนที่'}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">
            {isAddMode ? 'คลิกบนแผนที่เพื่อวางจุด' : 'เพิ่มจุดติดตั้ง'}
          </span>
          <span className="sm:hidden">{isAddMode ? 'กำลังวาง' : 'เพิ่มจุด'}</span>
        </button>

        {/* Add Map Button (Solid Blue Accent) */}
        <button
          onClick={onOpenUploadModal}
          className="min-h-[44px] hidden sm:flex items-center gap-1.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition cursor-pointer shadow-xs shadow-blue-600/10"
          aria-label="เพิ่มแผนที่ใหม่"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มแผนที่</span>
        </button>

        {/* Export JSON Quick */}
        <button
          onClick={onExportJSON}
          disabled={maps.length === 0}
          className="min-h-[44px] hidden md:flex items-center gap-1.5 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="ส่งออกไฟล์สำรอง JSON ทั้งหมด"
          aria-label="ส่งออกไฟล์สำรอง JSON"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          <span>Export</span>
        </button>

        {/* Import JSON Quick */}
        <button
          onClick={onImportClick}
          className="min-h-[44px] hidden md:flex items-center gap-1.5 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer"
          title="นำเข้าไฟล์สำรอง JSON"
          aria-label="นำเข้าไฟล์สำรอง JSON"
        >
          <Upload className="w-4 h-4 text-blue-600" />
          <span>Import</span>
        </button>
      </div>
    </header>
  );
};
