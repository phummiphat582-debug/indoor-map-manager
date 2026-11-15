import React from 'react';
import {
  X,
  Edit3,
  Trash2,
  Calendar,
  MapPin,
  Building2,
  Tag,
  FileText,
  Camera,
  Crosshair,
  Image as ImageIcon,
} from 'lucide-react';
import type { EquipmentPin, EquipmentPhoto } from '../../types';
import { EQUIPMENT_TYPES, EQUIPMENT_STATUSES } from '../../constants/equipmentConfig';

interface EquipmentDetailDrawerProps {
  pin: EquipmentPin | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (pin: EquipmentPin) => void;
  onDeleteRequest: (pin: EquipmentPin) => void;
  onFocusPin: (pin: EquipmentPin) => void;
  onOpenLightbox: (photos: EquipmentPhoto[], index: number) => void;
}

export const EquipmentDetailDrawer: React.FC<EquipmentDetailDrawerProps> = ({
  pin,
  isOpen,
  onClose,
  onEdit,
  onDeleteRequest,
  onFocusPin,
  onOpenLightbox,
}) => {
  if (!isOpen || !pin) return null;

  const typeConfig = EQUIPMENT_TYPES[pin.type] || EQUIPMENT_TYPES.cctv;
  const statusConfig = EQUIPMENT_STATUSES[pin.status] || EQUIPMENT_STATUSES.normal;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-drawer-title"
      className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 md:w-[420px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-all duration-300 animate-in slide-in-from-right"
    >
      {/* Top Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md text-2xl border border-white/20"
            style={{ backgroundColor: typeConfig.colorHex }}
          >
            <span>{typeConfig.emoji}</span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${typeConfig.badgeBg}`}
              >
                {typeConfig.label}
              </span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusConfig.bgClass}`}
              >
                {statusConfig.label}
              </span>
            </div>
            <h2
              id="detail-drawer-title"
              className="text-base font-bold text-slate-900 dark:text-white mt-1 truncate"
            >
              {pin.name}
            </h2>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400">{pin.code}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          aria-label="ปิดหน้ารายละเอียด"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm">
        {/* Quick action bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onFocusPin(pin)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition cursor-pointer"
          >
            <Crosshair className="w-3.5 h-3.5 text-indigo-500" />
            <span>โฟกัสจุดบนแผนที่</span>
          </button>
          <button
            onClick={() => onEdit(pin)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-semibold transition border border-indigo-200 dark:border-indigo-800/60 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>แก้ไขข้อมูล</span>
          </button>
        </div>

        {/* Detailed Info Cards */}
        <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80">
          {/* Location / Zone */}
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-400">ตำแหน่ง / โซน</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{pin.zone || '-'}</p>
            </div>
          </div>

          {/* Building / Floor */}
          <div className="flex items-start gap-3">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-400">ชั้น / อาคาร</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {pin.buildingFloor || '-'}
              </p>
            </div>
          </div>

          {/* Install Date */}
          <div className="flex items-start gap-3">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-400">วันที่ติดตั้ง</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {pin.installDate || '-'}
              </p>
            </div>
          </div>

          {/* Normalized Coordinates */}
          <div className="flex items-start gap-3">
            <Tag className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-400">พิกัดสัมพัทธ์บนแผนที่ (Normalized)</p>
              <p className="text-xs font-mono text-slate-600 dark:text-slate-300">
                X: {(pin.x * 100).toFixed(2)}% | Y: {(pin.y * 100).toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Notes */}
          {pin.notes && (
            <div className="flex items-start gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-slate-400">หมายเหตุ</p>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {pin.notes}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Real Equipment Photos Gallery */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-indigo-500" />
              <span>รูปภาพจริงของอุปกรณ์</span>
              <span className="text-slate-400 font-normal">({pin.photos?.length || 0})</span>
            </h4>
          </div>

          {!pin.photos || pin.photos.length === 0 ? (
            <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-center">
              <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">ยังไม่มีรูปภาพ</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                สามารถกดแก้ไขข้อมูลเพื่ออัปโหลดรูปภาพได้
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {pin.photos.map((photo, index) => (
                <div
                  key={photo.id || index}
                  onClick={() => onOpenLightbox(pin.photos, index)}
                  className="relative group rounded-xl overflow-hidden aspect-video border border-slate-200 dark:border-slate-700 bg-slate-900 shadow-sm cursor-pointer hover:border-indigo-500 transition"
                >
                  <img
                    src={photo.dataUrl}
                    alt={photo.name}
                    className="w-full h-full object-cover transition duration-150 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[11px] text-white font-medium bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-sm">
                      ดูรูปขนาดเต็ม
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer delete action */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
        <button
          onClick={() => onDeleteRequest(pin)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium transition cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          <span>ลบจุดติดตั้งนี้</span>
        </button>

        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium transition cursor-pointer"
        >
          ปิด
        </button>
      </div>
    </div>
  );
};
