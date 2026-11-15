import React from 'react';
import { Search, Filter, MapPin, Camera, X } from 'lucide-react';
import type { EquipmentPin, EquipmentType, EquipmentStatus } from '../../types';
import { EQUIPMENT_TYPES, EQUIPMENT_STATUSES } from '../../constants/equipmentConfig';

interface EquipmentListProps {
  equipment: EquipmentPin[];
  selectedPinId: string | null;
  searchQuery: string;
  typeFilter: EquipmentType | 'all';
  statusFilter: EquipmentStatus | 'all';
  onSearchChange: (q: string) => void;
  onTypeFilterChange: (t: EquipmentType | 'all') => void;
  onStatusFilterChange: (s: EquipmentStatus | 'all') => void;
  onSelectEquipment: (pin: EquipmentPin) => void;
  onResetFilters: () => void;
}

export const EquipmentList: React.FC<EquipmentListProps> = ({
  equipment,
  selectedPinId,
  searchQuery,
  typeFilter,
  statusFilter,
  onSearchChange,
  onTypeFilterChange,
  onStatusFilterChange,
  onSelectEquipment,
  onResetFilters,
}) => {
  const filteredList = equipment.filter((item) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = item.name.toLowerCase().includes(q);
      const matchCode = item.code.toLowerCase().includes(q);
      const matchZone = item.zone.toLowerCase().includes(q);
      const matchNotes = item.notes?.toLowerCase().includes(q);
      const matchBuilding = item.buildingFloor?.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchZone && !matchNotes && !matchBuilding) {
        return false;
      }
    }

    if (typeFilter !== 'all' && item.type !== typeFilter) {
      return false;
    }

    if (statusFilter !== 'all' && item.status !== statusFilter) {
      return false;
    }

    return true;
  });

  const hasActiveFilters = searchQuery.trim() !== '' || typeFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-2.5 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหาชื่อ, รหัส, หรือโซน..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value as EquipmentType | 'all')}
            className="w-full px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">ประเภททั้งหมด</option>
            <option value="cctv">📹 กล้องวงจรปิด</option>
            <option value="fire_extinguisher">🧯 ถังดับเพลิง</option>
            <option value="smoke_detector">🚨 ตรวจจับควัน</option>
            <option value="router">📶 เราเตอร์ / AP</option>
            <option value="emergency_exit">🚪 ทางออกฉุกเฉิน</option>
            <option value="first_aid">🩹 ปฐมพยาบาล</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as EquipmentStatus | 'all')}
            className="w-full px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="normal">ใช้งานปกติ</option>
            <option value="maintenance">ต้องตรวจสอบ</option>
            <option value="defective">ชำรุด</option>
          </select>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
          <span>
            แสดง {filteredList.length} จากทั้งหมด {equipment.length} รายการ
          </span>
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-3 space-y-2 pr-1">
        {equipment.length === 0 ? (
          <div className="p-6 text-center text-slate-400 dark:text-slate-500">
            <Filter className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-medium">ยังไม่มีจุดติดตั้งอุปกรณ์</p>
            <p className="text-[11px] mt-1 text-slate-400">
              คลิกปุ่ม &quot;เพิ่มจุดติดตั้ง&quot; บนแถบเครื่องมือเพื่อวางหมุด
            </p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-6 text-center text-slate-400 dark:text-slate-500">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-medium">ไม่พบอุปกรณ์ที่ตรงกับเงื่อนไข</p>
            <button
              onClick={onResetFilters}
              className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              รีเซ็ตตัวกรอง
            </button>
          </div>
        ) : (
          filteredList.map((item) => {
            const typeConf = EQUIPMENT_TYPES[item.type] || EQUIPMENT_TYPES.cctv;
            const statusConf = EQUIPMENT_STATUSES[item.status] || EQUIPMENT_STATUSES.normal;
            const isSelected = item.id === selectedPinId;

            return (
              <div
                key={item.id}
                onClick={() => onSelectEquipment(item)}
                className={`p-3 rounded-2xl border transition duration-150 cursor-pointer text-left ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-sm ring-2 ring-indigo-500/20'
                    : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/70 dark:hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 border border-white/20 shadow-xs"
                    style={{ backgroundColor: typeConf.colorHex }}
                  >
                    <span>{typeConf.emoji}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.name}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full border shrink-0 ${statusConf.bgClass}`}
                      >
                        {statusConf.label}
                      </span>
                    </div>

                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      {item.code}
                    </p>

                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      {item.zone && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{item.zone}</span>
                        </span>
                      )}
                      {item.photos && item.photos.length > 0 && (
                        <span className="flex items-center gap-1 shrink-0 text-indigo-500 dark:text-indigo-400 font-medium">
                          <Camera className="w-3 h-3" />
                          <span>{item.photos.length}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
