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

// ใช้ชื่อฐานข้อมูล v3 เพื่อตัดปัญหา upgrade lock/transaction deadlock จากเวอร์ชันเดิมในเบราว์เซอร์ของผู้ใช้
const DB_NAME = 'IndoorEquipmentMaps_v3';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<IndoorMapDB>> | null = null;
let useLocalStorageFallback = false;

// Fallback keys สำหรับ localStorage ในกรณีที่ IndexedDB ถูกบล็อกหรือทำงานไม่ได้
const LS_PLANS_KEY = 'indoor_map_floor_plans_v3';
const LS_EQUIPMENT_KEY = 'indoor_map_equipment_v3';
const LS_SETTINGS_KEY = 'indoor_map_settings_v3';

function getLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }
}

/**
 * ดึงการเชื่อมต่อ IndexedDB พร้อม Timeout ป้องกันการค้างตลอดกาล
 */
export function getDB(): Promise<IDBPDatabase<IndoorMapDB>> {
  if (useLocalStorageFallback) {
    return Promise.reject(new Error('Using localStorage fallback'));
  }

  if (!dbPromise) {
    const openPromise = openDB<IndoorMapDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // อัปเกรดแบบ Synchronous 100% ห้ามมี async/await ใน upgrade เพื่อป้องกัน transaction inactive deadlock
        if (!db.objectStoreNames.contains('floorPlans')) {
          db.createObjectStore('floorPlans', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('equipment')) {
          const eqStore = db.createObjectStore('equipment', { keyPath: 'id' });
          eqStore.createIndex('by-mapId', 'mapId');
          eqStore.createIndex('by-type', 'type');
          eqStore.createIndex('by-status', 'status');
          eqStore.createIndex('by-code', 'code');
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
      blocked() {
        console.warn('IndexedDB upgrade blocked by an existing tab.');
      },
      blocking(_currentVersion, _blockedVersion, event) {
        console.warn('IndexedDB is blocking an upgrade in another tab. Closing...');
        const target = event.target as unknown as { result?: IDBPDatabase<IndoorMapDB> };
        target?.result?.close?.();
      },
      terminated() {
        dbPromise = null;
      },
    });

    // เพิ่ม Timeout ป้องกัน IndexedDB ค้างเกิน 1200ms
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('IndexedDB open timeout')), 1200);
    });

    dbPromise = Promise.race([openPromise, timeoutPromise]).catch((err) => {
      console.warn('IndexedDB failed or timed out, switching to localStorage fallback:', err);
      useLocalStorageFallback = true;
      dbPromise = null;
      throw err;
    });
  }

  return dbPromise;
}

// ---------------------------------------------
// แผนที่ผังอาคาร (Floor Plans)
// ---------------------------------------------

export async function getAllFloorPlansFromDB(): Promise<FloorPlan[]> {
  try {
    const db = await getDB();
    return await db.getAll('floorPlans');
  } catch {
    return getLocalStorage<FloorPlan[]>(LS_PLANS_KEY, []);
  }
}

export async function getFloorPlanByIdFromDB(id: string): Promise<FloorPlan | null> {
  try {
    const db = await getDB();
    const plan = await db.get('floorPlans', id);
    return plan || null;
  } catch {
    const plans = getLocalStorage<FloorPlan[]>(LS_PLANS_KEY, []);
    return plans.find((p) => p.id === id) || null;
  }
}

export async function saveFloorPlanToDB(floorPlan: FloorPlan): Promise<void> {
  try {
    const db = await getDB();
    await db.put('floorPlans', floorPlan);
  } catch {
    const plans = getLocalStorage<FloorPlan[]>(LS_PLANS_KEY, []);
    const idx = plans.findIndex((p) => p.id === floorPlan.id);
    if (idx >= 0) {
      plans[idx] = floorPlan;
    } else {
      plans.push(floorPlan);
    }
    setLocalStorage(LS_PLANS_KEY, plans);
  }
}

export async function saveAllFloorPlansToDB(plans: FloorPlan[]): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction('floorPlans', 'readwrite');
    for (const plan of plans) {
      tx.store.put(plan);
    }
    await tx.done;
  } catch {
    setLocalStorage(LS_PLANS_KEY, plans);
  }
}

export async function updateFloorPlanNameInDB(id: string, newName: string): Promise<void> {
  try {
    const db = await getDB();
    const plan = await db.get('floorPlans', id);
    if (plan) {
      plan.name = newName;
      plan.updatedAt = new Date().toISOString();
      await db.put('floorPlans', plan);
    }
  } catch {
    const plans = getLocalStorage<FloorPlan[]>(LS_PLANS_KEY, []);
    const plan = plans.find((p) => p.id === id);
    if (plan) {
      plan.name = newName;
      plan.updatedAt = new Date().toISOString();
      setLocalStorage(LS_PLANS_KEY, plans);
    }
  }
}

export async function deleteFloorPlanFromDB(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('floorPlans', id);

    // ลบหมุดที่สังกัดแผนที่นี้
    const tx = db.transaction('equipment', 'readwrite');
    const index = tx.store.index('by-mapId');
    let cursor = await index.openCursor(IDBKeyRange.only(id));
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  } catch {
    const plans = getLocalStorage<FloorPlan[]>(LS_PLANS_KEY, []);
    setLocalStorage(
      LS_PLANS_KEY,
      plans.filter((p) => p.id !== id)
    );

    const eq = getLocalStorage<EquipmentPin[]>(LS_EQUIPMENT_KEY, []);
    setLocalStorage(
      LS_EQUIPMENT_KEY,
      eq.filter((p) => p.mapId !== id)
    );
  }
}

export async function clearAllFloorPlansFromDB(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear('floorPlans');
  } catch {
    setLocalStorage(LS_PLANS_KEY, []);
  }
}

// ---------------------------------------------
// จุดติดตั้งอุปกรณ์ (Equipment Pins)
// ---------------------------------------------

export async function getAllEquipmentFromDB(): Promise<EquipmentPin[]> {
  try {
    const db = await getDB();
    return await db.getAll('equipment');
  } catch {
    return getLocalStorage<EquipmentPin[]>(LS_EQUIPMENT_KEY, []);
  }
}

export async function getEquipmentByMapIdFromDB(mapId: string): Promise<EquipmentPin[]> {
  try {
    const db = await getDB();
    return await db.getAllFromIndex('equipment', 'by-mapId', mapId);
  } catch {
    const items = getLocalStorage<EquipmentPin[]>(LS_EQUIPMENT_KEY, []);
    return items.filter((p) => p.mapId === mapId);
  }
}

export async function saveEquipmentToDB(equipment: EquipmentPin): Promise<void> {
  try {
    const db = await getDB();
    await db.put('equipment', equipment);
  } catch {
    const items = getLocalStorage<EquipmentPin[]>(LS_EQUIPMENT_KEY, []);
    const idx = items.findIndex((p) => p.id === equipment.id);
    if (idx >= 0) {
      items[idx] = equipment;
    } else {
      items.push(equipment);
    }
    setLocalStorage(LS_EQUIPMENT_KEY, items);
  }
}

export async function saveAllEquipmentToDB(items: EquipmentPin[]): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction('equipment', 'readwrite');
    for (const item of items) {
      tx.store.put(item);
    }
    await tx.done;
  } catch {
    setLocalStorage(LS_EQUIPMENT_KEY, items);
  }
}

export async function deleteEquipmentFromDB(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('equipment', id);
  } catch {
    const items = getLocalStorage<EquipmentPin[]>(LS_EQUIPMENT_KEY, []);
    setLocalStorage(
      LS_EQUIPMENT_KEY,
      items.filter((p) => p.id !== id)
    );
  }
}

export async function clearAllEquipmentFromDB(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear('equipment');
  } catch {
    setLocalStorage(LS_EQUIPMENT_KEY, []);
  }
}

// ---------------------------------------------
// การตั้งค่าระบบ (Settings)
// ---------------------------------------------

export async function saveActiveMapIdToDB(mapId: string | null): Promise<void> {
  try {
    const db = await getDB();
    if (mapId) {
      await db.put('settings', mapId, 'activeMapId');
    } else {
      await db.delete('settings', 'activeMapId');
    }
  } catch {
    const settings = getLocalStorage<Record<string, unknown>>(LS_SETTINGS_KEY, {});
    if (mapId) {
      settings.activeMapId = mapId;
    } else {
      delete settings.activeMapId;
    }
    setLocalStorage(LS_SETTINGS_KEY, settings);
  }
}

export async function getActiveMapIdFromDB(): Promise<string | null> {
  try {
    const db = await getDB();
    const id = await db.get('settings', 'activeMapId');
    return typeof id === 'string' ? id : null;
  } catch {
    const settings = getLocalStorage<Record<string, unknown>>(LS_SETTINGS_KEY, {});
    return typeof settings.activeMapId === 'string' ? settings.activeMapId : null;
  }
}
