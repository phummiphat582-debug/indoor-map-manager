import { describe, it, expect } from 'vitest';
import { validateImportJSON } from '../services/importExport';
import type { FloorPlanProjectExport } from '../types';

describe('JSON Import/Export Validation', () => {
  it('accepts valid export payload with floor plan and equipment', () => {
    const validData: FloorPlanProjectExport = {
      version: '1.0',
      appName: 'indoor-map-manager',
      exportedAt: new Date().toISOString(),
      floorPlan: {
        id: 'fp-1',
        name: 'Floor1.png',
        dataUrl: 'data:image/png;base64,mock',
        mimeType: 'image/png',
        width: 1920,
        height: 1080,
        fileSize: 50000,
        uploadedAt: new Date().toISOString(),
      },
      equipment: [
        {
          id: 'eq-1',
          name: 'กล้องวงจรปิด L1-01',
          type: 'cctv',
          code: 'CAM-01',
          zone: 'ทางเข้าหลัก',
          buildingFloor: 'ชั้น 1',
          installDate: '2026-01-15',
          status: 'normal',
          notes: 'ความละเอียด 4K',
          x: 0.25,
          y: 0.35,
          photos: [
            {
              id: 'p-1',
              name: 'camera1.jpg',
              dataUrl: 'data:image/jpeg;base64,mock',
              size: 12000,
              uploadedAt: new Date().toISOString(),
            },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'eq-2',
          name: 'ถังดับเพลิง โซนบันไดหนีไฟ',
          type: 'fire_extinguisher',
          code: 'FE-01',
          zone: 'บันไดหนีไฟ A',
          buildingFloor: 'ชั้น 1',
          installDate: '2026-02-10',
          status: 'maintenance',
          notes: 'ตรวจแรงดันทุก 6 เดือน',
          x: 0.75,
          y: 0.85,
          photos: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    };

    const res = validateImportJSON(validData);
    expect(res.valid).toBe(true);
    expect(res.data?.equipment.length).toBe(2);
    expect(res.data?.floorPlan?.name).toBe('Floor1.png');
    expect(res.data?.equipment[0].type).toBe('cctv');
    expect(res.data?.equipment[1].type).toBe('fire_extinguisher');
    expect(res.data?.equipment[0].photos.length).toBe(1);
  });

  it('rejects foreign or corrupted JSON objects', () => {
    // Non-object
    expect(validateImportJSON('string text').valid).toBe(false);
    expect(validateImportJSON(null).valid).toBe(false);

    // Missing appName
    expect(validateImportJSON({ hello: 'world' }).valid).toBe(false);

    // Missing equipment array
    expect(
      validateImportJSON({
        appName: 'indoor-map-manager',
        floorPlan: null,
      }).valid
    ).toBe(false);

    // Invalid equipment type
    const invalidTypeData = {
      appName: 'indoor-map-manager',
      floorPlan: null,
      equipment: [
        {
          name: 'อุปกรณ์ไม่ทราบชนิด',
          type: 'laser_gun',
          code: 'XYZ-01',
          x: 0.5,
          y: 0.5,
        },
      ],
    };
    const res = validateImportJSON(invalidTypeData);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('ประเภทที่ไม่ถูกต้อง');
  });

  it('clamps coordinates to [0, 1] during import', () => {
    const dataWithOutOfBoundsCoords = {
      appName: 'indoor-map-manager',
      floorPlan: null,
      equipment: [
        {
          name: 'กล้องนอกกรอบ',
          type: 'cctv',
          code: 'CAM-OOB',
          zone: 'โซนทดสอบ',
          x: -0.5,
          y: 2.5,
        },
      ],
    };

    const res = validateImportJSON(dataWithOutOfBoundsCoords);
    expect(res.valid).toBe(true);
    expect(res.data?.equipment[0].x).toBe(0);
    expect(res.data?.equipment[0].y).toBe(1);
  });
});
