import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EquipmentFormModal } from '../components/equipment/EquipmentFormModal';

describe('EquipmentFormModal Validation & Interactions', () => {
  it('validates required fields before submitting', async () => {
    const handleSave = vi.fn();
    const handleClose = vi.fn();

    render(
      <EquipmentFormModal
        isOpen={true}
        mapId="map-1"
        mapName="ชั้น 1"
        onClose={handleClose}
        onSave={handleSave}
      />
    );

    const nameInput = screen.getByPlaceholderText('เช่น กล้องวงจรปิด ประตูทางเข้า L1');
    const codeInput = screen.getByPlaceholderText('เช่น CCTV-01, FE-02');
    const zoneInput = screen.getByPlaceholderText('เช่น โถงต้อนรับ, หน้าห้องประชุมใหญ่');

    fireEvent.change(nameInput, { target: { value: '' } });
    fireEvent.change(codeInput, { target: { value: '' } });
    fireEvent.change(zoneInput, { target: { value: '' } });

    // Submit form
    const saveBtn = screen.getByRole('button', { name: /บันทึกจุดติดตั้ง/i });
    fireEvent.click(saveBtn);

    // Error messages should appear
    await waitFor(() => {
      expect(screen.getByText('กรุณาระบุชื่ออุปกรณ์')).toBeInTheDocument();
      expect(screen.getByText('กรุณาระบุรหัสอุปกรณ์')).toBeInTheDocument();
      expect(screen.getByText('กรุณาระบุตำแหน่งหรือโซน')).toBeInTheDocument();
    });

    expect(handleSave).not.toHaveBeenCalled();
  });

  it('submits successfully when required fields are filled', async () => {
    const handleSave = vi.fn();
    const handleClose = vi.fn();

    render(
      <EquipmentFormModal
        isOpen={true}
        mapId="map-1"
        mapName="ชั้น 1"
        defaultCoordinates={{ x: 0.42, y: 0.68 }}
        onClose={handleClose}
        onSave={handleSave}
      />
    );

    const nameInput = screen.getByPlaceholderText('เช่น กล้องวงจรปิด ประตูทางเข้า L1');
    const codeInput = screen.getByPlaceholderText('เช่น CCTV-01, FE-02');
    const zoneInput = screen.getByPlaceholderText('เช่น โถงต้อนรับ, หน้าห้องประชุมใหญ่');

    // Select Fire Extinguisher type FIRST
    const feTypeBtn = screen.getByRole('button', { name: /ถังดับเพลิง/i });
    fireEvent.click(feTypeBtn);

    // Fill valid info
    fireEvent.change(nameInput, { target: { value: 'ถังดับเพลิง บันไดหนีไฟ 1' } });
    fireEvent.change(codeInput, { target: { value: 'FE-STAIR-01' } });
    fireEvent.change(zoneInput, { target: { value: 'บันไดหนีไฟ ชั้น 1' } });

    // Select Maintenance status
    const maintenanceBtn = screen.getByRole('button', { name: 'ต้องตรวจสอบ' });
    fireEvent.click(maintenanceBtn);

    // Save
    const saveBtn = screen.getByRole('button', { name: /บันทึกจุดติดตั้ง/i });
    fireEvent.click(saveBtn);

    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'ถังดับเพลิง บันไดหนีไฟ 1',
        type: 'fire_extinguisher',
        code: 'FE-STAIR-01',
        zone: 'บันไดหนีไฟ ชั้น 1',
        status: 'maintenance',
        mapId: 'map-1',
        x: 0.42,
        y: 0.68,
      })
    );
  });
});
