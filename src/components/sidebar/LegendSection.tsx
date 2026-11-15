import React from 'react';
import { Eye, EyeOff, ShieldCheck, AlertTriangle, AlertCircle } from 'lucide-react';
import type { EquipmentPin, EquipmentType, EquipmentStatus } from '../../types';
import { EQUIPMENT_TYPES, EQUIPMENT_STATUSES } from '../../constants/equipmentConfig';

interface LegendSectionProps {
  equipment: EquipmentPin[];
  hiddenTypes: Set<EquipmentType>;
  onToggleTypeVisibility: (type: EquipmentType) => void;
  onSelectTypeFilter?: (type: EquipmentType | 'all') => void;
}

export const LegendSection: React.FC<LegendSectionProps> = ({
  equipment,
  hiddenTypes,
  onToggleTypeVisibility,
}) => {
  const countByType = equipment.reduce<Record<string, number>>((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {});

  const countByStatus = equipment.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});

  const allTypes = Object.keys(EQUIPMENT_TYPES) as EquipmentType[];
  const allStatuses = Object.keys(EQUIPMENT_STATUSES) as EquipmentStatus[];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            สัญลักษณ์ & ประเภทอุปกรณ์ ({equipment.length})
          </h3>
          <span className="text-[11px] text-slate-400">คลิกที่ตาเพื่อซ่อน/แสดง</span>
        </div>

        <div className="space-y-1.5">
          {allTypes.map((type) => {
            const config = EQUIPMENT_TYPES[type];
            const count = countByType[type] || 0;
            const isHidden = hiddenTypes.has(type);

            return (
              <div
                key={type}
                className={`flex items-center justify-between p-2 rounded-xl transition border ${
                  isHidden
                    ? 'bg-slate-50 dark:bg-slate-900/40 opacity-50 border-transparent'
                    : 'bg-white dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 border border-white/20 shadow-xs"
                    style={{ backgroundColor: config.colorHex }}
                  >
                    <span>{config.emoji}</span>
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-xs font-semibold truncate ${
                        isHidden ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {config.label}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
                    {count}
                  </span>
                  <button
                    onClick={() => onToggleTypeVisibility(type)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                    title={isHidden ? 'แสดงหมุดประเภทนี้' : 'ซ่อนหมุดประเภทนี้'}
                    aria-label={`ซ่อนหรือแสดง ${config.label}`}
                  >
                    {isHidden ? <EyeOff className="w-4 h-4 text-rose-500" /> : <Eye className="w-4 h-4 text-slate-500" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          สรุปสถานะอุปกรณ์
        </h3>

        <div className="grid grid-cols-3 gap-2">
          {allStatuses.map((st) => {
            const conf = EQUIPMENT_STATUSES[st];
            const count = countByStatus[st] || 0;

            let StatusIcon = ShieldCheck;
            if (st === 'maintenance') StatusIcon = AlertTriangle;
            if (st === 'defective') StatusIcon = AlertCircle;

            return (
              <div
                key={st}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center ${conf.bgClass}`}
              >
                <StatusIcon className="w-4 h-4 mb-1" />
                <span className="text-[11px] font-medium leading-tight">{conf.label}</span>
                <span className="text-base font-bold font-mono mt-0.5">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
