import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { EquipmentPin, FloorPlan } from '../types';

interface IndoorMapDB extends DBSchema {
  floorPlan: {
    key: string;
    value: FloorPlan;
  };
  equipment: {
    key: string;
    value: EquipmentPin;
    indexes: {
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
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<IndoorMapDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<IndoorMapDB>> {
  if (!dbPromise) {
    dbPromise = openDB<IndoorMapDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('floorPlan')) {
          db.createObjectStore('floorPlan');
        }
        if (!db.objectStoreNames.contains('equipment')) {
          const eqStore = db.createObjectStore('equipment', { keyPath: 'id' });
          eqStore.createIndex('by-type', 'type');
          eqStore.createIndex('by-status', 'status');
          eqStore.createIndex('by-code', 'code');
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    });
  }
  return dbPromise;
}

/**
 * บันทึกแผนที่ผังอาคาร
 */
export async function saveFloorPlanToDB(floorPlan: FloorPlan): Promise<void> {
  const db = await getDB();
  await db.put('floorPlan', floorPlan, 'current');
}

/**
 * ดึงข้อมูลแผนที่ผังอาคารปัจจุบัน
 */
export async function getFloorPlanFromDB(): Promise<FloorPlan | null> {
  const db = await getDB();
  const plan = await db.get('floorPlan', 'current');
  return plan || null;
}

/**
 * ลบข้อมูลแผนที่ผังอาคาร
 */
export async function deleteFloorPlanFromDB(): Promise<void> {
  const db = await getDB();
  await db.delete('floorPlan', 'current');
}

/**
 * ดึงรายการอุปกรณ์ทั้งหมด
 */
export async function getAllEquipmentFromDB(): Promise<EquipmentPin[]> {
  const db = await getDB();
  return db.getAll('equipment');
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

/**
 * บันทึกการตั้งค่า
 */
export async function saveSettingToDB<T>(key: string, value: T): Promise<void> {
  const db = await getDB();
  await db.put('settings', value, key);
}

/**
 * ดึงการตั้งค่า
 */
export async function getSettingFromDB<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await getDB();
    const value = await db.get('settings', key);
    return value !== undefined ? (value as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}
