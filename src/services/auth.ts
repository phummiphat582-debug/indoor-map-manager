import type { UserProfile, UserRole } from '../types';

const AUTH_STORAGE_KEY = 'indoor_map_current_user_v1';

export const PRESET_USERS: Record<UserRole, UserProfile> = {
  admin: {
    id: 'usr-admin-1',
    name: 'สมศักดิ์ นาวา',
    email: 'somsak.admin@example.com',
    role: 'admin',
    avatar: '👑',
  },
  editor: {
    id: 'usr-editor-1',
    name: 'วิภาดา ช่างเทคนิค',
    email: 'wiphada.tech@example.com',
    role: 'editor',
    avatar: '🔧',
  },
  viewer: {
    id: 'usr-viewer-1',
    name: 'อนุชา ตรวจการ',
    email: 'anucha.viewer@example.com',
    role: 'viewer',
    avatar: '👁️',
  },
};

/**
 * ดึงข้อมูลผู้ใช้งานปัจจุบัน (ค่าเริ่มต้นคือ Admin เพื่อความสะดวกในการเริ่มต้นใช้งาน)
 */
export function getCurrentUser(): UserProfile {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id && parsed.role) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return PRESET_USERS.admin;
}

/**
 * บันทึกผู้ใช้งานปัจจุบัน
 */
export function setCurrentUser(user: UserProfile | null): void {
  try {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

/**
 * ตรวจสอบสิทธิ์การแก้ไข/เพิ่ม/ย้ายหมุด (Editor หรือ Admin เท่านั้น)
 */
export function canEditEquipment(user: UserProfile | null): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'editor';
}

/**
 * ตรวจสอบสิทธิ์การจัดการแผนที่และลบข้อมูลระดับระบบ (Admin เท่านั้น)
 */
export function canManageMaps(user: UserProfile | null): boolean {
  if (!user) return false;
  return user.role === 'admin';
}

/**
 * ตรวจสอบสิทธิ์การลบจุดติดตั้ง
 */
export function canDeleteEquipment(user: UserProfile | null): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'editor';
}
