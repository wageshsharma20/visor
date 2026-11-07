import { describe, it, expect, beforeEach } from 'vitest';
import { RecordedTracksSource, RecordedTracksData } from '../recordedTracks';

describe('RecordedTracksSource', () => {
  let source: RecordedTracksSource;

  const mockData: RecordedTracksData = {
    source: { width: 1920, height: 1080, fps: 30 },
    frames: [
      {
        frameId: 0,
        t: 0.0,
        detections: [
          {
            trackId: 'T001',
            classId: 'person',
            confidence: 0.95,
            bbox: { x: 0.1, y: 0.2, w: 0.1, h: 0.3 },
          },
        ],
      },
      {
        frameId: 10,
        t: 0.333,
        detections: [
          {
            trackId: 'T001',
            classId: 'person',
            confidence: 0.96,
            bbox: { x: 0.12, y: 0.2, w: 0.1, h: 0.3 },
          },
        ],
      },
      {
        frameId: 20,
        t: 0.666,
        detections: [
          {
            trackId: 'T001',
            classId: 'person',
            confidence: 0.96,
            bbox: { x: 0.14, y: 0.2, w: 0.1, h: 0.3 },
          },
        ],
      },
      {
        frameId: 30,
        t: 1.0,
        detections: [],
      },
    ],
  };

  beforeEach(() => {
    source = new RecordedTracksSource('/demo/scene.tracks.json', mockData);
  });

  describe('findClosestFrame', () => {
    it('returns first frame when currentTime <= 0', () => {
      const frame = source.findClosestFrame(-0.5);
      expect(frame?.frameId).toBe(0);
    });

    it('returns last frame when currentTime >= max duration', () => {
      const frame = source.findClosestFrame(2.5);
      expect(frame?.frameId).toBe(30);
    });

    it('matches closest timestamp within the range', () => {
      // 0.30 is closer to 0.333 than to 0.0
      const frameA = source.findClosestFrame(0.3);
      expect(frameA?.frameId).toBe(10);

      // 0.10 is closer to 0.0 than to 0.333
      const frameB = source.findClosestFrame(0.1);
      expect(frameB?.frameId).toBe(0);

      // 0.65 is closer to 0.666
      const frameC = source.findClosestFrame(0.65);
      expect(frameC?.frameId).toBe(20);
    });

    it('returns null when dataset is empty', () => {
      const emptySource = new RecordedTracksSource('/empty.json', {
        source: { width: 1920, height: 1080 },
        frames: [],
      });
      expect(emptySource.findClosestFrame(0.5)).toBeNull();
    });
  });

  describe('source metadata and lifecycle', () => {
    it('has kind=simulated and recorded label', () => {
      expect(source.kind).toBe('simulated');
      expect(source.label).toContain('RECORDED');
    });
  });
});
