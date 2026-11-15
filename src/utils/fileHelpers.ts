import { ALLOWED_IMAGE_TYPES, ALLOWED_IMAGE_EXTENSIONS, MAX_IMAGE_FILE_SIZE_BYTES } from '../constants/equipmentConfig';

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * ตรวจสอบความถูกต้องของไฟล์รูปภาพ
 */
export function validateImageFile(file: File): FileValidationResult {
  const fileName = file.name.toLowerCase();
  const hasValidExt = ALLOWED_IMAGE_EXTENSIONS.some((ext) => fileName.endsWith(ext));
  const hasValidMime = ALLOWED_IMAGE_TYPES.includes(file.type) || file.type === '';

  if (!hasValidExt && !hasValidMime) {
    return {
      valid: false,
      error: `ประเภทไฟล์ไม่ถูกต้อง (รองรับเฉพาะ ${ALLOWED_IMAGE_EXTENSIONS.join(', ')})`,
    };
  }

  if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `ไฟล์มีขนาด ${sizeMB} MB ซึ่งเกินขีดจำกัดสูงสุด ${MAX_IMAGE_FILE_SIZE_BYTES / (1024 * 1024)} MB`,
    };
  }

  return { valid: true };
}

/**
 * อ่าน File เป็น Base64 Data URL
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('ไม่สามารถแปลงไฟล์เป็น Data URL ได้'));
      }
    };
    reader.onerror = () => {
      reject(reader.error || new Error('เกิดข้อผิดพลาดในการอ่านไฟล์'));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * ดึงความกว้างและความสูงจริงของรูปภาพ
 */
export function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth || 1000,
        height: img.naturalHeight || 800,
      });
    };
    img.onerror = () => {
      reject(new Error('ไม่สามารถประมวลผลขนาดของรูปภาพได้'));
    };
    img.src = dataUrl;
  });
}

/**
 * แปลงขนาดไบต์เป็นรูปแบบที่อ่านง่าย
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
