import React from 'react';
import { Plus, Map, Edit2, Trash2, CheckCircle2, ChevronRight } from 'lucide-react';
import type { FloorPlan } from '../../types';

interface MapListSectionProps {
  maps: FloorPlan[];
  activeMapId: string | null;
  equipmentCountsByMap: Record<string, number>;
  canManageMaps?: boolean;
  onSelectMap: (mapId: string) => void;
  onOpenAddMapModal: () => void;
  onEditMapName: (map: FloorPlan) => void;
  onRequestDeleteMap: (map: FloorPlan) => void;
}

export const MapListSection: React.FC<MapListSectionProps> = ({
  maps,
  activeMapId,
  equipmentCountsByMap,
  canManageMaps = true,
  onSelectMap,
  onOpenAddMapModal,
  onEditMapName,
  onRequestDeleteMap,
}) => {
  return (
    <div className="space-y-4">
      {/* Add New Map Button (Admin only) */}
      {canManageMaps && (
        <button
          onClick={onOpenAddMapModal}
          className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition shadow-sm shadow-blue-600/20 cursor-pointer"
          aria-label="เพิ่มแผนที่ใหม่"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มแผนที่ใหม่</span>
        </button>
      )}

      {/* Map Items List */}
      <div className="space-y-2">
        {maps.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
            <Map className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">ยังไม่มีแผนที่ในระบบ</p>
            <p className="text-[11px] text-slate-400 mt-1">คลิกปุ่ม &quot;เพิ่มแผนที่ใหม่&quot; ด้านบนเพื่อเริ่มต้น</p>
          </div>
        ) : (
          maps.map((map) => {
            const isActive = map.id === activeMapId;
            const count = equipmentCountsByMap[map.id] || 0;

            return (
              <div
                key={map.id}
                className={`group relative p-3 rounded-2xl border transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
                onClick={() => onSelectMap(map.id)}
              >
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Map Thumbnail */}
                    <div className="w-12 h-12 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shrink-0 relative">
                      <img
                        src={map.dataUrl}
                        alt={map.name}
                        className="w-full h-full object-cover"
                      />
                      {isActive && (
                        <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-blue-600 bg-white rounded-full" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h4
                        className={`text-sm font-bold truncate ${
                          isActive ? 'text-blue-900' : 'text-slate-800'
                        }`}
                      >
                        {map.name}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-medium text-slate-700">{count} จุดติดตั้ง</span>
                        <span className="text-slate-300">•</span>
                        <span>{map.width}×{map.height}px</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    className="flex items-center gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {canManageMaps && (
                      <>
                        <button
                          type="button"
                          onClick={() => onEditMapName(map)}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
                          title="แก้ไขชื่อแผนที่"
                          aria-label={`แก้ไขชื่อแผนที่ ${map.name}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onRequestDeleteMap(map)}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title="ลบแผนที่นี้"
                          aria-label={`ลบแผนที่ ${map.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    <ChevronRight
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        isActive ? 'text-blue-600 translate-x-0.5' : 'opacity-40'
                      }`}
                    />
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
