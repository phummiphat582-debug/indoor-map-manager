/**
 * ประเภทอุปกรณ์ที่รองรับในระบบ
 */
export type EquipmentType = 'cctv' | 'fire_extinguisher' | 'smoke_detector' | 'router' | 'emergency_exit' | 'first_aid';

/**
 * สถานะการใช้งานของอุปกรณ์
 */
export type EquipmentStatus = 'normal' | 'maintenance' | 'defective';

/**
 * สิทธิ์ผู้ใช้งานในระบบ (Role-based Access Control)
 */
export type UserRole = 'admin' | 'editor' | 'viewer';

/**
 * ข้อมูลโปรไฟล์ผู้ใช้งาน
 */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

/**
 * รูปภาพแนบของอุปกรณ์
 */
export interface EquipmentPhoto {
  id: string;
  dataUrl: string; // Base64 data URL
  name: string;
  size: number;
  uploadedAt: string;
}

/**
 * ข้อมูลจุดติดตั้งอุปกรณ์ (พิกัดเป็น Normalized Coordinates 0.0 - 1.0)
 * แต่ละจุดผูกกับ mapId เพื่อแยกข้อมูลแผนที่ออกจากกันอย่างสมบูรณ์
 */
export interface EquipmentPin {
  id: string;
  mapId: string;              // รหัสแผนที่ที่หมุดนี้สังกัดอยู่ (ห้ามปะปนกัน)
  name: string;               // ชื่ออุปกรณ์
  type: EquipmentType;        // ประเภทอุปกรณ์
  code: string;               // รหัสอุปกรณ์ (เช่น CCTV-01, FE-02)
  zone: string;               // ตำแหน่งหรือโซน
  buildingFloor: string;      // ชั้น/อาคาร
  installDate: string;        // วันที่ติดตั้ง (YYYY-MM-DD)
  status: EquipmentStatus;    // สถานะ
  notes: string;              // หมายเหตุ
  x: number;                  // พิกัด X สัมพัทธ์กับภาพแผนที่ (0.0 ถึง 1.0)
  y: number;                  // พิกัด Y สัมพัทธ์กับภาพแผนที่ (0.0 ถึง 1.0)
  photos: EquipmentPhoto[];   // รูปภาพจริงของอุปกรณ์
  createdAt: string;          // วันที่สร้าง
  updatedAt: string;          // วันที่แก้ไขล่าสุด
  updatedBy?: string;         // ชื่อผู้แก้ไขล่าสุด (เช่น "สมศักดิ์ (Admin)")
  version?: number;           // เลขเวอร์ชันสำหรับป้องกันข้อมูลชนกัน (Optimistic Concurrency)
}

/**
 * ข้อมูลแผนที่ผังอาคาร (รองรับหลายแผนที่)
 */
export interface FloorPlan {
  id: string;
  name: string;               // ชื่อแผนที่ เช่น "ชั้น 1", "ชั้น 2", "อาคาร A", "ลานจอดรถ"
  dataUrl: string;            // Base64 data URL ของภาพแผนที่
  mimeType: string;           // 'image/png' | 'image/jpeg' | 'image/svg+xml' etc.
  width: number;              // ความกว้างจริงของภาพ
  height: number;             // ความสูงจริงของภาพ
  fileSize: number;           // ขนาดไฟล์ (bytes)
  uploadedAt: string;         // วันที่อัปโหลด
  updatedAt?: string;         // วันที่แก้ไขล่าสุด
  updatedBy?: string;         // ผู้แก้ไขล่าสุด
  version?: number;
}

/**
 * ข้อมูลโครงสร้างสำหรับ Export/Import JSON (เวอร์ชัน 2.0 รองรับหลายแผนที่)
 */
export interface FloorPlanProjectExport {
  version: '2.0' | '1.0';
  exportedAt: string;
  appName: 'indoor-map-manager';
  activeMapId?: string;
  maps: FloorPlan[];
  equipment: EquipmentPin[];
  // รองรับรูปแบบเดิม v1.0
  floorPlan?: FloorPlan | null;
}

/**
 * ข้อมูลคำอธิบายและธีมของประเภทอุปกรณ์
 */
export interface EquipmentTypeDefinition {
  type: EquipmentType;
  label: string;
  emoji: string;
  iconName: string;
  colorHex: string;
  badgeBg: string;
  badgeText: string;
  ringColor: string;
}

/**
 * ข้อมูลคำอธิบายของสถานะ
 */
export interface EquipmentStatusDefinition {
  status: EquipmentStatus;
  label: string;
  colorHex: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

/**
 * ข้อมูลการแปลงตำแหน่งแผนที่ (Zoom & Pan)
 */
export interface MapTransform {
  scale: number;
  translateX: number;
  translateY: number;
}

/**
 * Toast Notification
 */
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

/**
 * สถานะการเชื่อมต่อเครือข่ายออนไลน์แบบเรียลไทม์
 */
export type ConnectionStatus = 'connected' | 'connecting' | 'offline' | 'error';

/**
 * ผู้ให้บริการคลาวด์เรียลไทม์
 */
export type RealtimeProviderType = 'cloud-relay' | 'supabase';

/**
 * การตั้งค่าคลาวด์และเรียลไทม์
 */
export interface CloudConfig {
  provider: RealtimeProviderType;
  roomId: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  autoSync: boolean;
}

/**
 * รายการคำสั่งบันทึกข้อมูลตอนออฟไลน์ (Offline Sync Queue)
 */
export interface OfflineMutation {
  id: string;
  action: 'UPSERT_PIN' | 'DELETE_PIN' | 'UPSERT_MAP' | 'DELETE_MAP';
  payload: any;
  timestamp: string;
  retryCount: number;
}

export type RealtimeMessageType =
  | 'PIN_UPSERT'
  | 'PIN_DELETE'
  | 'MAP_UPSERT'
  | 'MAP_DELETE'
  | 'MAP_CHUNK_START'
  | 'MAP_CHUNK_PART'
  | 'REQUEST_SYNC'
  | 'RESPONSE_SYNC';

/**
 * โครงสร้างข้อความสำหรับ Realtime Broadcast
 */
export interface RealtimeMessage {
  type: RealtimeMessageType;
  senderId: string;
  senderName: string;
  timestamp: string;
  payload: any;
}
