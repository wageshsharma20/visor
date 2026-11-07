import { describe, it, expect } from 'vitest';
import { computeBezierWire } from '../wireMath';

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

  it('enforces minimum delta control point distance for very close nodes', () => {
    const start = { x: 100, y: 100 };
    const end = { x: 110, y: 100 };
    const result = computeBezierWire(start, end, 'horizontal', 0.5);

    // Delta is max(20, 10 * 0.5) = 20
    expect(result.cp1.x).toBe(120);
    expect(result.cp2.x).toBe(90);
  });
});
