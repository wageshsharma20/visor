import { describe, it, expect, beforeEach } from 'vitest';
import { Tracker } from '../tracker';
import { DetectionFrame } from '@/types/detection';

describe('Tracker', () => {
  let tracker: Tracker;

  beforeEach(() => {
    tracker = new Tracker({
      threshold: 0.5,
      watchlist: ['suitcase'],
      lostTimeoutMs: 1000,
      exitTimeoutMs: 5000,
    });
  });

  describe('Confidence threshold filtering', () => {
    it('ignores detections below the threshold completely', () => {
      const frame: DetectionFrame = {
        frameId: 1,
        ts: 1000,
        source: { width: 1280, height: 720 },
        detections: [
          {
            trackId: 'T001',
            classId: 'person',
            confidence: 0.42, // below 0.5
            bbox: { x: 0.1, y: 0.2, w: 0.1, h: 0.3 },
          },
        ],
      };

      const events = tracker.ingest(frame, 1000);
      expect(events).toHaveLength(0);
      expect(tracker.getTracks()).toHaveLength(0);
      expect(tracker.getEvents()).toHaveLength(0);
    });

    it('processes detections at or above threshold', () => {
      const frame: DetectionFrame = {
        frameId: 1,
        ts: 1000,
        source: { width: 1280, height: 720 },
        detections: [
          {
            trackId: 'T001',
            classId: 'person',
            confidence: 0.5,
            bbox: { x: 0.1, y: 0.2, w: 0.1, h: 0.3 },
          },
        ],
      };

      const events = tracker.ingest(frame, 1000);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('track.new');
      expect(tracker.getTracks()).toHaveLength(1);
    });

    it('dynamically adapts when threshold is updated', () => {
      tracker.setThreshold(0.8);
      const frame: DetectionFrame = {
        frameId: 1,
        ts: 1000,
        source: { width: 1280, height: 720 },
        detections: [
          {
            trackId: 'T001',
            classId: 'person',
            confidence: 0.75, // below new threshold 0.8
            bbox: { x: 0.1, y: 0.2, w: 0.1, h: 0.3 },
          },
        ],
      };

      tracker.ingest(frame, 1000);
      expect(tracker.getTracks()).toHaveLength(0);

      tracker.setThreshold(0.7);
      tracker.ingest(frame, 1000);
      expect(tracker.getTracks()).toHaveLength(1);
    });
  });

  describe('Track lifecycle & timing', () => {
    it('creates new track with centroid trail capped at 30 points', () => {
      const frame: DetectionFrame = {
        frameId: 1,
        ts: 1000,
        source: { width: 1280, height: 720 },
        detections: [
          {
            trackId: 'T001',
            classId: 'person',
            confidence: 0.9,
            bbox: { x: 0.1, y: 0.2, w: 0.2, h: 0.4 },
          },
        ],
      };

      tracker.ingest(frame, 1000);
      const track = tracker.getTrack('T001');
      expect(track).toBeDefined();
      expect(track?.status).toBe('visible');
      // Centroid: x = 0.1 + 0.1 = 0.2, y = 0.2 + 0.2 = 0.4
      expect(track?.trail).toEqual([{ x: 0.2, y: 0.4 }]);

      // Ingest 35 updates
      for (let i = 2; i <= 36; i++) {
        tracker.ingest(
          {
            frameId: i,
            ts: 1000 + i * 33,
            source: { width: 1280, height: 720 },
            detections: [
              {
                trackId: 'T001',
                classId: 'person',
                confidence: 0.9,
                bbox: { x: 0.1 + i * 0.001, y: 0.2, w: 0.2, h: 0.4 },
              },
            ],
          },
          1000 + i * 33
        );
      }

      const updatedTrack = tracker.getTrack('T001');
      expect(updatedTrack?.trail.length).toBe(30);
    });

    it('emits track.lost after 1000ms of inactivity', () => {
      tracker.ingest(
        {
          frameId: 1,
          ts: 1000,
          source: { width: 1280, height: 720 },
          detections: [
            {
              trackId: 'T001',
              classId: 'person',
              confidence: 0.9,
              bbox: { x: 0.1, y: 0.2, w: 0.2, h: 0.4 },
            },
          ],
        },
        1000
      );

      // 900ms later: still visible
      let events = tracker.step(1900);
      expect(events).toHaveLength(0);
      expect(tracker.getTrack('T001')?.status).toBe('visible');

      // 1000ms later: status transitions to lost
      events = tracker.step(2000);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('track.lost');
      expect(tracker.getTrack('T001')?.status).toBe('lost');
    });

    it('emits track.reacquired if seen again within 5s of last sighting', () => {
      tracker.ingest(
        {
          frameId: 1,
          ts: 1000,
          source: { width: 1280, height: 720 },
          detections: [
            {
              trackId: 'T001',
              classId: 'person',
              confidence: 0.9,
              bbox: { x: 0.1, y: 0.2, w: 0.2, h: 0.4 },
            },
          ],
        },
        1000
      );

      // Advance to lost
      tracker.step(2500);
      expect(tracker.getTrack('T001')?.status).toBe('lost');

      // Re-acquired at 3000ms (< 5000ms)
      const events = tracker.ingest(
        {
          frameId: 2,
          ts: 3000,
          source: { width: 1280, height: 720 },
          detections: [
            {
              trackId: 'T001',
              classId: 'person',
              confidence: 0.92,
              bbox: { x: 0.12, y: 0.2, w: 0.2, h: 0.4 },
            },
          ],
        },
        3000
      );

      const reacquired = events.find((e) => e.type === 'track.reacquired');
      expect(reacquired).toBeDefined();
      expect(tracker.getTrack('T001')?.status).toBe('visible');
    });

    it('emits track.exited when lost for 5000ms', () => {
      tracker.ingest(
        {
          frameId: 1,
          ts: 1000,
          source: { width: 1280, height: 720 },
          detections: [
            {
              trackId: 'T001',
              classId: 'person',
              confidence: 0.9,
              bbox: { x: 0.1, y: 0.2, w: 0.2, h: 0.4 },
            },
          ],
        },
        1000
      );

      // Lost after 1000ms
      tracker.step(2000);
      expect(tracker.getTrack('T001')?.status).toBe('lost');

      // At 6000ms elapsed since lastSeen (1000 + 5000 = 6000)
      const events = tracker.step(6000);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('track.exited');
      expect(tracker.getTrack('T001')?.status).toBe('exited');

      // Exited tracks are excluded from getVisibleTracks()
      expect(tracker.getVisibleTracks()).toHaveLength(0);
      // But retained in tracks history
      expect(tracker.getTracks()).toHaveLength(1);
    });
  });

  describe('Watchlist flagging', () => {
    it('emits track.flagged and sets flagged=true for watchlist classes', () => {
      const events = tracker.ingest(
        {
          frameId: 1,
          ts: 1000,
          source: { width: 1280, height: 720 },
          detections: [
            {
              trackId: 'T099',
              classId: 'suitcase',
              confidence: 0.88,
              bbox: { x: 0.4, y: 0.5, w: 0.1, h: 0.1 },
            },
          ],
        },
        1000
      );

      expect(events.map((e) => e.type)).toContain('track.new');
      expect(events.map((e) => e.type)).toContain('track.flagged');
      expect(tracker.getTrack('T099')?.flagged).toBe(true);
    });

    it('does not flag non-watchlist classes', () => {
      const events = tracker.ingest(
        {
          frameId: 1,
          ts: 1000,
          source: { width: 1280, height: 720 },
          detections: [
            {
              trackId: 'T002',
              classId: 'person',
              confidence: 0.88,
              bbox: { x: 0.4, y: 0.5, w: 0.1, h: 0.1 },
            },
          ],
        },
        1000
      );

      expect(events.map((e) => e.type)).toContain('track.new');
      expect(events.map((e) => e.type)).not.toContain('track.flagged');
      expect(tracker.getTrack('T002')?.flagged).toBe(false);
    });
  });
});
