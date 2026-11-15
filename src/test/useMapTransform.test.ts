import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMapTransform } from '../hooks/useMapTransform';

describe('useMapTransform Hook', () => {
  it('initializes with default transform scale 1 and translation 0', () => {
    const { result } = renderHook(() => useMapTransform());
    expect(result.current.transform.scale).toBe(1);
    expect(result.current.transform.translateX).toBe(0);
    expect(result.current.transform.translateY).toBe(0);
  });

  it('zooms in and out respecting limits', () => {
    const { result } = renderHook(() => useMapTransform());

    act(() => {
      result.current.zoomIn();
    });
    expect(result.current.transform.scale).toBeGreaterThan(1);

    act(() => {
      result.current.zoomOut();
    });
    expect(result.current.transform.scale).toBe(1);
  });

  it('fitToScreen calculates appropriate scale and centers the image', () => {
    const { result } = renderHook(() => useMapTransform());

    // Container: 1000x800, Image: 2000x1600 (aspect ratio 1.25)
    act(() => {
      result.current.fitToScreen(1000, 800, 2000, 1600);
    });

    // Padding is 32px on each side -> available width = 1000 - 64 = 936
    // Available height = 800 - 64 = 736
    // scaleX = 936 / 2000 = 0.468, scaleY = 736 / 1600 = 0.46
    // bestScale = 0.46
    expect(result.current.transform.scale).toBeCloseTo(0.46, 2);
    // Should be centered with positive or calculated translation
    expect(result.current.transform.translateX).toBeGreaterThan(0);
    expect(result.current.transform.translateY).toBeGreaterThan(0);
  });

  it('pans smoothly when startPan and updatePan are called', () => {
    const { result } = renderHook(() => useMapTransform());

    act(() => {
      result.current.startPan(100, 100);
    });

    act(() => {
      result.current.updatePan(150, 120);
    });

    expect(result.current.transform.translateX).toBe(50);
    expect(result.current.transform.translateY).toBe(20);

    act(() => {
      result.current.endPan();
    });
  });
});
