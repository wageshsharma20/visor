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
      dropExitedMs: 60000,
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
            confidence: 0.42,
            bbox: { x: 0.1, y: 0.2, w: 0.1, h: 0.3 },
          },
        ],
      };

      const events = tracker.ingest(frame, 1000);
      expect(events).toHaveLength(0);
      expect(tracker.getTracks()).toHaveLength(0);
      expect(tracker.getEvents()).toHaveLength(0);
    });

    it('processes detections at or above threshold and formats displayId as #004', () => {
      const frame: DetectionFrame = {
        frameId: 1,
        ts: 1000,
        source: { width: 1280, height: 720 },
        detections: [
          {
            trackId: 'T004',
            classId: 'person',
            confidence: 0.95,
            bbox: { x: 0.1, y: 0.2, w: 0.1, h: 0.3 },
          },
        ],
      };

      const events = tracker.ingest(frame, 1000);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('track.new');

      const track = tracker.getTrack('T004');
      expect(track?.displayId).toBe('#004');
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
            confidence: 0.75,
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

  describe('One clock rule', () => {
    it('uses browser receipt time for lastSeen and timeouts, ignoring frame.ts from 1 hour in the past', () => {
      const pastTs = Date.now() - 3600000; // 1 hour in the past
      const receiptTime = 50000;

      const frame: DetectionFrame = {
        frameId: 1,
        ts: pastTs,
        source: { width: 1280, height: 720 },
        detections: [
          {
            trackId: 'T001',
            classId: 'person',
            confidence: 0.9,
            bbox: { x: 0.1, y: 0.2, w: 0.1, h: 0.3 },
          },
        ],
      };

      tracker.ingest(frame, receiptTime);
      const track = tracker.getTrack('T001');

      // Must record receipt time, not past frame.ts
      expect(track?.lastSeen).toBe(receiptTime);
      expect(track?.firstSeen).toBe(receiptTime);
      expect(track?.status).toBe('visible');

      // 500ms after receiptTime: must NOT be timed out as lost
      const events = tracker.step(receiptTime + 500);
      expect(events).toHaveLength(0);
      expect(tracker.getTrack('T001')?.status).toBe('visible');

      // 1000ms after receiptTime: times out as lost
      const timeoutEvents = tracker.step(receiptTime + 1000);
      expect(timeoutEvents).toHaveLength(1);
      expect(timeoutEvents[0].type).toBe('track.lost');
      expect(tracker.getTrack('T001')?.status).toBe('lost');
    });
  });

  describe('Immutable snapshots', () => {
    it('returns different object reference for updated track and preserves reference for unchanged track', () => {
      // Ingest initial tracks T001 and T002
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
              bbox: { x: 0.1, y: 0.2, w: 0.1, h: 0.3 },
            },
            {
              trackId: 'T002',
              classId: 'car',
              confidence: 0.95,
              bbox: { x: 0.5, y: 0.1, w: 0.2, h: 0.1 },
            },
          ],
        },
        1000
      );

      const snapshot1 = tracker.getTracks();
      const t001_v1 = snapshot1.find((t) => t.id === 'T001')!;
      const t002_v1 = snapshot1.find((t) => t.id === 'T002')!;

      // Ingest next frame updating ONLY T001 (T002 is not updated but not yet timed out)
      tracker.ingest(
        {
          frameId: 2,
          ts: 1200,
          source: { width: 1280, height: 720 },
          detections: [
            {
              trackId: 'T001',
              classId: 'person',
              confidence: 0.92,
              bbox: { x: 0.12, y: 0.2, w: 0.1, h: 0.3 },
            },
          ],
        },
        1200
      );

      const snapshot2 = tracker.getTracks();
      const t001_v2 = snapshot2.find((t) => t.id === 'T001')!;
      const t002_v2 = snapshot2.find((t) => t.id === 'T002')!;

      // Updated track yields a NEW object reference
      expect(t001_v2).not.toBe(t001_v1);
      expect(t001_v2.confidence).toBe(0.92);

      // Unchanged track keeps EXACT SAME object reference for React.memo
      expect(t002_v2).toBe(t002_v1);
    });
  });

  describe('Track lifecycle & timing', () => {
    it('creates new track with centroid trail capped at 30 points', () => {
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

    it('emits track.lost after 1000ms and track.reacquired if seen again within 5s', () => {
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

      tracker.step(2000);
      expect(tracker.getTrack('T001')?.status).toBe('lost');

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

      expect(events.find((e) => e.type === 'track.reacquired')).toBeDefined();
      expect(tracker.getTrack('T001')?.status).toBe('visible');
    });

    it('emits track.exited after 5s lost and drops after 60s into history', () => {
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

      // Lost at 2000ms
      tracker.step(2000);
      expect(tracker.getTrack('T001')?.status).toBe('lost');

      // Exited at 6000ms (5000ms after lastSeen 1000)
      tracker.step(6000);
      expect(tracker.getTrack('T001')?.status).toBe('exited');

      // 59s after exit (65000ms): still in live tracks map
      tracker.step(65000);
      expect(tracker.getTrack('T001')).toBeDefined();

      // 61s after exit (67001ms): dropped from live map into history
      tracker.step(67001);
      expect(tracker.getTrack('T001')).toBeUndefined();
      expect(tracker.getHistoryTracks()).toHaveLength(1);
      expect(tracker.getHistoryTracks()[0].id).toBe('T001');
    });

    it('creates a new track instance when an exited trackId reappears', () => {
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

      // Transition to exited
      tracker.step(2000); // lost
      tracker.step(6000); // exited

      const oldSnapshot = tracker.getTrack('T001');
      expect(oldSnapshot?.status).toBe('exited');

      // T001 reappears at t=8000
      const events = tracker.ingest(
        {
          frameId: 2,
          ts: 8000,
          source: { width: 1280, height: 720 },
          detections: [
            {
              trackId: 'T001',
              classId: 'person',
              confidence: 0.85,
              bbox: { x: 0.3, y: 0.3, w: 0.2, h: 0.4 },
            },
          ],
        },
        8000
      );

      // Emits track.new for the new instance
      expect(events.map((e) => e.type)).toContain('track.new');

      const newSnapshot = tracker.getTrack('T001');
      expect(newSnapshot).toBeDefined();
      expect(newSnapshot?.status).toBe('visible');
      expect(newSnapshot?.firstSeen).toBe(8000);
      expect(newSnapshot).not.toBe(oldSnapshot);

      // Old instance is archived in history
      expect(tracker.getHistoryTracks()).toHaveLength(1);
    });
  });

  describe('Watchlist and Suitcase 10s Unattended Rule', () => {
    it('flags suitcase ONLY after 10s unattended', () => {
      // Suitcase enters attended (e.g. held)
      tracker.ingest(
        {
          frameId: 1,
          ts: 1000,
          source: { width: 1280, height: 720 },
          detections: [
            {
              trackId: 'T010',
              classId: 'suitcase',
              confidence: 0.95,
              bbox: { x: 0.4, y: 0.5, w: 0.05, h: 0.07 },
              attributes: { attended: true },
            },
          ],
        },
        1000
      );

      let track = tracker.getTrack('T010');
      expect(track?.flagged).toBe(false);

      // Suitcase dropped at t=5000 (attended=false)
      const dropEvents = tracker.ingest(
        {
          frameId: 2,
          ts: 5000,
          source: { width: 1280, height: 720 },
          detections: [
            {
              trackId: 'T010',
              classId: 'suitcase',
              confidence: 0.95,
              bbox: { x: 0.4, y: 0.5, w: 0.05, h: 0.07 },
              attributes: { attended: false },
            },
          ],
        },
        5000
      );

      // At drop time (0s unattended), not yet flagged
      expect(dropEvents.map((e) => e.type)).not.toContain('track.flagged');
      expect(tracker.getTrack('T010')?.flagged).toBe(false);

      // 9s after drop (t=14000)
      tracker.step(14000);
      expect(tracker.getTrack('T010')?.flagged).toBe(false);

      // 10s after drop (t=15000): flags and emits track.flagged
      const flagEvents = tracker.step(15000);
      expect(flagEvents.map((e) => e.type)).toContain('track.flagged');
      track = tracker.getTrack('T010');
      expect(track?.flagged).toBe(true);
    });
  });
});
