import React, { useState } from 'react';
import { ListFilter, PieChart, Database, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { EquipmentPin, EquipmentType, EquipmentStatus, FloorPlan } from '../../types';
import { EquipmentList } from './EquipmentList';
import { LegendSection } from './LegendSection';
import { BackupSection } from './BackupSection';

interface SidebarProps {
  floorPlan: FloorPlan | null;
  equipment: EquipmentPin[];
  selectedPinId: string | null;
  hiddenTypes: Set<EquipmentType>;
  isOpen: boolean;
  isMobileOpen: boolean;
  onToggleOpen: () => void;
  onCloseMobile: () => void;
  onSelectEquipment: (pin: EquipmentPin) => void;
  onToggleTypeVisibility: (type: EquipmentType) => void;
  onExportJSON: () => void;
  onImportFile: (file: File) => void;
  onRequestClearAllEquipment: () => void;
  onRequestClearMap: () => void;
}

type TabType = 'list' | 'legend' | 'backup';

export const Sidebar: React.FC<SidebarProps> = ({
  floorPlan,
  equipment,
  selectedPinId,
  hiddenTypes,
  isOpen,
  isMobileOpen,
  onToggleOpen,
  onCloseMobile,
  onSelectEquipment,
  onToggleTypeVisibility,
  onExportJSON,
  onImportFile,
  onRequestClearAllEquipment,
  onRequestClearMap,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<EquipmentType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | 'all'>('all');

  const handleResetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setStatusFilter('all');
  };

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed md:relative inset-y-0 left-0 z-40 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 shadow-xl md:shadow-none ${
          isMobileOpen ? 'translate-x-0 w-80 sm:w-96' : '-translate-x-full md:translate-x-0'
        } ${isOpen ? 'md:w-80 lg:w-96' : 'md:w-0 md:overflow-hidden md:border-r-0'}`}
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              แผงควบคุมอุปกรณ์
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
              {equipment.length}
            </span>
          </div>

          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="ปิดเมนู"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-slate-200 dark:border-slate-800 px-3 pt-2 gap-1 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-t-xl transition cursor-pointer border-b-2 ${
              activeTab === 'list'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>รายการ</span>
          </button>

          <button
            onClick={() => setActiveTab('legend')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-t-xl transition cursor-pointer border-b-2 ${
              activeTab === 'legend'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>สถิติ/สัญลักษณ์</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-t-xl transition cursor-pointer border-b-2 ${
              activeTab === 'backup'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>จัดการข้อมูล</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'list' && (
            <EquipmentList
              equipment={equipment}
              selectedPinId={selectedPinId}
              searchQuery={searchQuery}
              typeFilter={typeFilter}
              statusFilter={statusFilter}
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
              onToggleTypeVisibility={onToggleTypeVisibility}
            />
          )}

          {activeTab === 'backup' && (
            <BackupSection
              floorPlan={floorPlan}
              equipment={equipment}
              onExport={onExportJSON}
              onImportFile={onImportFile}
              onRequestClearAllEquipment={onRequestClearAllEquipment}
              onRequestClearMap={onRequestClearMap}
            />
          )}
        </div>
      </aside>

      <button
        onClick={onToggleOpen}
        className="hidden md:flex absolute top-20 left-0 z-30 items-center justify-center w-6 h-12 bg-white dark:bg-slate-800 border border-l-0 border-slate-200 dark:border-slate-700 rounded-r-xl shadow-md text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
        style={{ left: isOpen ? 'var(--sidebar-width, 24rem)' : '0' }}
        title={isOpen ? 'ซ่อนแถบข้าง' : 'แสดงแถบข้าง'}
        aria-label={isOpen ? 'ซ่อนแถบข้าง' : 'แสดงแถบข้าง'}
      >
        {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
    </>
  );
};
