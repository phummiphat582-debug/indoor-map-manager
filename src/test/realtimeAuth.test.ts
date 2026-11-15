import { describe, it, expect, beforeEach } from 'vitest';
import { canEditEquipment, canManageMaps, canDeleteEquipment, PRESET_USERS } from '../services/auth';
import { realtimeEngine } from '../services/realtime/realtimeEngine';
import type { EquipmentPin } from '../types';

describe('Realtime Engine & Role-Based Access Control (RBAC)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('correctly verifies role-based permissions for Admin, Editor, and Viewer', () => {
    const admin = PRESET_USERS.admin;
    const editor = PRESET_USERS.editor;
    const viewer = PRESET_USERS.viewer;

    // Admin has full permissions
    expect(canEditEquipment(admin)).toBe(true);
    expect(canManageMaps(admin)).toBe(true);
    expect(canDeleteEquipment(admin)).toBe(true);

    // Editor can edit/delete pins but cannot manage/delete maps
    expect(canEditEquipment(editor)).toBe(true);
    expect(canManageMaps(editor)).toBe(false);
    expect(canDeleteEquipment(editor)).toBe(true);

    // Viewer is read-only
    expect(canEditEquipment(viewer)).toBe(false);
    expect(canManageMaps(viewer)).toBe(false);
    expect(canDeleteEquipment(viewer)).toBe(false);

    // Null user has no permissions
    expect(canEditEquipment(null)).toBe(false);
  });

  it('broadcasts pin upsert with editor metadata, timestamp, and version bump', async () => {
    const basePin: EquipmentPin = {
      id: 'eq-test-1',
      mapId: 'map-1',
      name: 'กล้องตรวจการหลัก',
      type: 'cctv',
      code: 'CAM-01',
      zone: 'ทางเข้าหลัก',
      buildingFloor: 'ชั้น 1',
      installDate: '2026-11-15',
      status: 'normal',
      notes: 'ทดสอบ',
      x: 0.5,
      y: 0.5,
      photos: [],
      createdAt: '2026-11-15T00:00:00.000Z',
      updatedAt: '2026-11-15T00:00:00.000Z',
      version: 1,
    };

    const updated = await realtimeEngine.broadcastPinUpsert(basePin);

    expect(updated.version).toBe(2);
    expect(updated.updatedBy).toBeDefined();
    expect(updated.updatedAt).toBeDefined();
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThan(0);
  });

  it('switches realtime room id cleanly', () => {
    realtimeEngine.setRoomId('building-c-lobby');
    expect(realtimeEngine.getRoomId()).toBe('building-c-lobby');
  });
});
