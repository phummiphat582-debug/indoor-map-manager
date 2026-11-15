import React, { useState } from 'react';
import {
  X,
  Radio,
  Copy,
  Check,
  RefreshCw,
  Database,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff,
} from 'lucide-react';
import type { ConnectionStatus, RealtimeProviderType } from '../../types';
import { realtimeEngine } from '../../services/realtime/realtimeEngine';
import {
  getSupabaseMigrationSQL,
  saveSupabaseConfig,
  getSupabaseClient,
} from '../../services/supabaseClient';

interface CloudConfigModalProps {
  isOpen: boolean;
  status: ConnectionStatus;
  lastSyncAt: Date | null;
  onClose: () => void;
  onTriggerSync: () => void;
}

export const CloudConfigModal: React.FC<CloudConfigModalProps> = ({
  isOpen,
  status,
  lastSyncAt,
  onClose,
  onTriggerSync,
}) => {
  const [provider, setProvider] = useState<RealtimeProviderType>(realtimeEngine.getProvider());
  const [roomId, setRoomId] = useState(realtimeEngine.getRoomId());
  const [supabaseUrl, setSupabaseUrl] = useState(
    localStorage.getItem('indoor_map_supabase_url') || ''
  );
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(
    localStorage.getItem('indoor_map_supabase_key') || ''
  );
  const [isCopiedSQL, setIsCopiedSQL] = useState(false);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [supabaseTestResult, setSupabaseTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleCopySQL = () => {
    navigator.clipboard.writeText(getSupabaseMigrationSQL());
    setIsCopiedSQL(true);
    setTimeout(() => setIsCopiedSQL(false), 2500);
  };

  const handleTestSupabase = async () => {
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      setSupabaseTestResult({ ok: false, message: 'กรุณากรอก Supabase URL และ Anon Key' });
      return;
    }

    setIsTestingSupabase(true);
    setSupabaseTestResult(null);

    try {
      saveSupabaseConfig(supabaseUrl, supabaseAnonKey);
      const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);
      if (!client) throw new Error('ไม่สามารถสร้าง Supabase Client ได้');

      const { error } = await client.from('indoor_floor_plans').select('id').limit(1);

      if (error && error.code !== 'PGRST116') {
        throw new Error(error.message);
      }

      setSupabaseTestResult({
        ok: true,
        message: 'เชื่อมต่อฐานข้อมูล Supabase สำเร็จ พร้อมใช้งาน Realtime',
      });
    } catch (err: any) {
      setSupabaseTestResult({
        ok: false,
        message: `เชื่อมต่อไม่สำเร็จ: ${err.message || 'ตรวจสอบ URL หรือ Anon Key'}`,
      });
    } finally {
      setIsTestingSupabase(false);
    }
  };

  const handleSaveAndApply = () => {
    if (provider === 'supabase') {
      saveSupabaseConfig(supabaseUrl, supabaseAnonKey);
    }
    realtimeEngine.setProvider(provider, roomId);
    onClose();
  };

  const offlineCount = realtimeEngine.getOfflineQueueCount();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Cloud className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                ตั้งค่าระบบคลาวด์และ Real-time ซิงก์
              </h2>
              <p className="text-xs text-slate-500">
                จัดการฐานข้อมูลออนไลน์และการซิงก์ข้อมูลระหว่างอุปกรณ์
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Live Status Overview Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                สถานะการเชื่อมต่อสด
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    status === 'connected'
                      ? 'bg-emerald-100 text-emerald-800'
                      : status === 'connecting'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      status === 'connected'
                        ? 'bg-emerald-500 animate-pulse'
                        : status === 'connecting'
                        ? 'bg-amber-500 animate-ping'
                        : 'bg-rose-500'
                    }`}
                  />
                  {status === 'connected'
                    ? 'ออนไลน์ (Online)'
                    : status === 'connecting'
                    ? 'กำลังเชื่อมต่อใหม่...'
                    : 'ออฟไลน์ (Offline)'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                <span className="text-slate-400 block mb-0.5">ซิงก์ล่าสุด:</span>
                <span className="font-semibold text-slate-700">
                  {lastSyncAt ? lastSyncAt.toLocaleTimeString('th-TH') : 'ยังไม่มีการซิงก์'}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                <span className="text-slate-400 block mb-0.5">คิวออฟไลน์ที่รอส่ง:</span>
                <span
                  className={`font-semibold ${
                    offlineCount > 0 ? 'text-amber-600' : 'text-slate-700'
                  }`}
                >
                  {offlineCount} รายการ
                </span>
              </div>
            </div>

            {offlineCount > 0 && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                <span>มีรายการที่แก้ไขตอนออฟไลน์ค้างอยู่</span>
                <button
                  type="button"
                  onClick={onTriggerSync}
                  className="px-2.5 py-1 bg-amber-600 text-white rounded-md font-medium hover:bg-amber-700"
                >
                  ซิงก์เดี๋ยวนี้
                </button>
              </div>
            )}
          </div>

          {/* Provider Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 tracking-wide uppercase">
              เลือกผู้ให้บริการฐานข้อมูลและ Real-time
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Cloud Relay */}
              <button
                type="button"
                onClick={() => setProvider('cloud-relay')}
                className={`min-h-[54px] p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  provider === 'cloud-relay'
                    ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-900">
                      Cloud Realtime Relay
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded">
                    พร้อมใช้ทันที
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  ซิงก์สดผ่าน WebSocket ทันที ไม่ต้องติดตั้งฐานข้อมูล เพียงตั้งชื่อห้องเดียวกัน
                </p>
              </button>

              {/* Option 2: Supabase */}
              <button
                type="button"
                onClick={() => setProvider('supabase')}
                className={`min-h-[54px] p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  provider === 'supabase'
                    ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900">Supabase (PostgreSQL)</span>
                  </div>
                  <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">
                    Enterprise
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  เก็บข้อมูลถาวรบนคลาวด์ PostgreSQL พร้อมระบบ Realtime และ RLS ความปลอดภัยสูง
                </p>
              </button>
            </div>
          </div>

          {/* Provider Specific Settings */}
          {provider === 'cloud-relay' && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>รหัสห้องซิงก์ (Room ID)</span>
                <span className="text-[11px] font-normal text-slate-500">
                  อุปกรณ์ที่ใช้ Room ID เดียวกันจะเห็นข้อมูลตรงกัน
                </span>
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="เช่น office-building-a, floor-1"
                className="min-h-[44px] w-full px-3 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500">
                💡 ลองเปิดเว็บนี้บนมือถือและคอมพิวเตอร์พร้อมกัน โดยตั้งชื่อห้องเดียวกัน
                เมื่อคุณลากหรือเพิ่มหมุดในเครื่องหนึ่ง อีกเครื่องจะอัปเดตทันที
              </p>
            </div>
          )}

          {provider === 'supabase' && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="min-h-[44px] w-full px-3 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Supabase Anon Public Key
                  </label>
                  <input
                    type="password"
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    className="min-h-[44px] w-full px-3 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    🔒 ปลอดภัย: กุญแจ Anon Key ออกแบบมาสำหรับ Frontend และถูกปกป้องด้วย Row Level
                    Security (RLS)
                  </p>
                </div>

                {/* Test Connection Button */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleTestSupabase}
                    disabled={isTestingSupabase}
                    className="min-h-[40px] px-3.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40"
                  >
                    {isTestingSupabase && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>ทดสอบการเชื่อมต่อ</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopySQL}
                    className="min-h-[40px] px-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {isCopiedSQL ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span>{isCopiedSQL ? 'คัดลอก SQL แล้ว!' : 'คัดลอก SQL สร้างตาราง'}</span>
                  </button>
                </div>

                {supabaseTestResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                      supabaseTestResult.ok
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    {supabaseTestResult.ok ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{supabaseTestResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            {status === 'connected' ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>การแก้ไขทั้งหมดจะซิงก์อัตโนมัติ</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 font-semibold text-xs text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSaveAndApply}
              className="min-h-[44px] px-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition cursor-pointer shadow-xs"
            >
              บันทึกและเชื่อมต่อ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
