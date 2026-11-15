import React, { useRef } from 'react';
import { Download, Upload, Trash2, Database, AlertCircle } from 'lucide-react';
import type { FloorPlan } from '../../types';

interface BackupSectionProps {
  maps: FloorPlan[];
  activeMap: FloorPlan | null;
  totalEquipmentCount: number;
  activeEquipmentCount: number;
  onExport: () => void;
  onImportFile: (file: File) => void;
  onRequestClearActiveEquipment: () => void;
  onRequestClearAllData: () => void;
  onRequestClearMap: () => void;
}

export const BackupSection: React.FC<BackupSectionProps> = ({
  maps,
  activeMap,
  totalEquipmentCount,
  activeEquipmentCount,
  onExport,
  onImportFile,
  onRequestClearActiveEquipment,
  onRequestClearAllData,
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
      {/* Export / Import Box */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <Database className="w-4 h-4 text-blue-600" />
          <span>การสำรองและถ่ายโอนข้อมูล (JSON)</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          ส่งออกข้อมูลแผนที่ทั้งหมด ({maps.length} แผนที่) และจุดติดตั้งทั้งหมด ({totalEquipmentCount} จุด)
          เพื่อสำรองข้อมูลหรือถ่ายโอนไปยังเครื่องอื่น
        </p>

        {/* Export Button (Min-h 44px) */}
        <button
          onClick={onExport}
          disabled={maps.length === 0}
          className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition shadow-xs shadow-blue-600/20 cursor-pointer"
          aria-label="ส่งออกข้อมูลเป็นไฟล์ JSON (Export)"
        >
          <Download className="w-4 h-4" />
          <span>ส่งออกข้อมูลทั้งหมดเป็น JSON (Export)</span>
        </button>

        {/* Import Button (Min-h 44px) */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
          aria-label="นำเข้าข้อมูลจากไฟล์ JSON (Import)"
        >
          <Upload className="w-4 h-4 text-blue-600" />
          <span>นำเข้าข้อมูลจากไฟล์ JSON (Import)</span>
        </button>
      </div>

      {/* Storage Information */}
      <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/60 text-xs text-blue-900 space-y-1.5">
        <p className="font-semibold flex items-center gap-1.5">
          <Database className="w-4 h-4 text-blue-600" />
          <span>ระบบจัดเก็บข้อมูลในตัว (IndexedDB)</span>
        </p>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          ระบบบันทึกแผนที่ทุกแผนที่และตำแหน่งหมุดทั้งหมดลงใน IndexedDB อัตโนมัติ
          ข้อมูลของแต่ละแผนที่แยกจากกันอย่างสมบูรณ์ และข้อมูลไม่หายเมื่อรีเฟรช
        </p>
      </div>

      {/* Danger Zone */}
      <div className="border border-rose-200 bg-rose-50/40 p-4 rounded-2xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-rose-700">
          <AlertCircle className="w-4 h-4" />
          <span>การจัดการข้อมูลความเสี่ยงสูง</span>
        </div>

        {activeMap && (
          <button
            onClick={onRequestClearActiveEquipment}
            disabled={activeEquipmentCount === 0}
            className="w-full min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-100 text-xs font-semibold border border-rose-200 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            aria-label={`ลบหมุดเฉพาะบน ${activeMap.name}`}
          >
            <Trash2 className="w-4 h-4" />
            <span>ลบหมุดเฉพาะบน {activeMap.name} ({activeEquipmentCount})</span>
          </button>
        )}

        {activeMap && (
          <button
            onClick={onRequestClearMap}
            className="w-full min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-200 text-xs font-medium border border-slate-300 transition cursor-pointer"
            aria-label={`ลบแผนที่ ${activeMap.name}`}
          >
            <span>ลบแผนที่ปัจจุบัน ({activeMap.name})</span>
          </button>
        )}

        <button
          onClick={onRequestClearAllData}
          disabled={maps.length === 0}
          className="w-full min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-rose-700 hover:bg-rose-100 text-xs font-bold border border-rose-300 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          aria-label="ล้างข้อมูลแผนที่และหมุดทั้งหมดในระบบ"
        >
          <span>ล้างข้อมูลทั้งหมดในระบบ</span>
        </button>
      </div>
    </div>
  );
};
