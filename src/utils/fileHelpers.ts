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
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve({ width: 1200, height: 800 });
    }, 200);

    const img = new Image();
    img.onload = () => {
      clearTimeout(timer);
      resolve({
        width: img.naturalWidth || 1000,
        height: img.naturalHeight || 800,
      });
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve({ width: 1200, height: 800 });
    };
    img.src = dataUrl;
  });
}

/**
 * บีบอัดและปรับขนาดภาพผังอาคารให้มีความคมชัดสูงแต่ขนาดข้อมูลกะทัดรัด
 * เพื่อให้สามารถซิงก์เรียลไทม์ผ่านเครือข่ายและ WebSocket ได้อย่างรวดเร็วไม่ติดเพดานขนาด
 */
export async function compressAndReadImage(
  file: File,
  maxDimension = 2048,
  quality = 0.85
): Promise<{ dataUrl: string; width: number; height: number; fileSize: number }> {
  const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
  if (isSvg) {
    const dataUrl = await readFileAsDataURL(file);
    try {
      const dims = await getImageDimensions(dataUrl);
      return { dataUrl, width: dims.width, height: dims.height, fileSize: file.size };
    } catch {
      return { dataUrl, width: 1200, height: 800, fileSize: file.size };
    }
  }

  // สำหรับไฟล์ Raster (PNG, JPG, JPEG, WebP)
  const rawDataUrl = await readFileAsDataURL(file);

  return new Promise((resolve) => {
    const safetyTimer = setTimeout(() => {
      resolve({ dataUrl: rawDataUrl, width: 1200, height: 800, fileSize: file.size });
    }, 200);

    try {
      const img = new Image();
      img.onload = () => {
        clearTimeout(safetyTimer);
        let width = img.naturalWidth || 1000;
        let height = img.naturalHeight || 800;

        // คำนวณอัตราส่วนการย่อขนาดหากภาพใหญ่กว่า maxDimension
        if (Math.max(width, height) > maxDimension) {
          const ratio = maxDimension / Math.max(width, height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve({ dataUrl: rawDataUrl, width, height, fileSize: file.size });
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // วาดภาพลง Canvas
        ctx.drawImage(img, 0, 0, width, height);

        // เลือกรองรับ WebP หรือ JPEG เพื่อให้ขนาดไฟล์เล็กที่สุด
        let resultUrl = '';
        try {
          resultUrl = canvas.toDataURL('image/webp', quality);
          if (!resultUrl.startsWith('data:image/webp')) {
            resultUrl = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', quality);
          }
        } catch {
          resultUrl = rawDataUrl;
        }

        const estBytes = Math.round((resultUrl.length * 3) / 4);
        resolve({
          dataUrl: resultUrl,
          width,
          height,
          fileSize: estBytes,
        });
      };

      img.onerror = () => {
        clearTimeout(safetyTimer);
        resolve({ dataUrl: rawDataUrl, width: 1000, height: 800, fileSize: file.size });
      };

      img.src = rawDataUrl;
    } catch {
      clearTimeout(safetyTimer);
      resolve({ dataUrl: rawDataUrl, width: 1000, height: 800, fileSize: file.size });
    }
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
