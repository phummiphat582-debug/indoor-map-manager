import type {
  EquipmentType,
  EquipmentTypeDefinition,
  EquipmentStatus,
  EquipmentStatusDefinition,
} from '../types';

export const EQUIPMENT_TYPES: Record<EquipmentType, EquipmentTypeDefinition> = {
  cctv: {
    type: 'cctv',
    label: 'กล้องวงจรปิด',
    emoji: '📹',
    iconName: 'Camera',
    colorHex: '#2563eb', // Blue
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
    badgeText: 'text-blue-700',
    ringColor: 'ring-blue-500',
  },
  fire_extinguisher: {
    type: 'fire_extinguisher',
    label: 'ถังดับเพลิง',
    emoji: '🧯',
    iconName: 'Flame',
    colorHex: '#dc2626', // Red
    badgeBg: 'bg-red-100 text-red-800 border-red-200',
    badgeText: 'text-red-700',
    ringColor: 'ring-red-500',
  },
  smoke_detector: {
    type: 'smoke_detector',
    label: 'เครื่องตรวจจับควัน',
    emoji: '🚨',
    iconName: 'Bell',
    colorHex: '#ea580c', // Orange
    badgeBg: 'bg-orange-100 text-orange-800 border-orange-200',
    badgeText: 'text-orange-700',
    ringColor: 'ring-orange-500',
  },
  router: {
    type: 'router',
    label: 'เราเตอร์ / Access Point',
    emoji: '📶',
    iconName: 'Wifi',
    colorHex: '#0284c7', // Sky
    badgeBg: 'bg-sky-100 text-sky-800 border-sky-200',
    badgeText: 'text-sky-700',
    ringColor: 'ring-sky-500',
  },
  emergency_exit: {
    type: 'emergency_exit',
    label: 'ทางออกฉุกเฉิน',
    emoji: '🚪',
    iconName: 'DoorOpen',
    colorHex: '#16a34a', // Green
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    badgeText: 'text-emerald-700',
    ringColor: 'ring-emerald-500',
  },
  first_aid: {
    type: 'first_aid',
    label: 'จุดปฐมพยาบาล',
    emoji: '🩹',
    iconName: 'Cross',
    colorHex: '#be185d', // Pink/Rose
    badgeBg: 'bg-pink-100 text-pink-800 border-pink-200',
    badgeText: 'text-pink-700',
    ringColor: 'ring-pink-500',
  },
};

export const EQUIPMENT_STATUSES: Record<EquipmentStatus, EquipmentStatusDefinition> = {
  normal: {
    status: 'normal',
    label: 'ใช้งานปกติ',
    colorHex: '#16a34a',
    bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-500',
  },
  maintenance: {
    status: 'maintenance',
    label: 'ต้องตรวจสอบ',
    colorHex: '#d97706',
    bgClass: 'bg-amber-50 text-amber-700 border-amber-200',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-500',
  },
  defective: {
    status: 'defective',
    label: 'ชำรุด',
    colorHex: '#dc2626',
    bgClass: 'bg-rose-50 text-rose-700 border-rose-200',
    textClass: 'text-rose-700',
    borderClass: 'border-rose-500',
  },
};

export const MAX_FILE_SIZE_MB = 25;
export const MAX_IMAGE_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
export const ALLOWED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.svg'];
