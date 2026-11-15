import React from 'react';
import { Map, Menu, Plus, Upload, Download, Image as ImageIcon } from 'lucide-react';
import type { FloorPlan, EquipmentPin } from '../types';

interface HeaderProps {
  floorPlan: FloorPlan | null;
  equipment: EquipmentPin[];
  isAddMode: boolean;
  onToggleAddMode: () => void;
  onOpenUploadModal: () => void;
  onOpenMobileSidebar: () => void;
  onExportJSON: () => void;
  onImportClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  floorPlan,
  equipment,
  isAddMode,
  onToggleAddMode,
  onOpenUploadModal,
  onOpenMobileSidebar,
  onExportJSON,
  onImportClick,
}) => {
  return (
    <header className="h-16 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white shrink-0 z-30 select-none">
      {/* Left: Mobile Toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
          aria-label="เปิดเมนูแถบข้าง"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <Map className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>ระบบจัดการแผนที่ติดตั้งอุปกรณ์</span>
              <span className="hidden sm:inline-block text-[11px] font-normal px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
                v1.0
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {floorPlan ? (
                <span>
                  แผนที่: <strong className="text-slate-300">{floorPlan.name}</strong> ({equipment.length} จุดติดตั้ง)
                </span>
              ) : (
                'ยังไม่ได้อัปโหลดแผนที่ผังอาคาร'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Right: Quick Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Quick Add Pin Button */}
        <button
          onClick={onToggleAddMode}
          disabled={!floorPlan}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            isAddMode
              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">
            {isAddMode ? 'คลิกบนแผนที่เพื่อวางจุด' : 'เพิ่มจุดติดตั้ง'}
          </span>
          <span className="sm:hidden">{isAddMode ? 'กำลังวาง' : 'เพิ่มจุด'}</span>
        </button>

        {/* Upload Map Button */}
        <button
          onClick={onOpenUploadModal}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
        >
          <ImageIcon className="w-4 h-4 text-indigo-400" />
          <span>{floorPlan ? 'เปลี่ยนแผนที่' : 'อัปโหลดแผนที่'}</span>
        </button>

        {/* Export JSON Quick */}
        <button
          onClick={onExportJSON}
          disabled={!floorPlan && equipment.length === 0}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="ส่งออกไฟล์สำรอง JSON"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Export</span>
        </button>

        {/* Import JSON Quick */}
        <button
          onClick={onImportClick}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
          title="นำเข้าไฟล์สำรอง JSON"
        >
          <Upload className="w-4 h-4 text-sky-400" />
          <span>Import</span>
        </button>
      </div>
    </header>
  );
};
