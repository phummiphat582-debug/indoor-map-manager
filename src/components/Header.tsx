import React from 'react';
import {
  Map,
  Menu,
  Plus,
  Upload,
  Download,
  Layers,
  ChevronDown,
  Cloud,
  Lock,
} from 'lucide-react';
import type { FloorPlan, EquipmentPin, UserProfile, ConnectionStatus } from '../types';
import { canEditEquipment, canManageMaps } from '../services/auth';

interface HeaderProps {
  maps: FloorPlan[];
  activeMap: FloorPlan | null;
  equipment: EquipmentPin[];
  isAddMode: boolean;
  currentUser: UserProfile;
  connectionStatus: ConnectionStatus;
  lastSyncAt: Date | null;
  offlineQueueCount: number;
  onSelectMap: (mapId: string) => void;
  onToggleAddMode: () => void;
  onOpenUploadModal: () => void;
  onOpenMobileSidebar: () => void;
  onExportJSON: () => void;
  onImportClick: () => void;
  onOpenAuthModal: () => void;
  onOpenCloudModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  maps,
  activeMap,
  equipment,
  isAddMode,
  currentUser,
  connectionStatus,
  lastSyncAt,
  offlineQueueCount,
  onSelectMap,
  onToggleAddMode,
  onOpenUploadModal,
  onOpenMobileSidebar,
  onExportJSON,
  onImportClick,
  onOpenAuthModal,
  onOpenCloudModal,
}) => {
  const hasEditPermission = canEditEquipment(currentUser);
  const hasMapManagePermission = canManageMaps(currentUser);

  return (
    <header className="min-h-[64px] px-3 sm:px-5 bg-white border-b border-slate-200 flex items-center justify-between text-slate-800 shrink-0 z-30 select-none shadow-xs">
      {/* Left: Mobile Menu & Logo/Title */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        <button
          onClick={onOpenMobileSidebar}
          className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          aria-label="เปิดเมนูแถบข้าง"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <Map className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2 truncate">
              <span className="truncate">ระบบจัดการแผนที่ติดตั้งอุปกรณ์</span>
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:flex items-center gap-2">
              <span>{maps.length} แผนที่ในระบบ</span>
              {activeMap && (
                <>
                  <span className="text-slate-300">•</span>
                  <span>
                    กำลังดู: <strong className="text-slate-700">{activeMap.name}</strong> (
                    {equipment.length} จุด)
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Middle: Map Switcher Dropdown (when 2+ maps exist) */}
      {maps.length > 0 && (
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <Layers className="w-4 h-4 text-slate-500 ml-2" />
          <div className="relative">
            <select
              value={activeMap?.id || ''}
              onChange={(e) => onSelectMap(e.target.value)}
              className="min-h-[38px] pl-2 pr-8 text-xs font-semibold text-slate-800 bg-transparent rounded-lg focus:outline-none cursor-pointer appearance-none"
              aria-label="เลือกแผนที่ที่ต้องการดู"
            >
              {maps.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Right: Cloud Status, User Profile & Quick Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Realtime Cloud Status Button */}
        <button
          type="button"
          onClick={onOpenCloudModal}
          className="min-h-[44px] flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer text-xs"
          title={`สถานะการเชื่อมต่อ: ${
            connectionStatus === 'connected'
              ? 'ออนไลน์'
              : connectionStatus === 'connecting'
              ? 'กำลังเชื่อมต่อใหม่'
              : 'ออฟไลน์'
          }${lastSyncAt ? ` • ซิงก์ล่าสุด ${lastSyncAt.toLocaleTimeString('th-TH')}` : ''} (คลิกเพื่อตั้งค่า)`}
          aria-label="สถานะการเชื่อมต่อ Real-time"
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              connectionStatus === 'connected'
                ? 'bg-emerald-500 animate-pulse'
                : connectionStatus === 'connecting'
                ? 'bg-amber-500 animate-ping'
                : 'bg-rose-500'
            }`}
          />
          <Cloud className="w-4 h-4 text-slate-500 hidden sm:inline" />
          <span className="font-semibold hidden md:inline">
            {connectionStatus === 'connected'
              ? 'ออนไลน์'
              : connectionStatus === 'connecting'
              ? 'เชื่อมต่อ...'
              : 'ออฟไลน์'}
          </span>
          {offlineQueueCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
              {offlineQueueCount}
            </span>
          )}
        </button>

        {/* User Profile / Role Button */}
        <button
          type="button"
          onClick={onOpenAuthModal}
          className="min-h-[44px] flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer text-xs"
          title="คลิกเพื่อสลับผู้ใช้งานหรือออกจากระบบ"
          aria-label="โปรไฟล์ผู้ใช้งาน"
        >
          <span className="text-sm">{currentUser.avatar || '👤'}</span>
          <span className="font-semibold text-slate-800 max-w-[90px] sm:max-w-[120px] truncate hidden sm:inline">
            {currentUser.name}
          </span>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
              currentUser.role === 'admin'
                ? 'bg-purple-100 text-purple-700'
                : currentUser.role === 'editor'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {currentUser.role}
          </span>
        </button>

        {/* Add Pin Button (Vibrant Orange Accent) */}
        <button
          onClick={onToggleAddMode}
          disabled={!activeMap || !hasEditPermission}
          className={`min-h-[44px] flex items-center gap-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs ${
            isAddMode
              ? 'bg-amber-500 hover:bg-amber-600 text-white ring-2 ring-amber-400'
              : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/20'
          }`}
          title={
            !hasEditPermission
              ? 'เฉพาะผู้มีสิทธิ์แก้ไข (Editor / Admin)'
              : isAddMode
              ? 'คลิกบนแผนที่เพื่อวางจุด หรือกด Esc เพื่อยกเลิก'
              : 'เพิ่มจุดติดตั้งอุปกรณ์บนแผนที่'
          }
          aria-label={
            isAddMode
              ? 'คลิกบนแผนที่เพื่อวางจุด หรือกด Esc เพื่อยกเลิก'
              : 'เพิ่มจุดติดตั้งอุปกรณ์บนแผนที่'
          }
        >
          {!hasEditPermission ? (
            <Lock className="w-4 h-4" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">
            {!hasEditPermission
              ? 'ดูข้อมูลเท่านั้น'
              : isAddMode
              ? 'คลิกเพื่อวางจุด'
              : 'เพิ่มจุดติดตั้ง'}
          </span>
          <span className="sm:hidden">{isAddMode ? 'กำลังวาง' : 'เพิ่มจุด'}</span>
        </button>

        {/* Add Map Button (Solid Blue Accent) - Admin only */}
        {hasMapManagePermission && (
          <button
            onClick={onOpenUploadModal}
            className="min-h-[44px] hidden sm:flex items-center gap-1.5 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition cursor-pointer shadow-xs shadow-blue-600/10"
            aria-label="เพิ่มแผนที่ใหม่"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden lg:inline">เพิ่มแผนที่</span>
          </button>
        )}

        {/* Export JSON Quick */}
        <button
          onClick={onExportJSON}
          disabled={maps.length === 0}
          className="min-h-[44px] hidden xl:flex items-center gap-1.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="ส่งออกไฟล์สำรอง JSON ทั้งหมด"
          aria-label="ส่งออกไฟล์สำรอง JSON"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          <span>Export</span>
        </button>

        {/* Import JSON Quick */}
        {hasMapManagePermission && (
          <button
            onClick={onImportClick}
            className="min-h-[44px] hidden xl:flex items-center gap-1.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer"
            title="นำเข้าไฟล์สำรอง JSON"
            aria-label="นำเข้าไฟล์สำรอง JSON"
          >
            <Upload className="w-4 h-4 text-blue-600" />
            <span>Import</span>
          </button>
        )}
      </div>
    </header>
  );
};
