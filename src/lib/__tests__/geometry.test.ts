import { describe, it, expect } from 'vitest';
import {
  contentRect,
  toScreen,
  resolveLabelPositions,
  lerpBox,
  Rect,
} from '../geometry';
import { BBox } from '@/types/detection';

describe('Geometry Math', () => {
  describe('contentRect (object-fit: contain letterbox/pillarbox)', () => {
    it('letterboxes when container is wider than 16:9 source', () => {
      // 16:9 source (1920x1080) in wider 1920x800 container
      // Scale is limited by height: 800 / 1080 = 0.7407...
      // Width = 1920 * (800 / 1080) = 1422
      const rect = contentRect(1920, 800, 1920, 1080);
      expect(rect.height).toBe(800);
      expect(rect.width).toBe(1422);
      expect(rect.x).toBe(Math.round((1920 - 1422) / 2));
      expect(rect.y).toBe(0);
    });

    it('pillarboxes when container is taller than 16:9 source', () => {
      // 16:9 source (1920x1080) in taller 800x1200 container
      // Scale is limited by width: 800 / 1920 = 0.4166...
      // Height = 1080 * (800 / 1920) = 450
      const rect = contentRect(800, 1200, 1920, 1080);
      expect(rect.width).toBe(800);
      expect(rect.height).toBe(450);
      expect(rect.x).toBe(0);
      expect(rect.y).toBe(Math.round((1200 - 450) / 2));
    });

    it('handles zero or negative dimensions cleanly', () => {
      expect(contentRect(0, 100, 1920, 1080)).toEqual({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      });
      expect(contentRect(100, 0, 1920, 1080)).toEqual({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      });
    });
  });

  describe('toScreen', () => {
    const rect: Rect = { x: 100, y: 50, width: 1000, height: 500 };
    const bbox: BBox = { x: 0.1, y: 0.2, w: 0.3, h: 0.4 };

    it('maps normalized coordinates to screen pixels', () => {
      const screen = toScreen(bbox, rect, false);
      expect(screen.x).toBe(100 + 0.1 * 1000); // 200
      expect(screen.y).toBe(50 + 0.2 * 500); // 150
      expect(screen.width).toBe(0.3 * 1000); // 300
      expect(screen.height).toBe(0.4 * 500); // 200
    });

    it('mirrors x coordinates horizontally when mirrored=true', () => {
      // Mirrored normX = 1 - x - w = 1 - 0.1 - 0.3 = 0.6
      const screen = toScreen(bbox, rect, true);
      expect(screen.x).toBe(100 + 0.6 * 1000); // 700
      expect(screen.y).toBe(50 + 0.2 * 500); // 150
      expect(screen.width).toBe(300);
      expect(screen.height).toBe(200);
    });
  });

  describe('resolveLabelPositions', () => {
    const rect: Rect = { x: 0, y: 0, width: 1000, height: 600 };

    it('attaches label above the top-left corner by default', () => {
      const boxes = [
        {
          id: 'T001',
          bbox: { x: 0.2, y: 0.4, w: 0.1, h: 0.2 },
        },
      ];

      const positions = resolveLabelPositions(boxes, rect, 20);
      const pos = positions.get('T001');
      expect(pos).toBeDefined();
      expect(pos?.x).toBe(200); // 0.2 * 1000
      expect(pos?.y).toBe(0.4 * 600 - 20 - 2); // 240 - 22 = 218
      expect(pos?.flippedInside).toBe(false);
    });

    it('flips label inside the box when close to top edge (< 24px)', () => {
      const boxes = [
        {
          id: 'T001',
          bbox: { x: 0.2, y: 0.02, w: 0.1, h: 0.2 }, // 0.02 * 600 = 12px from top edge
        },
      ];

      const positions = resolveLabelPositions(boxes, rect, 20);
      const pos = positions.get('T001');
      expect(pos?.flippedInside).toBe(true);
      expect(pos?.y).toBeGreaterThan(12); // inside the box top
    });

    it('offsets overlapping labels so they do not collide', () => {
      const boxes = [
        {
          id: 'T001',
          bbox: { x: 0.2, y: 0.3, w: 0.1, h: 0.2 },
        },
        {
          id: 'T002',
          bbox: { x: 0.205, y: 0.305, w: 0.1, h: 0.2 },
        },
      ];

      const positions = resolveLabelPositions(boxes, rect, 20);
      const pos1 = positions.get('T001');
      const pos2 = positions.get('T002');
      expect(pos1).toBeDefined();
      expect(pos2).toBeDefined();
      // Ensure vertical separation of labels
      expect(Math.abs((pos1?.y ?? 0) - (pos2?.y ?? 0))).toBeGreaterThanOrEqual(20);
    });
  });

  describe('lerpBox', () => {
    const a: BBox = { x: 0.1, y: 0.2, w: 0.3, h: 0.4 };
    const b: BBox = { x: 0.3, y: 0.4, w: 0.5, h: 0.6 };

    it('interpolates linearly at t = 0, 0.5, 1', () => {
      expect(lerpBox(a, b, 0)).toEqual(a);
      expect(lerpBox(a, b, 1)).toEqual(b);
      expect(lerpBox(a, b, 0.5)).toEqual({
        x: 0.2,
        y: 0.3,
        w: 0.4,
        h: 0.5,
      });
    });

    it('clamps t to [0, 1]', () => {
      expect(lerpBox(a, b, -0.5)).toEqual(a);
      expect(lerpBox(a, b, 1.5)).toEqual(b);
    });
  });
});
