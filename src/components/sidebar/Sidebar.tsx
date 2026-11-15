import React, { useState } from 'react';
import { Layers, ListFilter, PieChart, Database, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { EquipmentPin, EquipmentType, EquipmentStatus, FloorPlan, UserProfile } from '../../types';
import { canManageMaps } from '../../services/auth';
import { MapListSection } from './MapListSection';
import { EquipmentList } from './EquipmentList';
import { LegendSection } from './LegendSection';
import { BackupSection } from './BackupSection';

interface SidebarProps {
  maps: FloorPlan[];
  activeMapId: string | null;
  equipment: EquipmentPin[]; // Pins belonging to active map
  allEquipment: EquipmentPin[]; // All pins across all maps
  currentUser: UserProfile;
  selectedPinId: string | null;
  hiddenTypes: Set<EquipmentType>;
  isOpen: boolean;
  isMobileOpen: boolean;
  onToggleOpen: () => void;
  onCloseMobile: () => void;
  onSelectMap: (mapId: string) => void;
  onOpenAddMapModal: () => void;
  onEditMapName: (map: FloorPlan) => void;
  onRequestDeleteMap: (map: FloorPlan) => void;
  onSelectEquipment: (pin: EquipmentPin) => void;
  onToggleTypeVisibility: (type: EquipmentType) => void;
  onExportJSON: () => void;
  onImportFile: (file: File) => void;
  onRequestClearActiveEquipment: () => void;
  onRequestClearAllData: () => void;
  onRequestClearMap: () => void;
}

type TabType = 'maps' | 'list' | 'legend' | 'backup';

export const Sidebar: React.FC<SidebarProps> = ({
  maps,
  activeMapId,
  equipment,
  allEquipment,
  currentUser,
  selectedPinId,
  hiddenTypes,
  isOpen,
  isMobileOpen,
  onToggleOpen,
  onCloseMobile,
  onSelectMap,
  onOpenAddMapModal,
  onEditMapName,
  onRequestDeleteMap,
  onSelectEquipment,
  onToggleTypeVisibility,
  onExportJSON,
  onImportFile,
  onRequestClearActiveEquipment,
  onRequestClearAllData,
  onRequestClearMap,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('maps');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<EquipmentType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | 'all'>('all');

  const activeMap = maps.find((m) => m.id === activeMapId) || null;

  // คำนวณจำนวนอุปกรณ์ตามแต่ละแผนที่
  const equipmentCountsByMap = allEquipment.reduce<Record<string, number>>((acc, item) => {
    acc[item.mapId] = (acc[item.mapId] || 0) + 1;
    return acc;
  }, {});

  const handleResetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setStatusFilter('all');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-40 flex flex-col bg-white border-r border-slate-200 transition-all duration-300 shadow-xl md:shadow-none ${
          isMobileOpen ? 'translate-x-0 w-80 sm:w-96' : '-translate-x-full md:translate-x-0'
        } ${isOpen ? 'md:w-80 lg:w-96' : 'md:w-0 md:overflow-hidden md:border-r-0'}`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">
              จัดการแผนที่ & อุปกรณ์
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {maps.length} แผนที่
            </span>
          </div>

          {/* Close for mobile (Min-h 44px) */}
          <button
            onClick={onCloseMobile}
            className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            aria-label="ปิดเมนู"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation (Min-h 44px) */}
        <div className="flex border-b border-slate-200 px-2 pt-2 gap-1 bg-slate-50">
          <button
            onClick={() => setActiveTab('maps')}
            className={`min-h-[44px] flex-1 flex items-center justify-center gap-1.5 px-2 text-xs font-bold rounded-t-xl transition cursor-pointer border-b-2 ${
              activeTab === 'maps'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            aria-label="แท็บแผนที่ผังอาคาร"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>แผนที่ ({maps.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('list')}
            className={`min-h-[44px] flex-1 flex items-center justify-center gap-1.5 px-2 text-xs font-bold rounded-t-xl transition cursor-pointer border-b-2 ${
              activeTab === 'list'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            aria-label="แท็บรายการจุดติดตั้ง"
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>หมุด ({equipment.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('legend')}
            className={`min-h-[44px] flex-1 flex items-center justify-center gap-1.5 px-2 text-xs font-bold rounded-t-xl transition cursor-pointer border-b-2 ${
              activeTab === 'legend'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            aria-label="แท็บสถิติและสัญลักษณ์"
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>สถิติ</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`min-h-[44px] flex-1 flex items-center justify-center gap-1.5 px-2 text-xs font-bold rounded-t-xl transition cursor-pointer border-b-2 ${
              activeTab === 'backup'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            aria-label="แท็บจัดการข้อมูล JSON"
          >
            <Database className="w-3.5 h-3.5" />
            <span>ข้อมูล</span>
          </button>
        </div>

        {/* Tab Content Panels (Smooth Single Scroll) */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'maps' && (
            <MapListSection
              maps={maps}
              activeMapId={activeMapId}
              equipmentCountsByMap={equipmentCountsByMap}
              canManageMaps={canManageMaps(currentUser)}
              onSelectMap={onSelectMap}
              onOpenAddMapModal={onOpenAddMapModal}
              onEditMapName={onEditMapName}
              onRequestDeleteMap={onRequestDeleteMap}
            />
          )}

          {activeTab === 'list' && (
            <EquipmentList
              equipment={equipment}
              selectedPinId={selectedPinId}
              searchQuery={searchQuery}
              typeFilter={typeFilter}
              statusFilter={statusFilter}
              activeMapName={activeMap?.name}
              onSearchChange={setSearchQuery}
              onTypeFilterChange={setTypeFilter}
              onStatusFilterChange={setStatusFilter}
              onSelectEquipment={onSelectEquipment}
              onResetFilters={handleResetFilters}
            />
          )}

          {activeTab === 'legend' && (
            <LegendSection
              equipment={equipment}
              hiddenTypes={hiddenTypes}
              activeMapName={activeMap?.name}
              onToggleTypeVisibility={onToggleTypeVisibility}
            />
          )}

          {activeTab === 'backup' && (
            <BackupSection
              maps={maps}
              activeMap={activeMap}
              totalEquipmentCount={allEquipment.length}
              activeEquipmentCount={equipment.length}
              onExport={onExportJSON}
              onImportFile={onImportFile}
              onRequestClearActiveEquipment={onRequestClearActiveEquipment}
              onRequestClearAllData={onRequestClearAllData}
              onRequestClearMap={onRequestClearMap}
            />
          )}
        </div>
      </aside>

      {/* Desktop Toggle Button */}
      <button
        onClick={onToggleOpen}
        className="hidden md:flex absolute top-20 z-30 items-center justify-center w-6 h-12 bg-white border border-l-0 border-slate-200 rounded-r-xl shadow-xs text-slate-500 hover:text-blue-600 transition cursor-pointer"
        style={{ left: isOpen ? 'var(--sidebar-width, 24rem)' : '0' }}
        title={isOpen ? 'ซ่อนแถบข้าง' : 'แสดงแถบข้าง'}
        aria-label={isOpen ? 'ซ่อนแถบข้าง' : 'แสดงแถบข้าง'}
      >
        {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
    </>
  );
};
