import { useState, useCallback, useRef } from 'react';
import type { MapTransform } from '../types';
import { clamp, getTouchCenter, getTouchDistance } from '../utils/coordinates';

const MIN_SCALE = 0.15;
const MAX_SCALE = 8.0;
const ZOOM_STEP = 1.25;

export function useMapTransform() {
  const [transform, setTransform] = useState<MapTransform>({
    scale: 1,
    translateX: 0,
    translateY: 0,
  });

  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const touchStateRef = useRef<{
    initialDistance: number;
    initialScale: number;
    initialCenter: { x: number; y: number };
    initialTransform: MapTransform;
  } | null>(null);

  /**
   * ซูมเข้า
   */
  const zoomIn = useCallback(() => {
    setTransform((prev) => {
      const nextScale = clamp(prev.scale * ZOOM_STEP, MIN_SCALE, MAX_SCALE);
      return { ...prev, scale: nextScale };
    });
  }, []);

  /**
   * ซูมออก
   */
  const zoomOut = useCallback(() => {
    setTransform((prev) => {
      const nextScale = clamp(prev.scale / ZOOM_STEP, MIN_SCALE, MAX_SCALE);
      return { ...prev, scale: nextScale };
    });
  }, []);

  /**
   * ซูม ณ ตำแหน่งเคอร์เซอร์ (สำหรับ Mouse Wheel)
   */
  const zoomAtPoint = useCallback(
    (deltaY: number, clientX: number, clientY: number, containerRect: DOMRect) => {
      setTransform((prev) => {
        const factor = deltaY < 0 ? 1.15 : 1 / 1.15;
        const newScale = clamp(prev.scale * factor, MIN_SCALE, MAX_SCALE);

        // คำนวณพิกัดสัมพัทธ์ในกรอบคอนเทนเนอร์
        const cursorX = clientX - containerRect.left;
        const cursorY = clientY - containerRect.top;

        const ratio = newScale / prev.scale;
        const newTranslateX = cursorX - ratio * (cursorX - prev.translateX);
        const newTranslateY = cursorY - ratio * (cursorY - prev.translateY);

        return {
          scale: newScale,
          translateX: Math.round(newTranslateX * 100) / 100,
          translateY: Math.round(newTranslateY * 100) / 100,
        };
      });
    },
    []
  );

  /**
   * ปรับขนาดและจัดกึ่งกลางให้พอดีหน้าจอ (Fit to Screen)
   */
  const fitToScreen = useCallback(
    (
      containerWidth: number,
      containerHeight: number,
      imageWidth: number,
      imageHeight: number
    ) => {
      if (
        containerWidth <= 0 ||
        containerHeight <= 0 ||
        imageWidth <= 0 ||
        imageHeight <= 0
      ) {
        return;
      }

      // เว้นระยะขอบ (padding) 32px
      const padding = 32;
      const availableWidth = Math.max(100, containerWidth - padding * 2);
      const availableHeight = Math.max(100, containerHeight - padding * 2);

      const scaleX = availableWidth / imageWidth;
      const scaleY = availableHeight / imageHeight;
      const bestScale = clamp(Math.min(scaleX, scaleY), MIN_SCALE, 3.0);

      // จัดให้อยู่กึ่งกลาง
      const scaledWidth = imageWidth * bestScale;
      const scaledHeight = imageHeight * bestScale;

      const translateX = (containerWidth - scaledWidth) / 2;
      const translateY = (containerHeight - scaledHeight) / 2;

      setTransform({
        scale: Math.round(bestScale * 1000) / 1000,
        translateX: Math.round(translateX * 10) / 10,
        translateY: Math.round(translateY * 10) / 10,
      });
    },
    []
  );

  /**
   * รีเซ็ตมุมมองเป็น 100% และกึ่งกลาง
   */
  const resetView = useCallback(
    (containerWidth: number, containerHeight: number, imageWidth: number, imageHeight: number) => {
      const translateX = (containerWidth - imageWidth) / 2;
      const translateY = (containerHeight - imageHeight) / 2;
      setTransform({
        scale: 1,
        translateX: Math.round(translateX),
        translateY: Math.round(translateY),
      });
    },
    []
  );

  /**
   * เริ่มต้นการแพน (Pan Start)
   */
  const startPan = useCallback((clientX: number, clientY: number) => {
    isPanningRef.current = true;
    panStartRef.current = { x: clientX, y: clientY };
  }, []);

  /**
   * ระหว่างการแพน (Pan Move)
   */
  const updatePan = useCallback((clientX: number, clientY: number) => {
    if (!isPanningRef.current) return;
    const dx = clientX - panStartRef.current.x;
    const dy = clientY - panStartRef.current.y;
    panStartRef.current = { x: clientX, y: clientY };

    setTransform((prev) => ({
      ...prev,
      translateX: prev.translateX + dx,
      translateY: prev.translateY + dy,
    }));
  }, []);

  /**
   * จบการแพน (Pan End)
   */
  const endPan = useCallback(() => {
    isPanningRef.current = false;
  }, []);

  /**
   * จัดการ Multi-touch (Touch gestures: Pinch zoom & Pan)
   */
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        touchStateRef.current = {
          initialDistance: getTouchDistance(
            { clientX: t1.clientX, clientY: t1.clientY },
            { clientX: t2.clientX, clientY: t2.clientY }
          ),
          initialScale: transform.scale,
          initialCenter: getTouchCenter(
            { clientX: t1.clientX, clientY: t1.clientY },
            { clientX: t2.clientX, clientY: t2.clientY }
          ),
          initialTransform: { ...transform },
        };
      } else if (e.touches.length === 1) {
        startPan(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    [transform, startPan]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent, containerRect: DOMRect) => {
      if (e.touches.length === 2 && touchStateRef.current) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const currentDistance = getTouchDistance(
          { clientX: t1.clientX, clientY: t1.clientY },
          { clientX: t2.clientX, clientY: t2.clientY }
        );
        const currentCenter = getTouchCenter(
          { clientX: t1.clientX, clientY: t1.clientY },
          { clientX: t2.clientX, clientY: t2.clientY }
        );

        const { initialDistance, initialScale, initialCenter, initialTransform } =
          touchStateRef.current;

        if (initialDistance > 0) {
          const pinchRatio = currentDistance / initialDistance;
          const newScale = clamp(initialScale * pinchRatio, MIN_SCALE, MAX_SCALE);

          // คำนวณการเลื่อนและซูมตามจุดศูนย์กลางระหว่างสองนิ้ว
          const centerRelX = currentCenter.x - containerRect.left;
          const centerRelY = currentCenter.y - containerRect.top;

          const dx = currentCenter.x - initialCenter.x;
          const dy = currentCenter.y - initialCenter.y;

          const ratio = newScale / initialTransform.scale;
          const newTx = centerRelX - ratio * (centerRelX - initialTransform.translateX) + dx;
          const newTy = centerRelY - ratio * (centerRelY - initialTransform.translateY) + dy;

          setTransform({
            scale: Math.round(newScale * 1000) / 1000,
            translateX: Math.round(newTx * 10) / 10,
            translateY: Math.round(newTy * 10) / 10,
          });
        }
      } else if (e.touches.length === 1 && isPanningRef.current) {
        updatePan(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    [updatePan]
  );

  const handleTouchEnd = useCallback(() => {
    touchStateRef.current = null;
    endPan();
  }, [endPan]);

  return {
    transform,
    setTransform,
    zoomIn,
    zoomOut,
    zoomAtPoint,
    fitToScreen,
    resetView,
    startPan,
    updatePan,
    endPan,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    isPanning: isPanningRef.current,
  };
}
