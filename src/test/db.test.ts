import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveFloorPlanToDB,
  getAllFloorPlansFromDB,
  getFloorPlanByIdFromDB,
  updateFloorPlanNameInDB,
  deleteFloorPlanFromDB,
  clearAllFloorPlansFromDB,
  saveEquipmentToDB,
  getAllEquipmentFromDB,
  getEquipmentByMapIdFromDB,
  deleteEquipmentFromDB,
  clearAllEquipmentFromDB,
} from '../services/db';
import type { FloorPlan, EquipmentPin } from '../types';

describe('IndexedDB Multi-Map Storage Service', () => {
  beforeEach(async () => {
    await clearAllEquipmentFromDB();
    await clearAllFloorPlansFromDB();
  });

  it('saves and retrieves multiple floor plans and updates name', async () => {
    const map1: FloorPlan = {
      id: 'map-f1',
      name: 'ชั้น 1 อาคารนวัตกรรม',
      dataUrl: 'data:image/png;base64,mock1',
      mimeType: 'image/png',
      width: 1200,
      height: 800,
      fileSize: 1024,
      uploadedAt: new Date().toISOString(),
    };

    const map2: FloorPlan = {
      id: 'map-f2',
      name: 'ชั้น 2 อาคารนวัตกรรม',
      dataUrl: 'data:image/png;base64,mock2',
      mimeType: 'image/png',
      width: 1200,
      height: 800,
      fileSize: 2048,
      uploadedAt: new Date().toISOString(),
    };

    await saveFloorPlanToDB(map1);
    await saveFloorPlanToDB(map2);

    const allMaps = await getAllFloorPlansFromDB();
    expect(allMaps.length).toBe(2);

    // Update name
    await updateFloorPlanNameInDB('map-f1', 'ชั้น 1 (โซน A)');
    const updated = await getFloorPlanByIdFromDB('map-f1');
    expect(updated?.name).toBe('ชั้น 1 (โซน A)');
  });

  it('isolates pins strictly by mapId and cascades deletion cleanly', async () => {
    const map1: FloorPlan = {
      id: 'map-f1',
      name: 'ชั้น 1',
      dataUrl: 'data:image/png;base64,mock1',
      mimeType: 'image/png',
      width: 1000,
      height: 800,
      fileSize: 1000,
      uploadedAt: new Date().toISOString(),
    };

    const map2: FloorPlan = {
      id: 'map-f2',
      name: 'ชั้น 2',
      dataUrl: 'data:image/png;base64,mock2',
      mimeType: 'image/png',
      width: 1000,
      height: 800,
      fileSize: 1000,
      uploadedAt: new Date().toISOString(),
    };

    await saveFloorPlanToDB(map1);
    await saveFloorPlanToDB(map2);

    // Pin on Map 1
    const pinMap1: EquipmentPin = {
      id: 'pin-m1',
      mapId: 'map-f1',
      name: 'กล้องชั้น 1',
      type: 'cctv',
      code: 'CAM-L1',
      zone: 'ทางเข้า',
      buildingFloor: 'ชั้น 1',
      installDate: '2026-01-01',
      status: 'normal',
      notes: '',
      x: 0.2,
      y: 0.3,
      photos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Pin on Map 2
    const pinMap2: EquipmentPin = {
      id: 'pin-m2',
      mapId: 'map-f2',
      name: 'ถังดับเพลิงชั้น 2',
      type: 'fire_extinguisher',
      code: 'FE-L2',
      zone: 'บันได',
      buildingFloor: 'ชั้น 2',
      installDate: '2026-01-01',
      status: 'normal',
      notes: '',
      x: 0.8,
      y: 0.9,
      photos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveEquipmentToDB(pinMap1);
    await saveEquipmentToDB(pinMap2);

    // Verify isolation by mapId
    const map1Pins = await getEquipmentByMapIdFromDB('map-f1');
    const map2Pins = await getEquipmentByMapIdFromDB('map-f2');

    expect(map1Pins.length).toBe(1);
    expect(map1Pins[0].id).toBe('pin-m1');
    expect(map2Pins.length).toBe(1);
    expect(map2Pins[0].id).toBe('pin-m2');

    // Deleting Map 1 should delete Map 1 and its pins, leaving Map 2 and its pins completely intact
    await deleteFloorPlanFromDB('map-f1');

    const mapsRemaining = await getAllFloorPlansFromDB();
    expect(mapsRemaining.length).toBe(1);
    expect(mapsRemaining[0].id).toBe('map-f2');

    const allPinsRemaining = await getAllEquipmentFromDB();
    expect(allPinsRemaining.length).toBe(1);
    expect(allPinsRemaining[0].id).toBe('pin-m2');
  });
});
