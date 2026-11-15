import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { EquipmentPin, FloorPlan } from '../types';

let cachedClient: SupabaseClient | null = null;
let currentUrl = '';
let currentKey = '';

export function getSupabaseClient(url?: string, anonKey?: string): SupabaseClient | null {
  const targetUrl = url || localStorage.getItem('indoor_map_supabase_url') || '';
  const targetKey = anonKey || localStorage.getItem('indoor_map_supabase_key') || '';

  if (!targetUrl || !targetKey) {
    return null;
  }

  if (cachedClient && currentUrl === targetUrl && currentKey === targetKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(targetUrl, targetKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    currentUrl = targetUrl;
    currentKey = targetKey;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  localStorage.setItem('indoor_map_supabase_url', url.trim());
  localStorage.setItem('indoor_map_supabase_key', anonKey.trim());
  cachedClient = null;
}

export function clearSupabaseConfig(): void {
  localStorage.removeItem('indoor_map_supabase_url');
  localStorage.removeItem('indoor_map_supabase_key');
  cachedClient = null;
}

/**
 * สคริปต์ SQL สำหรับสร้างตารางบน Supabase พร้อมเปิดใช้งาน Realtime และ RLS ครบถ้วน
 */
export function getSupabaseMigrationSQL(): string {
  return `-- 1. สร้างตารางแผนที่ผังอาคาร
create table if not exists indoor_floor_plans (
  id text primary key,
  name text not null,
  data_url text not null,
  mime_type text not null default 'image/png',
  width integer not null default 1200,
  height integer not null default 800,
  file_size bigint not null default 0,
  uploaded_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text,
  version integer not null default 1
);

-- 2. สร้างตารางจุดติดตั้งอุปกรณ์
create table if not exists indoor_equipment (
  id text primary key,
  map_id text not null references indoor_floor_plans(id) on delete cascade,
  name text not null,
  type text not null,
  code text not null,
  zone text not null default '',
  building_floor text not null default '',
  install_date text not null default '',
  status text not null default 'normal',
  notes text not null default '',
  x double precision not null,
  y double precision not null,
  photos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text,
  version integer not null default 1
);

-- 3. สร้างดัชนี (Index) เพื่อการสืบค้นที่รวดเร็ว
create index if not exists idx_indoor_equipment_map_id on indoor_equipment(map_id);
create index if not exists idx_indoor_equipment_type on indoor_equipment(type);
create index if not exists idx_indoor_equipment_code on indoor_equipment(code);

-- 4. เปิดใช้งาน Realtime
alter publication supabase_realtime add table indoor_floor_plans;
alter publication supabase_realtime add table indoor_equipment;

-- 5. ตั้งค่านโยบายความปลอดภัย (Row Level Security: RLS)
alter table indoor_floor_plans enable row level security;
alter table indoor_equipment enable row level security;

-- อนุญาตให้อ่านและบันทึกข้อมูลผ่าน Anon Key ได้อย่างปลอดภัย
create policy "Public read and write for floor plans"
on indoor_floor_plans for all
using (true)
with check (true);

create policy "Public read and write for equipment"
on indoor_equipment for all
using (true)
with check (true);
`;
}

/**
 * แปลงข้อมูลจาก Supabase รูปแบบ Snake Case สู่ Camel Case ในแอป
 */
export function mapSupabaseToFloorPlan(row: any): FloorPlan {
  return {
    id: row.id,
    name: row.name,
    dataUrl: row.data_url,
    mimeType: row.mime_type,
    width: row.width,
    height: row.height,
    fileSize: row.file_size,
    uploadedAt: row.uploaded_at,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    version: row.version || 1,
  };
}

export function mapFloorPlanToSupabase(plan: FloorPlan): any {
  return {
    id: plan.id,
    name: plan.name,
    data_url: plan.dataUrl,
    mime_type: plan.mimeType,
    width: plan.width,
    height: plan.height,
    file_size: plan.fileSize,
    uploaded_at: plan.uploadedAt,
    updated_at: plan.updatedAt || new Date().toISOString(),
    updated_by: plan.updatedBy || null,
    version: (plan.version || 1) + 1,
  };
}

export function mapSupabaseToEquipment(row: any): EquipmentPin {
  return {
    id: row.id,
    mapId: row.map_id,
    name: row.name,
    type: row.type,
    code: row.code,
    zone: row.zone || '',
    buildingFloor: row.building_floor || '',
    installDate: row.install_date || '',
    status: row.status,
    notes: row.notes || '',
    x: row.x,
    y: row.y,
    photos: Array.isArray(row.photos) ? row.photos : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    version: row.version || 1,
  };
}

export function mapEquipmentToSupabase(pin: EquipmentPin): any {
  return {
    id: pin.id,
    map_id: pin.mapId,
    name: pin.name,
    type: pin.type,
    code: pin.code,
    zone: pin.zone,
    building_floor: pin.buildingFloor,
    install_date: pin.installDate,
    status: pin.status,
    notes: pin.notes,
    x: pin.x,
    y: pin.y,
    photos: pin.photos || [],
    created_at: pin.createdAt,
    updated_at: pin.updatedAt || new Date().toISOString(),
    updated_by: pin.updatedBy || null,
    version: (pin.version || 1) + 1,
  };
}
