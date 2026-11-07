import {
  BBox,
  DetectionEvent,
  DetectionEventType,
  DetectionFrame,
  RawDetection,
  Track,
} from '@/types/detection';
import { RingBuffer } from './ringBuffer';

export interface TrackerOptions {
  threshold?: number;
  watchlist?: string[];
  maxEvents?: number;
  lostTimeoutMs?: number; // default 1000ms
  exitTimeoutMs?: number; // default 5000ms
}

function formatDisplayId(trackId: string): string {
  const digits = trackId.replace(/\D/g, '');
  if (digits.length > 0) {
    return `ID-${digits.padStart(3, '0')}`;
  }
  return trackId.toUpperCase();
}

function formatLabel(classId: string): string {
  if (!classId) return 'Object';
  return classId.charAt(0).toUpperCase() + classId.slice(1);
}

function getCentroid(bbox: BBox): { x: number; y: number } {
  return {
    x: Number((bbox.x + bbox.w / 2).toFixed(4)),
    y: Number((bbox.y + bbox.h / 2).toFixed(4)),
  };
}

let eventSeq = 0;
function createEventId(): string {
  eventSeq = (eventSeq + 1) % 1_000_000;
  return `evt_${Date.now()}_${eventSeq}`;
}

export class Tracker {
  private threshold: number;
  private watchlist: Set<string>;
  private readonly lostTimeoutMs: number;
  private readonly exitTimeoutMs: number;

  private readonly tracks = new Map<string, Track>();
  private readonly events: RingBuffer<DetectionEvent>;

  constructor(options: TrackerOptions = {}) {
    this.threshold = options.threshold ?? 0.5;
    this.watchlist = new Set(options.watchlist ?? ['suitcase']);
    this.lostTimeoutMs = options.lostTimeoutMs ?? 1000;
    this.exitTimeoutMs = options.exitTimeoutMs ?? 5000;
    this.events = new RingBuffer<DetectionEvent>(options.maxEvents ?? 500);
  }

  setThreshold(threshold: number): void {
    this.threshold = threshold;
  }

  getThreshold(): number {
    return this.threshold;
  }

  setWatchlist(classes: string[]): void {
    this.watchlist = new Set(classes);
  }

  getWatchlist(): string[] {
    return Array.from(this.watchlist);
  }

  private emitEvent(
    type: DetectionEventType,
    trackId: string,
    classId: string,
    confidence: number,
    ts: number
  ): DetectionEvent {
    const event: DetectionEvent = {
      id: createEventId(),
      ts,
      type,
      trackId,
      classId,
      confidence,
    };
    this.events.push(event);
    return event;
  }

  /**
   * Ingest a frame of detections.
   * Filters by threshold, updates tracks, checks timeouts, and emits lifecycle events.
   */
  ingest(frame: DetectionFrame, customNow?: number): DetectionEvent[] {
    const now = customNow ?? frame.ts ?? Date.now();
    const emittedEvents: DetectionEvent[] = [];

    // Filter detections below threshold
    const validDetections: RawDetection[] = frame.detections.filter(
      (d) => d.confidence >= this.threshold
    );

    const seenTrackIds = new Set<string>();

    for (const det of validDetections) {
      seenTrackIds.add(det.trackId);
      const centroid = getCentroid(det.bbox);

      const existing = this.tracks.get(det.trackId);

      if (!existing) {
        // Brand new track
        const isFlagged = this.watchlist.has(det.classId);
        const newTrack: Track = {
          id: det.trackId,
          classId: det.classId,
          label: formatLabel(det.classId),
          displayId: formatDisplayId(det.trackId),
          status: 'visible',
          firstSeen: now,
          lastSeen: now,
          confidence: det.confidence,
          peakConfidence: det.confidence,
          bbox: { ...det.bbox },
          trail: [centroid],
          attributes: det.attributes ? { ...det.attributes } : {},
          description: { status: 'pending' },
          flagged: isFlagged,
        };

        this.tracks.set(det.trackId, newTrack);
        emittedEvents.push(
          this.emitEvent('track.new', det.trackId, det.classId, det.confidence, now)
        );

        if (isFlagged) {
          emittedEvents.push(
            this.emitEvent('track.flagged', det.trackId, det.classId, det.confidence, now)
          );
        }
      } else {
        // Existing track updated
        const wasLost = existing.status === 'lost' || existing.status === 'exited';
        existing.status = 'visible';
        existing.lastSeen = now;
        existing.confidence = det.confidence;
        existing.peakConfidence = Math.max(existing.peakConfidence, det.confidence);
        existing.bbox = { ...det.bbox };

        // Append centroid, capped at 30 points
        const trail = [...existing.trail, centroid];
        if (trail.length > 30) {
          trail.splice(0, trail.length - 30);
        }
        existing.trail = trail;

        if (det.attributes) {
          existing.attributes = { ...existing.attributes, ...det.attributes };
        }

        // Re-evaluate flagged status in case watchlist changed
        if (this.watchlist.has(existing.classId)) {
          if (!existing.flagged) {
            existing.flagged = true;
            emittedEvents.push(
              this.emitEvent('track.flagged', existing.id, existing.classId, det.confidence, now)
            );
          }
        }

        if (wasLost) {
          emittedEvents.push(
            this.emitEvent('track.reacquired', existing.id, existing.classId, det.confidence, now)
          );
        }
      }
    }

    // Step timeouts for tracks not seen in this frame
    const timeoutEvents = this.step(now, seenTrackIds);
    emittedEvents.push(...timeoutEvents);

    return emittedEvents;
  }

  /**
   * Check timeouts for lost (>=1s) and exited (>=5s) tracks.
   */
  step(now: number = Date.now(), seenInCurrentFrame?: Set<string>): DetectionEvent[] {
    const emittedEvents: DetectionEvent[] = [];

    for (const track of this.tracks.values()) {
      if (seenInCurrentFrame?.has(track.id)) {
        continue;
      }

      const elapsed = now - track.lastSeen;

      if (track.status === 'visible' && elapsed >= this.lostTimeoutMs) {
        track.status = 'lost';
        emittedEvents.push(
          this.emitEvent('track.lost', track.id, track.classId, track.confidence, now)
        );
      } else if (track.status === 'lost' && elapsed >= this.exitTimeoutMs) {
        track.status = 'exited';
        emittedEvents.push(
          this.emitEvent('track.exited', track.id, track.classId, track.confidence, now)
        );
      }
    }

    return emittedEvents;
  }

  updateDescription(trackId: string, text: string): void {
    const track = this.tracks.get(trackId);
    if (track) {
      track.description = {
        status: 'ready',
        text,
      };
    }
  }

  getTracks(): Track[] {
    return Array.from(this.tracks.values());
  }

  getVisibleTracks(): Track[] {
    return Array.from(this.tracks.values()).filter(
      (t) => t.status === 'visible' || t.status === 'lost'
    );
  }

  getTrack(id: string): Track | undefined {
    return this.tracks.get(id);
  }

  getEvents(): DetectionEvent[] {
    return this.events.toArray();
  }

  clear(): void {
    this.tracks.clear();
    this.events.clear();
  }
}
