import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveFloorPlanToDB,
  getFloorPlanFromDB,
  deleteFloorPlanFromDB,
  saveEquipmentToDB,
  getAllEquipmentFromDB,
  deleteEquipmentFromDB,
  clearAllEquipmentFromDB,
} from '../services/db';
import type { FloorPlan, EquipmentPin } from '../types';

describe('IndexedDB Storage Service', () => {
  beforeEach(async () => {
    await clearAllEquipmentFromDB();
    await deleteFloorPlanFromDB();
  });

  it('saves and retrieves floor plan without data corruption', async () => {
    const mockFloorPlan: FloorPlan = {
      id: 'fp-test-1',
      name: 'building-floor-1.png',
      dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      mimeType: 'image/png',
      width: 1200,
      height: 800,
      fileSize: 1024,
      uploadedAt: new Date().toISOString(),
    };

    await saveFloorPlanToDB(mockFloorPlan);
    const retrieved = await getFloorPlanFromDB();

    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe('fp-test-1');
    expect(retrieved?.name).toBe('building-floor-1.png');
    expect(retrieved?.width).toBe(1200);
    expect(retrieved?.height).toBe(800);
  });

  it('saves, updates, and retrieves CCTV and Fire Extinguisher pins', async () => {
    const cctvPin: EquipmentPin = {
      id: 'cctv-1',
      name: 'กล้องโถงลิฟต์ A',
      type: 'cctv',
      code: 'CAM-LIFT-A',
      zone: 'โถงลิฟต์',
      buildingFloor: 'ชั้น 2',
      installDate: '2026-03-01',
      status: 'normal',
      notes: 'PTZ Camera 360',
      x: 0.35,
      y: 0.45,
      photos: [
        {
          id: 'p-cctv',
          name: 'cctv.png',
          dataUrl: 'data:image/png;base64,mockphoto',
          size: 500,
          uploadedAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const fireExtPin: EquipmentPin = {
      id: 'fe-1',
      name: 'ถังดับเพลิง CO2',
      type: 'fire_extinguisher',
      code: 'FE-CO2-01',
      zone: 'ห้องเซิร์ฟเวอร์',
      buildingFloor: 'ชั้น 2',
      installDate: '2026-03-05',
      status: 'normal',
      notes: 'ถัง CO2 ขนาด 10 ปอนด์',
      x: 0.7,
      y: 0.8,
      photos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save both
    await saveEquipmentToDB(cctvPin);
    await saveEquipmentToDB(fireExtPin);

    let allEquipment = await getAllEquipmentFromDB();
    expect(allEquipment.length).toBe(2);

    // Update fire extinguisher status to maintenance and change coordinate
    const updatedFE: EquipmentPin = {
      ...fireExtPin,
      status: 'maintenance',
      x: 0.72,
      y: 0.81,
    };
    await saveEquipmentToDB(updatedFE);

    allEquipment = await getAllEquipmentFromDB();
    const foundFE = allEquipment.find((item) => item.id === 'fe-1');
    expect(foundFE?.status).toBe('maintenance');
    expect(foundFE?.x).toBe(0.72);

    // Delete CCTV
    await deleteEquipmentFromDB('cctv-1');
    allEquipment = await getAllEquipmentFromDB();
    expect(allEquipment.length).toBe(1);
    expect(allEquipment[0].id).toBe('fe-1');
  });

  it('persists data across simulated browser session / reload', async () => {
    const pin: EquipmentPin = {
      id: 'persist-test',
      name: 'กล้องรักษาความปลอดภัยหลัก',
      type: 'cctv',
      code: 'CAM-PERSIST',
      zone: 'ป้อมยาม',
      buildingFloor: 'ชั้น 1',
      installDate: '2026-01-01',
      status: 'normal',
      notes: '',
      x: 0.1,
      y: 0.2,
      photos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveEquipmentToDB(pin);

    // Simulating page reload by re-querying fresh
    const list = await getAllEquipmentFromDB();
    expect(list.some((item) => item.code === 'CAM-PERSIST')).toBe(true);
  });
});
