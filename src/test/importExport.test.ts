import { describe, it, expect } from 'vitest';
import { validateImportJSON } from '../services/importExport';
import type { FloorPlanProjectExport } from '../types';

describe('JSON Import/Export Validation (Multi-Map v2.0)', () => {
  it('accepts valid export payload with multiple floor plans and equipment with mapId', () => {
    const validData: FloorPlanProjectExport = {
      version: '2.0',
      appName: 'indoor-map-manager',
      exportedAt: new Date().toISOString(),
      activeMapId: 'map-1',
      maps: [
        {
          id: 'map-1',
          name: 'ชั้น 1 อาคาร A',
          dataUrl: 'data:image/png;base64,mock',
          mimeType: 'image/png',
          width: 1920,
          height: 1080,
          fileSize: 50000,
          uploadedAt: new Date().toISOString(),
        },
        {
          id: 'map-2',
          name: 'ชั้น 2 อาคาร A',
          dataUrl: 'data:image/png;base64,mock2',
          mimeType: 'image/png',
          width: 1920,
          height: 1080,
          fileSize: 45000,
          uploadedAt: new Date().toISOString(),
        },
      ],
      equipment: [
        {
          id: 'eq-1',
          mapId: 'map-1',
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
          photos: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'eq-2',
          mapId: 'map-2',
          name: 'ถังดับเพลิง L2-01',
          type: 'fire_extinguisher',
          code: 'FE-02',
          zone: 'โถงลิฟต์ ชั้น 2',
          buildingFloor: 'ชั้น 2',
          installDate: '2026-02-10',
          status: 'maintenance',
          notes: '',
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
    expect(res.data?.maps.length).toBe(2);
    expect(res.data?.equipment.length).toBe(2);
    expect(res.data?.equipment[0].mapId).toBe('map-1');
    expect(res.data?.equipment[1].mapId).toBe('map-2');
  });

  it('provides backward compatibility for v1.0 single floorPlan JSON', () => {
    const legacyData = {
      version: '1.0',
      appName: 'indoor-map-manager',
      exportedAt: new Date().toISOString(),
      floorPlan: {
        id: 'legacy-map',
        name: 'LegacyPlan.png',
        dataUrl: 'data:image/png;base64,mocklegacy',
        mimeType: 'image/png',
        width: 1000,
        height: 800,
        fileSize: 1000,
        uploadedAt: new Date().toISOString(),
      },
      equipment: [
        {
          id: 'eq-legacy-1',
          name: 'กล้องระบบเดิม',
          type: 'cctv',
          code: 'CAM-OLD',
          zone: 'โซนทดสอบ',
          x: 0.5,
          y: 0.5,
        },
      ],
    };

    const res = validateImportJSON(legacyData);
    expect(res.valid).toBe(true);
    expect(res.data?.maps.length).toBe(1);
    expect(res.data?.maps[0].id).toBe('legacy-map');
    expect(res.data?.equipment[0].mapId).toBe('legacy-map');
  });

  it('rejects foreign or corrupted JSON objects', () => {
    expect(validateImportJSON('string text').valid).toBe(false);
    expect(validateImportJSON(null).valid).toBe(false);
    expect(validateImportJSON({ hello: 'world' }).valid).toBe(false);
  });
});
