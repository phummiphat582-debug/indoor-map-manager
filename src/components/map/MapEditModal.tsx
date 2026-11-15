import React, { useState, useEffect } from 'react';
import { X, Check, Edit2 } from 'lucide-react';
import type { FloorPlan } from '../../types';

interface MapEditModalProps {
  map: FloorPlan | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveName: (mapId: string, newName: string) => void;
}

export const MapEditModal: React.FC<MapEditModalProps> = ({
  map,
  isOpen,
  onClose,
  onSaveName,
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (map && isOpen) {
      setName(map.name);
      setError('');
    }
  }, [map, isOpen]);

  if (!isOpen || !map) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('กรุณาระบุชื่อแผนที่');
      return;
    }
    onSaveName(map.id, name.trim());
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-map-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Edit2 className="w-5 h-5" />
            </div>
            <h3 id="edit-map-title" className="text-base font-bold text-slate-900">
              แก้ไขชื่อแผนที่ผังอาคาร
            </h3>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ชื่อแผนที่ผังอาคาร <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="เช่น ชั้น 1, ชั้น 2, อาคาร A, ลานจอดรถ"
              className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                error ? 'border-rose-400' : 'border-slate-300'
              }`}
            />
            {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-medium transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="min-h-[44px] flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition shadow-sm shadow-blue-600/20 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>บันทึกชื่อใหม่</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
