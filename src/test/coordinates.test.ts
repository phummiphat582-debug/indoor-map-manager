import { describe, it, expect } from 'vitest';
import { clamp, calculateNormalizedCoords, getTouchDistance, getTouchCenter } from '../utils/coordinates';

describe('Coordinates & Math Utilities', () => {
  it('clamp should constrain numbers between 0 and 1 by default', () => {
    expect(clamp(-0.5)).toBe(0);
    expect(clamp(0.5)).toBe(0.5);
    expect(clamp(1.5)).toBe(1);
    expect(clamp(0)).toBe(0);
    expect(clamp(1)).toBe(1);
    expect(clamp(NaN)).toBe(0);
  });

  it('calculateNormalizedCoords should convert screen pixels to [0, 1] relative coordinates', () => {
    const mockRect = {
      left: 100,
      top: 50,
      right: 900,
      bottom: 650,
      width: 800,
      height: 600,
      x: 100,
      y: 50,
      toJSON: () => {},
    } as DOMRect;

    // Top-left click
    const topLeft = calculateNormalizedCoords(100, 50, mockRect);
    expect(topLeft.x).toBe(0);
    expect(topLeft.y).toBe(0);

    // Center click
    const center = calculateNormalizedCoords(500, 350, mockRect);
    expect(center.x).toBe(0.5);
    expect(center.y).toBe(0.5);

    // Bottom-right click
    const bottomRight = calculateNormalizedCoords(900, 650, mockRect);
    expect(bottomRight.x).toBe(1);
    expect(bottomRight.y).toBe(1);

    // Out of bounds click (left and top) clamped to 0
    const outLeft = calculateNormalizedCoords(20, 10, mockRect);
    expect(outLeft.x).toBe(0);
    expect(outLeft.y).toBe(0);

    // Out of bounds click (right and bottom) clamped to 1
    const outRight = calculateNormalizedCoords(1200, 900, mockRect);
    expect(outRight.x).toBe(1);
    expect(outRight.y).toBe(1);
  });

  it('getTouchDistance and getTouchCenter calculate 2-finger gesture values accurately', () => {
    const touch1 = { clientX: 100, clientY: 100 };
    const touch2 = { clientX: 100, clientY: 200 };

    expect(getTouchDistance(touch1, touch2)).toBe(100);

    const center = getTouchCenter(touch1, touch2);
    expect(center.x).toBe(100);
    expect(center.y).toBe(150);
  });
});
