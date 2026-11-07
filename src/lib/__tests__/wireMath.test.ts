import { describe, it, expect } from 'vitest';
import { computeBezierWire, computePortCenter, computeDistance } from '../wireMath';

describe('Wire Math Tests', () => {
  it('computes horizontal cubic bezier path with smooth curvature', () => {
    const start = { x: 100, y: 150 };
    const end = { x: 300, y: 250 };
    const result = computeBezierWire(start, end, 'horizontal', 0.5);

    expect(result.start).toEqual(start);
    expect(result.end).toEqual(end);
    expect(result.cp1.x).toBe(200); // 100 + (300-100)*0.5
    expect(result.cp1.y).toBe(150);
    expect(result.cp2.x).toBe(200); // 300 - (300-100)*0.5
    expect(result.cp2.y).toBe(250);
    expect(result.path).toBe('M 100 150 C 200 150, 200 250, 300 250');
  });

  it('computes vertical cubic bezier path when orientation is vertical', () => {
    const start = { x: 150, y: 50 };
    const end = { x: 150, y: 200 };
    const result = computeBezierWire(start, end, 'vertical', 0.5);

    expect(result.cp1.x).toBe(150);
    expect(result.cp1.y).toBe(125); // 50 + (200-50)*0.5
    expect(result.cp2.x).toBe(150);
    expect(result.cp2.y).toBe(125);
    expect(result.path).toBe('M 150 50 C 150 125, 150 125, 150 200');
  });

  it('infers orientation automatically based on coordinate deltas', () => {
    // Delta X (200) > Delta Y (50) -> horizontal
    const hResult = computeBezierWire({ x: 0, y: 0 }, { x: 200, y: 50 }, 'auto');
    expect(hResult.cp1.y).toBe(0);

    // Delta Y (200) > Delta X (50) -> vertical
    const vResult = computeBezierWire({ x: 0, y: 0 }, { x: 50, y: 200 }, 'auto');
    expect(vResult.cp1.x).toBe(0);
  });

  it('enforces minimum delta control point distance for very close nodes', () => {
    const start = { x: 100, y: 100 };
    const end = { x: 110, y: 100 };
    const result = computeBezierWire(start, end, 'horizontal', 0.5);

    // Delta is max(20, 10 * 0.5) = 20
    expect(result.cp1.x).toBe(120);
    expect(result.cp2.x).toBe(90);
  });

  it('computes Euclidean distance accurately', () => {
    expect(computeDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    expect(computeDistance({ x: 10, y: 20 }, { x: 10, y: 20 })).toBe(0);
  });

  describe('computePortCenter anchor math', () => {
    it('computes port center relative to container without borders or scroll', () => {
      const portEl = {
        getBoundingClientRect: () => ({
          left: 150,
          top: 200,
          width: 6,
          height: 6,
          right: 156,
          bottom: 206,
        }),
      } as HTMLElement;

      const containerEl = {
        getBoundingClientRect: () => ({
          left: 50,
          top: 50,
          width: 600,
          height: 400,
          right: 650,
          bottom: 450,
        }),
        clientLeft: 0,
        clientTop: 0,
        scrollLeft: 0,
        scrollTop: 0,
      } as HTMLElement;

      const center = computePortCenter(portEl, containerEl);
      // x: 150 + 3 - 50 = 103
      // y: 200 + 3 - 50 = 153
      expect(center).toEqual({ x: 103, y: 153 });
    });

    it('accounts for container border offsets (clientLeft and clientTop)', () => {
      const portEl = {
        getBoundingClientRect: () => ({
          left: 150,
          top: 200,
          width: 6,
          height: 6,
          right: 156,
          bottom: 206,
        }),
      } as HTMLElement;

      const containerEl = {
        getBoundingClientRect: () => ({
          left: 50,
          top: 50,
          width: 600,
          height: 400,
          right: 650,
          bottom: 450,
        }),
        clientLeft: 2, // 2px left border
        clientTop: 2,  // 2px top border
        scrollLeft: 0,
        scrollTop: 0,
      } as HTMLElement;

      const center = computePortCenter(portEl, containerEl);
      // x: 150 + 3 - (50 + 2) = 101
      // y: 200 + 3 - (50 + 2) = 151
      expect(center).toEqual({ x: 101, y: 151 });
    });

    it('accounts for container scroll offsets (scrollLeft and scrollTop)', () => {
      const portEl = {
        getBoundingClientRect: () => ({
          left: 150,
          top: 200,
          width: 6,
          height: 6,
          right: 156,
          bottom: 206,
        }),
      } as HTMLElement;

      const containerEl = {
        getBoundingClientRect: () => ({
          left: 50,
          top: 50,
          width: 600,
          height: 400,
          right: 650,
          bottom: 450,
        }),
        clientLeft: 1,
        clientTop: 1,
        scrollLeft: 25,
        scrollTop: 40,
      } as HTMLElement;

      const center = computePortCenter(portEl, containerEl);
      // x: 150 + 3 - (50 + 1) + 25 = 127
      // y: 200 + 3 - (50 + 1) + 40 = 192
      expect(center).toEqual({ x: 127, y: 192 });
    });
  });
});
