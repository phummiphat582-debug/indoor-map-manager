import type {
  FloorPlan,
  EquipmentPin,
  FloorPlanProjectExport,
  EquipmentType,
  EquipmentStatus,
} from '../types';

const VALID_EQUIPMENT_TYPES: EquipmentType[] = [
  'cctv',
  'fire_extinguisher',
  'smoke_detector',
  'router',
  'emergency_exit',
  'first_aid',
];

const VALID_STATUSES: EquipmentStatus[] = ['normal', 'maintenance', 'defective'];

export interface ImportValidationResult {
  valid: boolean;
  error?: string;
  data?: FloorPlanProjectExport;
}

/**
 * ตรวจสอบความถูกต้องของข้อมูล JSON ก่อนนำเข้า
 */
export function validateImportJSON(raw: unknown): ImportValidationResult {
  if (typeof raw !== 'object' || raw === null) {
    return { valid: false, error: 'โครงสร้างไฟล์ JSON ไม่ถูกต้อง' };
  }

  const obj = raw as Record<string, unknown>;

  if (obj.appName !== 'indoor-map-manager') {
    return { valid: false, error: 'ไฟล์นี้ไม่ใช่ข้อมูลของระบบจัดการแผนที่อุปกรณ์อาคาร (indoor-map-manager)' };
  }

  // ตรวจสอบ floorPlan
  let floorPlan: FloorPlan | null = null;
  if (obj.floorPlan) {
    const fp = obj.floorPlan as Record<string, unknown>;
    if (typeof fp.dataUrl !== 'string' || typeof fp.name !== 'string') {
      return { valid: false, error: 'ข้อมูลแผนที่ในไฟล์ไม่สมบูรณ์ (ขาด dataUrl หรือ name)' };
    }
    floorPlan = {
      id: typeof fp.id === 'string' ? fp.id : `fp-${Date.now()}`,
      name: fp.name,
      dataUrl: fp.dataUrl,
      mimeType: typeof fp.mimeType === 'string' ? fp.mimeType : 'image/png',
      width: typeof fp.width === 'number' ? fp.width : 1000,
      height: typeof fp.height === 'number' ? fp.height : 800,
      fileSize: typeof fp.fileSize === 'number' ? fp.fileSize : 0,
      uploadedAt: typeof fp.uploadedAt === 'string' ? fp.uploadedAt : new Date().toISOString(),
    };
  }

  // ตรวจสอบ equipment array
  if (!Array.isArray(obj.equipment)) {
    return { valid: false, error: 'ไม่พบรายการอุปกรณ์ในไฟล์ (equipment array)' };
  }

  const equipment: EquipmentPin[] = [];
  for (let i = 0; i < obj.equipment.length; i++) {
    const item = obj.equipment[i] as Record<string, unknown>;
    if (!item || typeof item !== 'object') {
      return { valid: false, error: `ข้อมูลอุปกรณ์ลำดับที่ ${i + 1} ไม่ถูกต้อง` };
    }

    if (typeof item.name !== 'string' || !item.name.trim()) {
      return { valid: false, error: `อุปกรณ์ลำดับที่ ${i + 1} ขาดชื่ออุปกรณ์ (name)` };
    }

    const type = item.type as EquipmentType;
    if (!VALID_EQUIPMENT_TYPES.includes(type)) {
      return { valid: false, error: `อุปกรณ์ "${item.name}" มีประเภทที่ไม่ถูกต้อง (${item.type})` };
    }

    const status = item.status as EquipmentStatus;
    const validStatus = VALID_STATUSES.includes(status) ? status : 'normal';

    const x = typeof item.x === 'number' && !Number.isNaN(item.x) ? Math.max(0, Math.min(1, item.x)) : 0.5;
    const y = typeof item.y === 'number' && !Number.isNaN(item.y) ? Math.max(0, Math.min(1, item.y)) : 0.5;

    const photos = Array.isArray(item.photos)
      ? item.photos.filter((p) => p && typeof p.dataUrl === 'string')
      : [];

    equipment.push({
      id: typeof item.id === 'string' && item.id ? item.id : `pin-${Date.now()}-${i}`,
      name: item.name,
      type,
      code: typeof item.code === 'string' ? item.code : `CODE-${i + 1}`,
      zone: typeof item.zone === 'string' ? item.zone : '',
      buildingFloor: typeof item.buildingFloor === 'string' ? item.buildingFloor : '',
      installDate: typeof item.installDate === 'string' ? item.installDate : new Date().toISOString().split('T')[0],
      status: validStatus,
      notes: typeof item.notes === 'string' ? item.notes : '',
      x,
      y,
      photos,
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
      updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString(),
    });
  }

  return {
    valid: true,
    data: {
      version: '1.0',
      exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : new Date().toISOString(),
      appName: 'indoor-map-manager',
      floorPlan,
      equipment,
    },
  };
}

/**
 * ส่งออกข้อมูลโครงการเป็นไฟล์ JSON และดาวน์โหลดลงเครื่อง
 */
export function exportProjectToJSON(
  floorPlan: FloorPlan | null,
  equipment: EquipmentPin[],
  filenamePrefix = 'indoor-equipment-backup'
): void {
  const exportData: FloorPlanProjectExport = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    appName: 'indoor-map-manager',
    floorPlan,
    equipment,
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const filename = `${filenamePrefix}_${dateStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
