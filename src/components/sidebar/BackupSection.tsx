import React, { useRef } from 'react';
import { Download, Upload, Trash2, Database, AlertCircle } from 'lucide-react';
import type { FloorPlan, EquipmentPin } from '../../types';

interface BackupSectionProps {
  floorPlan: FloorPlan | null;
  equipment: EquipmentPin[];
  onExport: () => void;
  onImportFile: (file: File) => void;
  onRequestClearAllEquipment: () => void;
  onRequestClearMap: () => void;
}

export const BackupSection: React.FC<BackupSectionProps> = ({
  floorPlan,
  equipment,
  onExport,
  onImportFile,
  onRequestClearAllEquipment,
  onRequestClearMap,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportFile(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
          <Database className="w-4 h-4 text-indigo-500" />
          <span>การสำรองและถ่ายโอนข้อมูล (JSON)</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          ส่งออกข้อมูลแผนที่ รูปภาพ และจุดติดตั้งทั้งหมดเป็นไฟล์ JSON เพื่อสำรองข้อมูล
          หรือนำเข้าข้อมูลในเครื่องอื่น
        </p>

        <button
          onClick={onExport}
          disabled={!floorPlan && equipment.length === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition shadow-sm shadow-indigo-600/20 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>ส่งออกข้อมูลเป็นไฟล์ JSON (Export)</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
        >
          <Upload className="w-4 h-4 text-indigo-500" />
          <span>นำเข้าข้อมูลจากไฟล์ JSON (Import)</span>
        </button>
      </div>

      <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 text-xs text-indigo-900 dark:text-indigo-300 space-y-1.5">
        <p className="font-semibold flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-indigo-500" />
          <span>การจัดเก็บข้อมูลอัตโนมัติ (IndexedDB)</span>
        </p>
        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
          ระบบจะบันทึกข้อมูลแผนที่ ตำแหน่งหมุด และรูปภาพลงใน IndexedDB ของเบราว์เซอร์อัตโนมัติ
          เมื่อรีเฟรชหน้าจอข้อมูลจะไม่สูญหาย
        </p>
      </div>

      <div className="border border-rose-200 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/10 p-4 rounded-2xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-400">
          <AlertCircle className="w-4 h-4" />
          <span>การจัดการข้อมูลความเสี่ยงสูง</span>
        </div>

        <button
          onClick={onRequestClearAllEquipment}
          disabled={equipment.length === 0}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-xs font-medium border border-rose-200 dark:border-rose-900/40 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>ลบจุดติดตั้งทั้งหมด ({equipment.length})</span>
        </button>

        {floorPlan && (
          <button
            onClick={onRequestClearMap}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-800 transition cursor-pointer"
          >
            <span>ลบแผนที่ปัจจุบันออก</span>
          </button>
        )}
      </div>
    </div>
  );
};
