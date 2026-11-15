import React from 'react';
import { Search, Filter, MapPin, Camera, X } from 'lucide-react';
import type { EquipmentPin, EquipmentType, EquipmentStatus } from '../../types';
import { EQUIPMENT_TYPES, EQUIPMENT_STATUSES } from '../../constants/equipmentConfig';

interface EquipmentListProps {
  equipment: EquipmentPin[]; // Pins belonging to the currently active map
  selectedPinId: string | null;
  searchQuery: string;
  typeFilter: EquipmentType | 'all';
  statusFilter: EquipmentStatus | 'all';
  activeMapName?: string;
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
  activeMapName,
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
    <div className="flex flex-col h-full space-y-3">
      {/* Search Bar & Filters */}
      <div className="space-y-2.5 pb-3 border-b border-slate-200">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={`ค้นหาใน ${activeMapName || 'แผนที่นี้'}...`}
            className="w-full min-h-[44px] pl-10 pr-9 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="min-h-[44px] min-w-[36px] absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
              aria-label="ล้างคำค้นหา"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Selectors (Min-h 44px) */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value as EquipmentType | 'all')}
            className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            aria-label="กรองตามประเภทอุปกรณ์"
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
            className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            aria-label="กรองตามสถานะการใช้งาน"
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="normal">ใช้งานปกติ</option>
            <option value="maintenance">ต้องตรวจสอบ</option>
            <option value="defective">ชำรุด</option>
          </select>
        </div>

        {/* Counter and reset */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
          <span>
            แสดง {filteredList.length} จาก {equipment.length} รายการ
          </span>
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="text-blue-600 font-semibold hover:underline cursor-pointer"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
      </div>

      {/* Equipment List Items */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {equipment.length === 0 ? (
          <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
            <Filter className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-semibold text-slate-600">ยังไม่มีจุดติดตั้งบนแผนที่นี้</p>
            <p className="text-[11px] mt-1 text-slate-400">
              คลิกปุ่ม &quot;เพิ่มจุดติดตั้ง&quot; ด้านบนเพื่อวางหมุด
            </p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
            <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-semibold text-slate-600">ไม่พบอุปกรณ์ที่ตรงกับเงื่อนไข</p>
            <button
              onClick={onResetFilters}
              className="mt-2 text-xs text-blue-600 font-medium hover:underline cursor-pointer"
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
                    ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 border border-white shadow-xs"
                    style={{ backgroundColor: typeConf.colorHex }}
                  >
                    <span>{typeConf.emoji}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {item.name}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${statusConf.bgClass}`}
                      >
                        {statusConf.label}
                      </span>
                    </div>

                    <p className="text-[11px] font-mono text-slate-500">
                      {item.code}
                    </p>

                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                      {item.zone && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{item.zone}</span>
                        </span>
                      )}
                      {item.photos && item.photos.length > 0 && (
                        <span className="flex items-center gap-1 shrink-0 text-blue-600 font-medium">
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
