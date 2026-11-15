import React, { useState, useRef, useEffect } from 'react';
import { X, Save, ImagePlus, Trash2, AlertCircle, Eye } from 'lucide-react';
import type { EquipmentPin, EquipmentType, EquipmentStatus, EquipmentPhoto } from '../../types';
import { EQUIPMENT_TYPES, EQUIPMENT_STATUSES } from '../../constants/equipmentConfig';
import { validateImageFile, readFileAsDataURL } from '../../utils/fileHelpers';

interface EquipmentFormModalProps {
  isOpen: boolean;
  initialData?: Partial<EquipmentPin> | null;
  defaultCoordinates?: { x: number; y: number } | null;
  onClose: () => void;
  onSave: (data: Omit<EquipmentPin, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  onViewPhoto?: (photos: EquipmentPhoto[], index: number) => void;
}

export const EquipmentFormModal: React.FC<EquipmentFormModalProps> = ({
  isOpen,
  initialData,
  defaultCoordinates,
  onClose,
  onSave,
  onViewPhoto,
}) => {
  const isEditing = Boolean(initialData?.id);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState<EquipmentType>('cctv');
  const [code, setCode] = useState('');
  const [zone, setZone] = useState('');
  const [buildingFloor, setBuildingFloor] = useState('');
  const [installDate, setInstallDate] = useState('');
  const [status, setStatus] = useState<EquipmentStatus>('normal');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<EquipmentPhoto[]>([]);

  // Validation errors
  const [errors, setErrors] = useState<{
    name?: string;
    code?: string;
    zone?: string;
    general?: string;
  }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initialData when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        setType(initialData.type || 'cctv');
        setCode(initialData.code || '');
        setZone(initialData.zone || '');
        setBuildingFloor(initialData.buildingFloor || '');
        setInstallDate(initialData.installDate || new Date().toISOString().split('T')[0]);
        setStatus(initialData.status || 'normal');
        setNotes(initialData.notes || '');
        setPhotos(initialData.photos || []);
      } else {
        // New pin defaults
        const today = new Date().toISOString().split('T')[0];
        setName('');
        setType('cctv');
        // รหัสอุปกรณ์อัตโนมัติชั่วคราว
        setCode(`CAM-${Math.floor(100 + Math.random() * 900)}`);
        setZone('');
        setBuildingFloor('ชั้น 1');
        setInstallDate(today);
        setStatus('normal');
        setNotes('');
        setPhotos([]);
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  // จัดการอัปโหลดรูปภาพหลายรูป
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPhotos: EquipmentPhoto[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setErrors((prev) => ({ ...prev, general: validation.error }));
        continue;
      }

      try {
        const dataUrl = await readFileAsDataURL(file);
        newPhotos.push({
          id: `photo-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          dataUrl,
          name: file.name,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        });
      } catch {
        setErrors((prev) => ({ ...prev, general: `ไม่สามารถโหลดภาพ ${file.name} ได้` }));
      }
    }

    setPhotos((prev) => [...prev, ...newPhotos]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const validateForm = (): boolean => {
    const newErrors: { name?: string; code?: string; zone?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'กรุณาระบุชื่ออุปกรณ์';
    }
    if (!code.trim()) {
      newErrors.code = 'กรุณาระบุรหัสอุปกรณ์';
    }
    if (!zone.trim()) {
      newErrors.zone = 'กรุณาระบุตำแหน่งหรือโซน';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const x = initialData?.x ?? defaultCoordinates?.x ?? 0.5;
    const y = initialData?.y ?? defaultCoordinates?.y ?? 0.5;

    onSave({
      id: initialData?.id,
      name: name.trim(),
      type,
      code: code.trim(),
      zone: zone.trim(),
      buildingFloor: buildingFloor.trim(),
      installDate: installDate || new Date().toISOString().split('T')[0],
      status,
      notes: notes.trim(),
      x,
      y,
      photos,
    });

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="equipment-form-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 my-8 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 id="equipment-form-title" className="text-lg font-bold text-slate-900 dark:text-white">
              {isEditing ? 'แก้ไขข้อมูลจุดติดตั้งอุปกรณ์' : 'เพิ่มจุดติดตั้งอุปกรณ์ใหม่'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              กรอกข้อมูลรายละเอียดของอุปกรณ์และแนบรูปภาพจริง
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errors.general && (
          <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-xl text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errors.general}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Equipment Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              ประเภทอุปกรณ์ <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(EQUIPMENT_TYPES) as EquipmentType[]).map((t) => {
                const conf = EQUIPMENT_TYPES[t];
                const isSelected = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setType(t);
                      if (!isEditing && code.startsWith('CAM-') && t === 'fire_extinguisher') {
                        setCode(`FE-${Math.floor(100 + Math.random() * 900)}`);
                      } else if (!isEditing && code.startsWith('FE-') && t === 'cctv') {
                        setCode(`CAM-${Math.floor(100 + Math.random() * 900)}`);
                      }
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition cursor-pointer text-left ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/30'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-lg">{conf.emoji}</span>
                    <span className="truncate">{conf.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 1: Name and Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ชื่ออุปกรณ์ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                placeholder="เช่น กล้องวงจรปิด ประตูทางเข้า L1"
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50/50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                  errors.name
                    ? 'border-rose-400 dark:border-rose-600'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                รหัสอุปกรณ์ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (errors.code) setErrors((prev) => ({ ...prev, code: undefined }));
                }}
                placeholder="เช่น CCTV-01, FE-02"
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50/50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                  errors.code
                    ? 'border-rose-400 dark:border-rose-600'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.code && <p className="text-[11px] text-rose-500 mt-1">{errors.code}</p>}
            </div>
          </div>

          {/* Row 2: Zone and Floor/Building */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ตำแหน่งหรือโซน <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={zone}
                onChange={(e) => {
                  setZone(e.target.value);
                  if (errors.zone) setErrors((prev) => ({ ...prev, zone: undefined }));
                }}
                placeholder="เช่น โถงต้อนรับ, หน้าห้องประชุมใหญ่"
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50/50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                  errors.zone
                    ? 'border-rose-400 dark:border-rose-600'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.zone && <p className="text-[11px] text-rose-500 mt-1">{errors.zone}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ชั้น / อาคาร
              </label>
              <input
                type="text"
                value={buildingFloor}
                onChange={(e) => setBuildingFloor(e.target.value)}
                placeholder="เช่น ชั้น 1 อาคารนวัตกรรม"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          {/* Row 3: Install Date and Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                วันที่ติดตั้ง
              </label>
              <input
                type="date"
                value={installDate}
                onChange={(e) => setInstallDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                สถานะการใช้งาน
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(EQUIPMENT_STATUSES) as EquipmentStatus[]).map((st) => {
                  const conf = EQUIPMENT_STATUSES[st];
                  const isSelected = status === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatus(st)}
                      className={`p-2 rounded-xl border text-xs font-medium transition cursor-pointer text-center ${
                        isSelected
                          ? `${conf.bgClass} ring-2 ring-offset-1 font-bold`
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {conf.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Row 4: Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              หมายเหตุ / รายละเอียดเพิ่มเติม
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น IP Address 192.168.1.101, วันหมดอายุถังดับเพลิง 2027-12-31"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
            />
          </div>

          {/* Row 5: Real Equipment Photos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                รูปภาพจริงของอุปกรณ์ ({photos.length} รูป)
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-medium transition border border-indigo-200 dark:border-indigo-800/60 cursor-pointer"
              >
                <ImagePlus className="w-3.5 h-3.5" />
                <span>เพิ่มรูปภาพ</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />

            {photos.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition"
              >
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ยังไม่มีรูปภาพ (คลิกเพื่อแนบรูปภาพจริงของอุปกรณ์ สามารถเลือกหลายรูปได้)
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 max-h-48 overflow-y-auto">
                {photos.map((photo, index) => (
                  <div
                    key={photo.id || index}
                    className="relative group rounded-xl overflow-hidden aspect-square border border-slate-200 dark:border-slate-700 bg-slate-900 shadow-sm"
                  >
                    <img
                      src={photo.dataUrl}
                      alt={photo.name}
                      className="w-full h-full object-cover transition duration-150 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {onViewPhoto && (
                        <button
                          type="button"
                          onClick={() => onViewPhoto(photos, index)}
                          className="p-1.5 rounded-lg bg-black/60 hover:bg-black text-white text-xs transition cursor-pointer"
                          title="ดูรูปภาพขนาดเต็ม"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(photo.id)}
                        className="p-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-xs transition cursor-pointer"
                        title="ลบรูปภาพนี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'บันทึกการแก้ไข' : 'บันทึกจุดติดตั้ง'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
