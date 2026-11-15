import React, { useState } from 'react';
import { X, Shield, User, Check, LogOut } from 'lucide-react';
import type { UserProfile, UserRole } from '../../types';
import { PRESET_USERS } from '../../services/auth';

interface AuthModalProps {
  isOpen: boolean;
  currentUser: UserProfile;
  onClose: () => void;
  onSelectUser: (user: UserProfile) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onSelectUser,
  onLogout,
}) => {
  const [customName, setCustomName] = useState('');
  const [customRole, setCustomRole] = useState<UserRole>('editor');
  const [isCustomMode, setIsCustomMode] = useState(false);

  if (!isOpen) return null;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const customUser: UserProfile = {
      id: `usr-custom-${Date.now()}`,
      name: customName.trim(),
      email: `${customName.trim().toLowerCase().replace(/\s+/g, '')}@organization.local`,
      role: customRole,
      avatar: customRole === 'admin' ? '👑' : customRole === 'editor' ? '🔧' : '👁️',
    };

    onSelectUser(customUser);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">ระบบเข้าสู่ระบบและจัดการสิทธิ์</h2>
              <p className="text-xs text-slate-500">เลือกโปรไฟล์ผู้ใช้งานเพื่อทดสอบสิทธิ์ของระบบ</p>
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

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Current Active User Banner */}
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{currentUser.avatar || '👤'}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">{currentUser.name}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      currentUser.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : currentUser.role === 'editor'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {currentUser.role === 'admin'
                      ? 'ผู้ดูแลระบบ (Admin)'
                      : currentUser.role === 'editor'
                      ? 'ผู้แก้ไข (Editor)'
                      : 'ผู้ดูข้อมูล (Viewer)'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{currentUser.email}</p>
              </div>
            </div>

            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="min-h-[44px] px-3 flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
              title="ออกจากระบบ"
            >
              <LogOut className="w-4 h-4" />
              <span>ออก</span>
            </button>
          </div>

          {/* Preset User Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 tracking-wide uppercase">
              สลับบัญชีผู้ใช้งานทันที (Preset Roles)
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {(Object.keys(PRESET_USERS) as UserRole[]).map((role) => {
                const user = PRESET_USERS[role];
                const isSelected = currentUser.id === user.id;

                return (
                  <button
                    key={user.id}
                    onClick={() => {
                      onSelectUser(user);
                      onClose();
                    }}
                    className={`min-h-[48px] w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{user.avatar}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">{user.name}</span>
                          <span className="text-[11px] text-slate-500 font-mono">({user.role})</span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {role === 'admin'
                            ? 'สิทธิ์เต็ม: เพิ่ม/แก้ไข/ย้าย/ลบหมุด และจัดการแผนที่ทั้งหมด'
                            : role === 'editor'
                            ? 'สิทธิ์แก้ไข: เพิ่ม/แก้ไข/ย้ายหมุดได้ (ลบแผนที่ไม่ได้)'
                            : 'สิทธิ์ดูอย่างเดียว: ค้นหา ดูภาพถ่าย และสถานะ (ห้ามแก้ไข)'}
                        </p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-blue-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggle Custom User */}
          <div className="pt-2 border-t border-slate-100">
            {!isCustomMode ? (
              <button
                type="button"
                onClick={() => setIsCustomMode(true)}
                className="min-h-[44px] text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>+ เข้าสู่ระบบด้วยชื่อของคุณเอง (Custom Login)</span>
              </button>
            ) : (
              <form onSubmit={handleCustomSubmit} className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">กำหนดชื่อและสิทธิ์ของคุณเอง</label>
                  <button
                    type="button"
                    onClick={() => setIsCustomMode(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    ยกเลิก
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      required
                      placeholder="เช่น ธนากร ช่างระบบความปลอดภัย"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="min-h-[44px] w-full px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <select
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value as UserRole)}
                      className="min-h-[44px] w-full px-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="admin">Admin</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!customName.trim()}
                  className="min-h-[44px] w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-40"
                >
                  เข้าสู่ระบบด้วยชื่อนี้
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>สิทธิ์ของผู้ใช้จะถูกส่งต่อพร้อมทุกการแก้ไขแบบเรียลไทม์</span>
          <button
            onClick={onClose}
            className="min-h-[40px] px-4 font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
