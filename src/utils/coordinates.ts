/**
 * จำกัดค่าให้อยู่ในช่วง [min, max]
 */
export function clamp(val: number, min = 0, max = 1): number {
  if (Number.isNaN(val)) return min;
  return Math.max(min, Math.min(max, val));
}

/**
 * คำนวณพิกัด Normalized (0.0 ถึง 1.0) จากตำแหน่งคลิก/สัมผัส สัมพัทธ์กับกรอบแผนที่
 */
export function calculateNormalizedCoords(
  clientX: number,
  clientY: number,
  mapRect: DOMRect
): { x: number; y: number } {
  if (mapRect.width <= 0 || mapRect.height <= 0) {
    return { x: 0.5, y: 0.5 };
  }

  const relativeX = clientX - mapRect.left;
  const relativeY = clientY - mapRect.top;

  const normalizedX = clamp(relativeX / mapRect.width, 0, 1);
  const normalizedY = clamp(relativeY / mapRect.height, 0, 1);

  // ปัดเศษทศนิยม 6 ตำแหน่งเพื่อความแม่นยำสูงและขนาดไฟล์ที่กะทัดรัด
  return {
    x: Math.round(normalizedX * 1000000) / 1000000,
    y: Math.round(normalizedY * 1000000) / 1000000,
  };
}

export interface Point2D {
  clientX: number;
  clientY: number;
}

/**
 * คำนวณระยะห่างระหว่างจุด 2 จุด (ใช้สำหรับ Touch Pinch-to-zoom)
 */
export function getTouchDistance(touch1: Point2D, touch2: Point2D): number {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * คำนวณจุดกึ่งกลางระหว่าง 2 Touch points
 */
export function getTouchCenter(touch1: Point2D, touch2: Point2D): { x: number; y: number } {
  return {
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2,
  };
}
