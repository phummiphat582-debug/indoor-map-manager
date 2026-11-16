import { describe, it, expect } from 'vitest';
import { validateImageFile, formatFileSize, compressAndReadImage } from '../utils/fileHelpers';

describe('File Helper & Validation Utilities', () => {
  it('validates allowed image formats (PNG, JPG, JPEG, SVG)', () => {
    const pngFile = new File(['dummy'], 'map.png', { type: 'image/png' });
    const jpgFile = new File(['dummy'], 'floor.jpg', { type: 'image/jpeg' });
    const svgFile = new File(['<svg></svg>'], 'blueprint.svg', { type: 'image/svg+xml' });

    expect(validateImageFile(pngFile).valid).toBe(true);
    expect(validateImageFile(jpgFile).valid).toBe(true);
    expect(validateImageFile(svgFile).valid).toBe(true);
  });

  it('rejects disallowed file extensions or types', () => {
    const exeFile = new File(['binary'], 'virus.exe', { type: 'application/x-msdownload' });
    const pdfFile = new File(['pdf data'], 'manual.pdf', { type: 'application/pdf' });

    const exeResult = validateImageFile(exeFile);
    expect(exeResult.valid).toBe(false);
    expect(exeResult.error).toContain('ประเภทไฟล์ไม่ถูกต้อง');

    const pdfResult = validateImageFile(pdfFile);
    expect(pdfResult.valid).toBe(false);
  });

  it('rejects files exceeding 25MB limit', () => {
    // 26 MB file
    const bigFile = new File([new ArrayBuffer(26 * 1024 * 1024)], 'giant_map.png', {
      type: 'image/png',
    });
    const result = validateImageFile(bigFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('เกินขีดจำกัดสูงสุด');
  });

  it('formats file sizes accurately', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(1024 * 1024 * 2.5)).toBe('2.5 MB');
  });

  it('handles compressAndReadImage safely for SVG and image formats', async () => {
    const svgFile = new File(['<svg width="800" height="600"></svg>'], 'plan.svg', {
      type: 'image/svg+xml',
    });
    const result = await compressAndReadImage(svgFile);

    expect(result.dataUrl).toBeDefined();
    expect(result.dataUrl).toContain('data:');
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
  });
});
