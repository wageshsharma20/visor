import { describe, it, expect, beforeEach } from 'vitest';
import { SimulatedSceneSource } from '../simulatedScene';
import { Tracker } from '@/engine/tracker';

describe('SimulatedSceneSource (Realistic Simulation & Descriptions)', () => {
  let source: SimulatedSceneSource;
  let tracker: Tracker;

  beforeEach(() => {
    // Fixed seed for 100% deterministic test execution
    source = new SimulatedSceneSource({ seed: 42 });
    tracker = new Tracker({
      threshold: 0.5,
      watchlist: ['suitcase'],
      lostTimeoutMs: 1000,
      exitTimeoutMs: 5000,
      dropExitedMs: 60000,
    });
  });

  it('runs 120s of simulated ticks with fixed seed and verifies event counts and bounding box bounds', async () => {
    await source.start();

    const fps = 30;
    const totalSeconds = 120;
    const totalFrames = totalSeconds * fps;
    const dtMs = 1000 / fps;

    let currentTime = 100000;
    const eventCounts = {
      'track.new': 0,
      'track.lost': 0,
      'track.reacquired': 0,
      'track.exited': 0,
      'track.flagged': 0,
    };

    let totalEmittedDetections = 0;

    for (let f = 0; f < totalFrames; f++) {
      currentTime += dtMs;
      const frame = source.tick(currentTime);

      // Verify no emitted bbox lies outside 0..1
      for (const det of frame.detections) {
        totalEmittedDetections++;
        expect(det.bbox.x).toBeGreaterThanOrEqual(0);
        expect(det.bbox.y).toBeGreaterThanOrEqual(0);
        expect(det.bbox.w).toBeGreaterThan(0);
        expect(det.bbox.h).toBeGreaterThan(0);
        expect(det.bbox.x + det.bbox.w).toBeLessThanOrEqual(1.0001);
        expect(det.bbox.y + det.bbox.h).toBeLessThanOrEqual(1.0001);
      }

      // Feed frame to tracker with receipt time
      const events = tracker.ingest(frame, currentTime);
      for (const ev of events) {
        if (ev.type in eventCounts) {
          eventCounts[ev.type as keyof typeof eventCounts]++;
        }
      }
    }

    console.log('120s Seeded Simulation Event Counts:', eventCounts);
    console.log('Total Emitted Detections:', totalEmittedDetections);

    // Assert that track.new, track.lost, track.reacquired, track.exited, and track.flagged are ALL > 0
    expect(eventCounts['track.new']).toBeGreaterThan(0);
    expect(eventCounts['track.lost']).toBeGreaterThan(0);
    expect(eventCounts['track.reacquired']).toBeGreaterThan(0);
    expect(eventCounts['track.exited']).toBeGreaterThan(0);
    expect(eventCounts['track.flagged']).toBeGreaterThan(0);

    // Item 5: Descriptions generated once per track (and once more only if attributes change)
    // 120s run → descriptions <= tracks * 2
    const totalTracksSeen = tracker.getTracks().length + tracker.getHistoryTracks().length;
    const totalDescriptions = source.getDescriptionSimulator().getTotalGeneratedCount();

    console.log(`Tracks: ${totalTracksSeen}, Total Descriptions Generated: ${totalDescriptions}`);
    expect(totalDescriptions).toBeLessThanOrEqual(totalTracksSeen * 2);

    source.stop();
  });
});
