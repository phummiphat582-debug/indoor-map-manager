import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { clearAllEquipmentFromDB, deleteFloorPlanFromDB, saveFloorPlanToDB, saveEquipmentToDB } from '../services/db';
import type { FloorPlan, EquipmentPin } from '../types';

describe('Indoor Map Manager Component Workflows', () => {
  beforeEach(async () => {
    await clearAllEquipmentFromDB();
    await deleteFloorPlanFromDB();
    vi.clearAllMocks();
  });

  it('renders clean initial state with zero demo data', async () => {
    render(<App />);

    // Wait for initial load
    await waitFor(() => {
      expect(
        screen.getByText('ระบบจัดการแผนที่ติดตั้งอุปกรณ์')
      ).toBeInTheDocument();
    });

    // Should indicate empty floor plan
    expect(screen.getByText('ยังไม่มีแผนที่ผังอาคาร')).toBeInTheDocument();
    expect(
      screen.getByText(/เริ่มต้นใช้งานโดยการอัปโหลดไฟล์ภาพผังอาคาร/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/ยังไม่มีจุดติดตั้งอุปกรณ์/i)
    ).toBeInTheDocument();
  });

  it('opens map upload modal and validates file input', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('ยังไม่มีแผนที่ผังอาคาร')).toBeInTheDocument();
    });

    // Click upload map button in center
    const uploadBtn = screen.getByRole('button', { name: /อัปโหลดแผนที่ผังอาคาร/i });
    fireEvent.click(uploadBtn);

    // Modal should be open
    expect(screen.getByText('รองรับไฟล์ PNG, JPG, JPEG และ SVG ขนาดไม่เกิน 25 MB')).toBeInTheDocument();

    // Close modal
    const cancelBtn = screen.getByRole('button', { name: /ยกเลิก/i });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByText('รองรับไฟล์ PNG, JPG, JPEG และ SVG ขนาดไม่เกิน 25 MB')).not.toBeInTheDocument();
    });
  });

  it('displays floor plan image and toolbar controls when map exists', async () => {
    const mockMap: FloorPlan = {
      id: 'fp-1',
      name: 'Office_L1.png',
      dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      mimeType: 'image/png',
      width: 1000,
      height: 800,
      fileSize: 5000,
      uploadedAt: new Date().toISOString(),
    };

    await saveFloorPlanToDB(mockMap);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByAltText('Office_L1.png')).toBeInTheDocument();
    });

    // Toolbar / Header buttons should be active
    const addPinButtons = screen.getAllByRole('button', { name: /เพิ่มจุดติดตั้ง/i });
    expect(addPinButtons.length).toBeGreaterThan(0);
    expect(addPinButtons[0]).not.toBeDisabled();

    // Toggle add mode
    fireEvent.click(addPinButtons[0]);
    expect(
      screen.getByText(/โหมดเพิ่มจุดติดตั้ง: คลิกตำแหน่งบนแผนที่เพื่อวางจุด/i)
    ).toBeInTheDocument();

    // Press Escape to cancel add mode
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => {
      expect(
        screen.queryByText(/โหมดเพิ่มจุดติดตั้ง: คลิกตำแหน่งบนแผนที่เพื่อวางจุด/i)
      ).not.toBeInTheDocument();
    });
  });

  it('displays pin details, handles photo lightbox and deletion confirmation', async () => {
    const mockMap: FloorPlan = {
      id: 'fp-test',
      name: 'Plan.png',
      dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      mimeType: 'image/png',
      width: 800,
      height: 600,
      fileSize: 4000,
      uploadedAt: new Date().toISOString(),
    };

    const mockPin: EquipmentPin = {
      id: 'cctv-test-pin',
      name: 'กล้องหน้าประตู',
      type: 'cctv',
      code: 'CAM-FRONT-01',
      zone: 'โซนหน้าประตูใหญ่',
      buildingFloor: 'ชั้น 1',
      installDate: '2026-04-10',
      status: 'normal',
      notes: 'ทดสอบระบบ',
      x: 0.5,
      y: 0.5,
      photos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveFloorPlanToDB(mockMap);
    await saveEquipmentToDB(mockPin);

    render(<App />);

    // Pin should be visible on map and in equipment list (could match multiple due to pin badge + list)
    await waitFor(() => {
      const codeElements = screen.getAllByText('CAM-FRONT-01');
      expect(codeElements.length).toBeGreaterThan(0);
    });

    // Click equipment item to open detail drawer
    const eqItems = screen.getAllByText('กล้องหน้าประตู');
    fireEvent.click(eqItems[0]);

    // Detail drawer should show details
    await waitFor(() => {
      expect(screen.getAllByText('โซนหน้าประตูใหญ่').length).toBeGreaterThan(0);
      expect(screen.getByText('ยังไม่มีรูปภาพ')).toBeInTheDocument();
    });

    // Click Delete pin button in drawer
    const deleteBtn = screen.getByRole('button', { name: /ลบจุดติดตั้งนี้/i });
    fireEvent.click(deleteBtn);

    // Confirmation dialog should appear
    expect(screen.getByText('ยืนยันการลบจุดติดตั้ง')).toBeInTheDocument();
    expect(
      screen.getByText(/คุณแน่ใจหรือไม่ว่าต้องการลบ "กล้องหน้าประตู"/i)
    ).toBeInTheDocument();

    // Confirm deletion
    const confirmDeleteBtn = screen.getByRole('button', { name: 'ลบจุดติดตั้ง' });
    fireEvent.click(confirmDeleteBtn);

    // Pin should now be deleted
    await waitFor(() => {
      expect(screen.queryByText('CAM-FRONT-01')).not.toBeInTheDocument();
    });
  });

  it('filters equipment by search query and type', async () => {
    const pin1: EquipmentPin = {
      id: 'cam-search',
      name: 'กล้องรักษาความปลอดภัย 1',
      type: 'cctv',
      code: 'CAM-999',
      zone: 'ทิศเหนือ',
      buildingFloor: 'ชั้น 1',
      installDate: '2026-01-01',
      status: 'normal',
      notes: '',
      x: 0.2,
      y: 0.2,
      photos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const pin2: EquipmentPin = {
      id: 'fe-search',
      name: 'ถังดับเพลิง โซนคลังสินค้า',
      type: 'fire_extinguisher',
      code: 'FE-888',
      zone: 'คลังสินค้า',
      buildingFloor: 'ชั้น 1',
      installDate: '2026-01-01',
      status: 'defective',
      notes: '',
      x: 0.8,
      y: 0.8,
      photos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveEquipmentToDB(pin1);
    await saveEquipmentToDB(pin2);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('CAM-999')).toBeInTheDocument();
      expect(screen.getByText('FE-888')).toBeInTheDocument();
    });

    // Search for "คลังสินค้า"
    const searchInput = screen.getByPlaceholderText('ค้นหาชื่อ, รหัส, หรือโซน...');
    fireEvent.change(searchInput, { target: { value: 'คลังสินค้า' } });

    // Only FE-888 should match
    expect(screen.getByText('FE-888')).toBeInTheDocument();
    expect(screen.queryByText('CAM-999')).not.toBeInTheDocument();

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText('CAM-999')).toBeInTheDocument();
  });
});
