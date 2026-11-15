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
  UserCheck,
  Lock,
} from 'lucide-react';
import type { EquipmentPin, EquipmentPhoto, UserProfile } from '../../types';
import { EQUIPMENT_TYPES, EQUIPMENT_STATUSES } from '../../constants/equipmentConfig';
import { canEditEquipment, canDeleteEquipment } from '../../services/auth';

interface EquipmentDetailDrawerProps {
  pin: EquipmentPin | null;
  mapName?: string;
  isOpen: boolean;
  currentUser: UserProfile;
  onClose: () => void;
  onEdit: (pin: EquipmentPin) => void;
  onDeleteRequest: (pin: EquipmentPin) => void;
  onFocusPin: (pin: EquipmentPin) => void;
  onOpenLightbox: (photos: EquipmentPhoto[], index: number) => void;
}

export const EquipmentDetailDrawer: React.FC<EquipmentDetailDrawerProps> = ({
  pin,
  mapName,
  isOpen,
  currentUser,
  onClose,
  onEdit,
  onDeleteRequest,
  onFocusPin,
  onOpenLightbox,
}) => {
  if (!isOpen || !pin) return null;

  const typeConfig = EQUIPMENT_TYPES[pin.type] || EQUIPMENT_TYPES.cctv;
  const statusConfig = EQUIPMENT_STATUSES[pin.status] || EQUIPMENT_STATUSES.normal;
  const hasEditPermission = canEditEquipment(currentUser);
  const hasDeletePermission = canDeleteEquipment(currentUser);

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
        onClick={onClose}
      />

      {/* Drawer Container: Bottom Sheet on Mobile, Side Panel on Desktop */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-drawer-title"
        className="fixed z-40 bg-white border-slate-200 shadow-2xl flex flex-col transition-all duration-300 animate-in
          inset-x-0 bottom-0 rounded-t-3xl max-h-[85vh] border-t slide-in-from-bottom
          md:inset-y-0 md:right-0 md:left-auto md:w-96 md:lg:w-[420px] md:rounded-none md:max-h-none md:border-l md:border-t-0 md:slide-in-from-right"
      >
        {/* Mobile Pull Handle */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 mb-1 md:hidden" />

        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs text-2xl border border-white"
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
                className="text-base font-bold text-slate-900 mt-1 truncate"
              >
                {pin.name}
              </h2>
              <p className="text-xs font-mono text-slate-500">
                {pin.code} {mapName && `• บน ${mapName}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer -mr-2 -mt-2"
            aria-label="ปิดหน้ารายละเอียด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body (Single Smooth Scroll) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-sm">
          {/* Quick Action Buttons (Min-h 44px) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onFocusPin(pin)}
              className="flex-1 min-h-[44px] flex items-center justify-center gap-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition cursor-pointer"
              aria-label="โฟกัสตำแหน่งหมุดบนแผนที่"
            >
              <Crosshair className="w-4 h-4 text-blue-600" />
              <span>โฟกัสบนแผนที่</span>
            </button>

            {hasEditPermission ? (
              <button
                onClick={() => onEdit(pin)}
                className="flex-1 min-h-[44px] flex items-center justify-center gap-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition border border-blue-200 cursor-pointer"
                aria-label="แก้ไขข้อมูลจุดติดตั้ง"
              >
                <Edit3 className="w-4 h-4" />
                <span>แก้ไขข้อมูล</span>
              </button>
            ) : (
              <div className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 px-3 rounded-xl bg-slate-100 text-slate-400 text-xs font-medium border border-slate-200">
                <Lock className="w-3.5 h-3.5" />
                <span>เฉพาะผู้มีสิทธิ์แก้ไข</span>
              </div>
            )}
          </div>

          {/* Real-time Metadata (Last Edited By & Time) */}
          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                แก้ไขล่าสุด:{' '}
                <strong className="text-slate-800">{pin.updatedBy || 'ระบบส่วนกลาง'}</strong>
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              {new Date(pin.updatedAt).toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              น.
            </span>
          </div>

          {/* Details Card */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            {/* Location / Zone */}
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-slate-400">ตำแหน่ง / โซน</p>
                <p className="text-sm font-medium text-slate-800">{pin.zone || '-'}</p>
              </div>
            </div>

            {/* Building / Floor */}
            <div className="flex items-start gap-3">
              <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-slate-400">ชั้น / อาคาร</p>
                <p className="text-sm font-medium text-slate-800">{pin.buildingFloor || '-'}</p>
              </div>
            </div>

            {/* Install Date */}
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-slate-400">วันที่ติดตั้ง</p>
                <p className="text-sm font-medium text-slate-800">{pin.installDate || '-'}</p>
              </div>
            </div>

            {/* Coordinates */}
            <div className="flex items-start gap-3">
              <Tag className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-slate-400">พิกัดสัมพัทธ์ (Normalized)</p>
                <p className="font-mono text-slate-700">
                  X: {(pin.x * 100).toFixed(2)}% | Y: {(pin.y * 100).toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Notes */}
            {pin.notes && (
              <div className="flex items-start gap-3 pt-2 border-t border-slate-200">
                <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-400">หมายเหตุ</p>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{pin.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Real Equipment Photos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>รูปภาพจริงของอุปกรณ์</span>
                <span className="text-slate-400 font-normal">({pin.photos?.length || 0})</span>
              </h4>
            </div>

            {!pin.photos || pin.photos.length === 0 ? (
              <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-center">
                <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-500">ยังไม่มีรูปภาพ</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  กดปุ่ม &quot;แก้ไขข้อมูล&quot; เพื่ออัปโหลดรูปภาพจริงของอุปกรณ์
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {pin.photos.map((photo, index) => (
                  <div
                    key={photo.id || index}
                    onClick={() => onOpenLightbox(pin.photos, index)}
                    className="relative group rounded-xl overflow-hidden aspect-video border border-slate-200 bg-slate-900 shadow-xs cursor-pointer hover:border-blue-500 transition"
                  >
                    <img
                      src={photo.dataUrl}
                      alt={photo.name}
                      className="w-full h-full object-cover transition duration-150 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[11px] text-white font-medium bg-slate-900/80 px-2.5 py-1 rounded-full">
                        ดูรูปขนาดเต็ม
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions (Min-h 44px) */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          {hasDeletePermission ? (
            <button
              onClick={() => onDeleteRequest(pin)}
              className="min-h-[44px] flex items-center gap-1.5 px-4 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer"
              aria-label="ลบจุดติดตั้งนี้"
            >
              <Trash2 className="w-4 h-4" />
              <span>ลบจุดติดตั้งนี้</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="min-h-[44px] px-5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium transition cursor-pointer"
            aria-label="ปิดหน้ารายละเอียด"
          >
            ปิด
          </button>
        </div>
      </div>
    </>
  );
};
