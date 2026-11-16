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

  it('chunks and reassembles large floor plan images across real-time broadcast', async () => {
    // สร้าง FloorPlan จำลองที่มี dataUrl ขนาด 150 KB (> REALTIME_CHUNK_SIZE 48 KB)
    const largeDummyDataUrl = 'data:image/jpeg;base64,' + 'A'.repeat(150 * 1024);
    const testMap = {
      id: 'map-chunk-test-1',
      name: 'ชั้น 1 อาคารวิจัย',
      dataUrl: largeDummyDataUrl,
      mimeType: 'image/jpeg',
      width: 2048,
      height: 1536,
      fileSize: 150 * 1024,
      uploadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    let receivedMap: any = null;
    let receivedSender = '';

    const unsubscribe = realtimeEngine.subscribe({
      onRemoteMapUpsert: (m, sender) => {
        receivedMap = m;
        receivedSender = sender;
      },
    });

    // จำลองข้อความเข้าแบบ MAP_CHUNK_START และ MAP_CHUNK_PART
    const totalChunks = Math.ceil(largeDummyDataUrl.length / (48 * 1024));

    // ส่ง Start
    (realtimeEngine as any).handleIncomingMessage({
      type: 'MAP_CHUNK_START',
      senderId: 'remote-client-999',
      senderName: 'Somsak (ADMIN)',
      timestamp: new Date().toISOString(),
      payload: {
        mapId: testMap.id,
        name: testMap.name,
        mimeType: testMap.mimeType,
        width: testMap.width,
        height: testMap.height,
        fileSize: testMap.fileSize,
        uploadedAt: testMap.uploadedAt,
        updatedAt: testMap.updatedAt,
        updatedBy: 'Somsak (ADMIN)',
        version: 2,
        totalChunks,
        totalLength: largeDummyDataUrl.length,
      },
    });

    // ส่ง Parts
    for (let i = 0; i < totalChunks; i++) {
      const chunk = largeDummyDataUrl.substring(i * 48 * 1024, (i + 1) * 48 * 1024);
      (realtimeEngine as any).handleIncomingMessage({
        type: 'MAP_CHUNK_PART',
        senderId: 'remote-client-999',
        senderName: 'Somsak (ADMIN)',
        timestamp: new Date().toISOString(),
        payload: {
          mapId: testMap.id,
          chunkIndex: i,
          totalChunks,
          chunk,
        },
      });
    }

    expect(receivedMap).not.toBeNull();
    expect(receivedMap.id).toBe(testMap.id);
    expect(receivedMap.name).toBe(testMap.name);
    expect(receivedMap.dataUrl).toBe(largeDummyDataUrl);
    expect(receivedMap.dataUrl.length).toBe(largeDummyDataUrl.length);
    expect(receivedSender).toBe('Somsak (ADMIN)');

    unsubscribe();
  });

  it('responds to REQUEST_SYNC by invoking syncDataProvider', () => {
    let syncRequested = false;
    realtimeEngine.setSyncDataProvider(() => {
      syncRequested = true;
      return {
        maps: [],
        pins: [],
      };
    });

    (realtimeEngine as any).handleIncomingMessage({
      type: 'REQUEST_SYNC',
      senderId: 'new-client-joining',
      senderName: 'Guest',
      timestamp: new Date().toISOString(),
      payload: {},
    });

    expect(syncRequested).toBe(true);
  });
});
