import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { clearAllEquipmentFromDB, clearAllFloorPlansFromDB, saveFloorPlanToDB, saveEquipmentToDB } from '../services/db';
import type { FloorPlan, EquipmentPin } from '../types';

describe('Indoor Map Manager Component Workflows (Multi-Map)', () => {
  beforeEach(async () => {
    await clearAllEquipmentFromDB();
    await clearAllFloorPlansFromDB();
    vi.clearAllMocks();
  });

  it('renders clean initial state with zero demo data and "เพิ่มแผนที่แรก" button', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('ระบบจัดการแผนที่ติดตั้งอุปกรณ์')).toBeInTheDocument();
    });

    // Check empty state
    const emptyLabels = screen.getAllByText('ยังไม่มีแผนที่ในระบบ');
    expect(emptyLabels.length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'เพิ่มแผนที่แรก' })).toBeInTheDocument();
  });

  it('opens map upload modal and allows naming the map', async () => {
    render(<App />);

    await waitFor(() => {
      const emptyLabels = screen.getAllByText('ยังไม่มีแผนที่ในระบบ');
      expect(emptyLabels.length).toBeGreaterThan(0);
    });

    const addFirstMapBtn = screen.getByRole('button', { name: 'เพิ่มแผนที่แรก' });
    fireEvent.click(addFirstMapBtn);

    expect(screen.getByText('เพิ่มแผนที่ผังอาคารใหม่')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('เช่น ชั้น 1, ชั้น 2, อาคาร A, ลานจอดรถ')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /ยกเลิก/i });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByText('เพิ่มแผนที่ผังอาคารใหม่')).not.toBeInTheDocument();
    });
  });

  it('switches between multiple maps and enforces complete pin isolation', async () => {
    const map1: FloorPlan = {
      id: 'map-1',
      name: 'ชั้น 1 อาคารหลัก',
      dataUrl: 'data:image/png;base64,mockmap1',
      mimeType: 'image/png',
      width: 1000,
      height: 800,
      fileSize: 5000,
      uploadedAt: new Date().toISOString(),
    };

    const map2: FloorPlan = {
      id: 'map-2',
      name: 'ชั้น 2 อาคารหลัก',
      dataUrl: 'data:image/png;base64,mockmap2',
      mimeType: 'image/png',
      width: 1000,
      height: 800,
      fileSize: 5000,
      uploadedAt: new Date().toISOString(),
    };

    const pinOnMap1: EquipmentPin = {
      id: 'cctv-l1',
      mapId: 'map-1',
      name: 'กล้องชั้น 1 ทางเข้า',
      type: 'cctv',
      code: 'CAM-L1-01',
      zone: 'โซนทางเข้า',
      buildingFloor: 'ชั้น 1',
      installDate: '2026-04-10',
      status: 'normal',
      notes: '',
      x: 0.5,
      y: 0.5,
      photos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const pinOnMap2: EquipmentPin = {
      id: 'fe-l2',
      mapId: 'map-2',
      name: 'ถังดับเพลิงชั้น 2',
      type: 'fire_extinguisher',
      code: 'FE-L2-01',
      zone: 'โซนบันได',
      buildingFloor: 'ชั้น 2',
      installDate: '2026-04-10',
      status: 'normal',
      notes: '',
      x: 0.8,
      y: 0.8,
      photos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveFloorPlanToDB(map1);
    await saveFloorPlanToDB(map2);
    await saveEquipmentToDB(pinOnMap1);
    await saveEquipmentToDB(pinOnMap2);

    render(<App />);

    // Initially Map 1 is active -> shows CAM-L1-01 and NOT FE-L2-01
    await waitFor(() => {
      expect(screen.getAllByText('CAM-L1-01').length).toBeGreaterThan(0);
    });
    expect(screen.queryByText('FE-L2-01')).not.toBeInTheDocument();

    // Switch to Map 2 by clicking on Map 2 in sidebar list (last element matching text)
    const map2Elements = screen.getAllByText('ชั้น 2 อาคารหลัก');
    fireEvent.click(map2Elements[map2Elements.length - 1]);

    // Now on Map 2 -> shows FE-L2-01 and NOT CAM-L1-01!
    await waitFor(() => {
      expect(screen.getAllByText('FE-L2-01').length).toBeGreaterThan(0);
    });
    expect(screen.queryByText('CAM-L1-01')).not.toBeInTheDocument();
  });

  it('opens detail drawer as bottom sheet / side panel and confirms pin deletion', async () => {
    const map1: FloorPlan = {
      id: 'map-1',
      name: 'ชั้น 1',
      dataUrl: 'data:image/png;base64,mock',
      mimeType: 'image/png',
      width: 800,
      height: 600,
      fileSize: 4000,
      uploadedAt: new Date().toISOString(),
    };

    const pin1: EquipmentPin = {
      id: 'cctv-test-pin',
      mapId: 'map-1',
      name: 'กล้องหน้าประตู',
      type: 'cctv',
      code: 'CAM-FRONT-01',
      zone: 'โซนหน้าประตูใหญ่',
      buildingFloor: 'ชั้น 1',
      installDate: '2026-04-10',
      status: 'normal',
      notes: '',
      x: 0.5,
      y: 0.5,
      photos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveFloorPlanToDB(map1);
    await saveEquipmentToDB(pin1);

    render(<App />);

    // Switch to equipment list tab
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'แท็บรายการจุดติดตั้ง' })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'แท็บรายการจุดติดตั้ง' }));

    // Click equipment item in list
    await waitFor(() => {
      const pinElements = screen.getAllByText('กล้องหน้าประตู');
      expect(pinElements.length).toBeGreaterThan(0);
    });
    const pinElements = screen.getAllByText('กล้องหน้าประตู');
    fireEvent.click(pinElements[0]);

    // Drawer should show details
    await waitFor(() => {
      expect(screen.getAllByText('โซนหน้าประตูใหญ่').length).toBeGreaterThan(0);
      expect(screen.getByText('ยังไม่มีรูปภาพ')).toBeInTheDocument();
    });

    // Delete pin
    const deleteBtn = screen.getByRole('button', { name: /ลบจุดติดตั้งนี้/i });
    fireEvent.click(deleteBtn);

    expect(screen.getByText('ยืนยันการลบจุดติดตั้ง')).toBeInTheDocument();

    const confirmDeleteBtn = screen.getByRole('button', { name: 'ลบจุดติดตั้ง' });
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(screen.queryByText('CAM-FRONT-01')).not.toBeInTheDocument();
    });
  });
});
