import { describe, it, expect, beforeEach } from 'vitest';
import { validateDetectionFrame, WebSocketSource } from '../websocketSource';

describe('WebSocketSource', () => {
  describe('validateDetectionFrame', () => {
    it('accepts a valid DetectionFrame shape', () => {
      const valid = {
        frameId: 101,
        ts: Date.now(),
        source: { width: 1920, height: 1080 },
        detections: [
          {
            trackId: 'T004',
            classId: 'person',
            confidence: 0.9841,
            bbox: { x: 0.21, y: 0.17, w: 0.08, h: 0.37 },
          },
        ],
      };

      expect(validateDetectionFrame(valid)).toBe(true);
    });

    it('rejects null, non-objects, and missing basic fields', () => {
      expect(validateDetectionFrame(null)).toBe(false);
      expect(validateDetectionFrame('string')).toBe(false);
      expect(validateDetectionFrame(123)).toBe(false);
      expect(validateDetectionFrame({})).toBe(false);
      expect(validateDetectionFrame({ frameId: 1 })).toBe(false);
      expect(validateDetectionFrame({ frameId: 1, ts: 1000 })).toBe(false);
    });

    it('rejects frame with invalid or missing source dimensions', () => {
      expect(
        validateDetectionFrame({
          frameId: 1,
          ts: 1000,
          source: { width: '1920' }, // string instead of number
          detections: [],
        })
      ).toBe(false);
    });

    it('rejects frame with malformed detection bboxes', () => {
      expect(
        validateDetectionFrame({
          frameId: 1,
          ts: 1000,
          source: { width: 1920, height: 1080 },
          detections: [
            {
              trackId: 'T001',
              classId: 'person',
              confidence: 0.9,
              bbox: { x: 0.1, y: 0.2, w: 'not-a-number', h: 0.4 },
            },
          ],
        })
      ).toBe(false);
    });
  });

  describe('WebSocketSource instance', () => {
    let source: WebSocketSource;

    beforeEach(() => {
      source = new WebSocketSource('wss://test.local:8765');
    });

    it('tracks URL and initializes with idle status and zero malformed frames', () => {
      expect(source.getUrl()).toBe('wss://test.local:8765');
      expect(source.getMalformedFrameCount()).toBe(0);
      expect(source.kind).toBe('remote');
    });

    it('allows resetting malformed frame count', () => {
      source.resetMalformedFrameCount();
      expect(source.getMalformedFrameCount()).toBe(0);
    });
  });
});
