import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { EquipmentPin, FloorPlan } from '../types';

interface IndoorMapDB extends DBSchema {
  floorPlans: {
    key: string;
    value: FloorPlan;
  };
  equipment: {
    key: string;
    value: EquipmentPin;
    indexes: {
      'by-mapId': string;
      'by-type': string;
      'by-status': string;
      'by-code': string;
    };
  };
  settings: {
    key: string;
    value: unknown;
  };
}

const DB_NAME = 'IndoorEquipmentMapDB';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<IndoorMapDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<IndoorMapDB>> {
  if (!dbPromise) {
    dbPromise = openDB<IndoorMapDB>(DB_NAME, DB_VERSION, {
      async upgrade(db, oldVersion, _newVersion, transaction) {
        // สร้าง store สำหรับแผนที่หลายแผนที่
        if (!db.objectStoreNames.contains('floorPlans')) {
          db.createObjectStore('floorPlans', { keyPath: 'id' });
        }

        // จัดการ store อุปกรณ์
        let eqStore;
        if (!db.objectStoreNames.contains('equipment')) {
          eqStore = db.createObjectStore('equipment', { keyPath: 'id' });
        } else {
          eqStore = transaction.objectStore('equipment');
        }

        if (!eqStore.indexNames.contains('by-mapId')) {
          eqStore.createIndex('by-mapId', 'mapId');
        }
        if (!eqStore.indexNames.contains('by-type')) {
          eqStore.createIndex('by-type', 'type');
        }
        if (!eqStore.indexNames.contains('by-status')) {
          eqStore.createIndex('by-status', 'status');
        }
        if (!eqStore.indexNames.contains('by-code')) {
          eqStore.createIndex('by-code', 'code');
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }

        // ถ้าอัปเกรดจาก v1 (ที่มี store floorPlan เดิม)
        if (oldVersion < 2 && db.objectStoreNames.contains('floorPlan' as unknown as 'floorPlans')) {
          try {
            // @ts-expect-error legacy store migration
            const oldPlanStore = transaction.objectStore('floorPlan');
            const oldPlan = (await oldPlanStore.get('current')) as FloorPlan | undefined;
            if (oldPlan) {
              const plansStore = transaction.objectStore('floorPlans');
              await plansStore.put(oldPlan);
              // อัปเดตอุปกรณ์เดิมให้ผูกกับ mapId นี้
              const allEq = (await eqStore.getAll()) as EquipmentPin[];
              for (const eq of allEq) {
                if (!eq.mapId) {
                  eq.mapId = oldPlan.id;
                  await eqStore.put(eq);
                }
              }
            }
          } catch {
            // ignore
          }
        }
      },
    });
  }
  return dbPromise;
}

// ---------------------------------------------
// แผนที่ผังอาคาร (Floor Plans)
// ---------------------------------------------

/**
 * ดึงรายการแผนที่ทั้งหมด
 */
export async function getAllFloorPlansFromDB(): Promise<FloorPlan[]> {
  const db = await getDB();
  return db.getAll('floorPlans');
}

/**
 * ดึงแผนที่เดี่ยวตาม ID
 */
export async function getFloorPlanByIdFromDB(id: string): Promise<FloorPlan | null> {
  const db = await getDB();
  const plan = await db.get('floorPlans', id);
  return plan || null;
}

/**
 * บันทึกหรืออัปเดตแผนที่
 */
export async function saveFloorPlanToDB(floorPlan: FloorPlan): Promise<void> {
  const db = await getDB();
  await db.put('floorPlans', floorPlan);
}

/**
 * บันทึกชุดแผนที่ (Bulk save)
 */
export async function saveAllFloorPlansToDB(plans: FloorPlan[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('floorPlans', 'readwrite');
  for (const plan of plans) {
    await tx.store.put(plan);
  }
  await tx.done;
}

/**
 * แก้ไขชื่อแผนที่
 */
export async function updateFloorPlanNameInDB(id: string, newName: string): Promise<void> {
  const db = await getDB();
  const plan = await db.get('floorPlans', id);
  if (plan) {
    plan.name = newName;
    plan.updatedAt = new Date().toISOString();
    await db.put('floorPlans', plan);
  }
}

/**
 * ลบแผนที่ (พร้อมลบหมุดทั้งหมดที่สังกัดแผนที่นี้)
 */
export async function deleteFloorPlanFromDB(id: string): Promise<void> {
  const db = await getDB();
  // 1. ลบแผนที่
  await db.delete('floorPlans', id);

  // 2. ลบหมุดที่สังกัดแผนที่นี้
  const tx = db.transaction('equipment', 'readwrite');
  const index = tx.store.index('by-mapId');
  let cursor = await index.openCursor(IDBKeyRange.only(id));
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}

/**
 * ล้างข้อมูลแผนที่ทั้งหมด
 */
export async function clearAllFloorPlansFromDB(): Promise<void> {
  const db = await getDB();
  await db.clear('floorPlans');
}

// ---------------------------------------------
// จุดติดตั้งอุปกรณ์ (Equipment Pins)
// ---------------------------------------------

/**
 * ดึงรายการอุปกรณ์ทั้งหมดในระบบ
 */
export async function getAllEquipmentFromDB(): Promise<EquipmentPin[]> {
  const db = await getDB();
  return db.getAll('equipment');
}

/**
 * ดึงรายการอุปกรณ์เฉพาะแผนที่ที่ระบุ (แยกข้อมูลออกจากกันอย่างสมบูรณ์)
 */
export async function getEquipmentByMapIdFromDB(mapId: string): Promise<EquipmentPin[]> {
  const db = await getDB();
  return db.getAllFromIndex('equipment', 'by-mapId', mapId);
}

/**
 * บันทึกหรืออัปเดตอุปกรณ์เดี่ยว
 */
export async function saveEquipmentToDB(equipment: EquipmentPin): Promise<void> {
  const db = await getDB();
  await db.put('equipment', equipment);
}

/**
 * บันทึกรายการอุปกรณ์แบบชุด (Bulk save)
 */
export async function saveAllEquipmentToDB(items: EquipmentPin[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('equipment', 'readwrite');
  for (const item of items) {
    await tx.store.put(item);
  }
  await tx.done;
}

/**
 * ลบอุปกรณ์ตาม ID
 */
export async function deleteEquipmentFromDB(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('equipment', id);
}

/**
 * ล้างข้อมูลอุปกรณ์ทั้งหมด
 */
export async function clearAllEquipmentFromDB(): Promise<void> {
  const db = await getDB();
  await db.clear('equipment');
}

// ---------------------------------------------
// การตั้งค่าระบบ (Settings)
// ---------------------------------------------

/**
 * บันทึก ID ของแผนที่ล่าสุดที่กำลังเปิดดู
 */
export async function saveActiveMapIdToDB(mapId: string | null): Promise<void> {
  const db = await getDB();
  if (mapId) {
    await db.put('settings', mapId, 'activeMapId');
  } else {
    await db.delete('settings', 'activeMapId');
  }
}

/**
 * ดึง ID ของแผนที่ล่าสุดที่กำลังเปิดดู
 */
export async function getActiveMapIdFromDB(): Promise<string | null> {
  try {
    const db = await getDB();
    const id = await db.get('settings', 'activeMapId');
    return typeof id === 'string' ? id : null;
  } catch {
    return null;
  }
}
