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
  maxEvents?: number; // default 2000 per review finding 6
  maxHistoryTracks?: number; // default 1000 per review finding 6
  lostTimeoutMs?: number; // default 1000ms
  exitTimeoutMs?: number; // default 5000ms
  dropExitedMs?: number; // default 60000ms (60s) per review finding 6
}

function formatDisplayId(trackId: string): string {
  const digits = trackId.replace(/\D/g, '');
  if (digits.length > 0) {
    return `#${digits.padStart(3, '0')}`;
  }
  return `#${trackId}`;
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

interface InternalTrack extends Track {
  dirty: boolean;
  exitedAt?: number;
  unattendedSince?: number;
}

export class Tracker {
  private threshold: number;
  private watchlist: Set<string>;
  private readonly lostTimeoutMs: number;
  private readonly exitTimeoutMs: number;
  private readonly dropExitedMs: number;

  private readonly liveTracks = new Map<string, InternalTrack>();
  private readonly historyTracks: RingBuffer<Track>;
  private readonly events: RingBuffer<DetectionEvent>;

  // Cached snapshots for immutable reference equality
  private cachedSnapshots = new Map<string, Track>();

  constructor(options: TrackerOptions = {}) {
    this.threshold = options.threshold ?? 0.5;
    this.watchlist = new Set(options.watchlist ?? ['suitcase']);
    this.lostTimeoutMs = options.lostTimeoutMs ?? 1000;
    this.exitTimeoutMs = options.exitTimeoutMs ?? 5000;
    this.dropExitedMs = options.dropExitedMs ?? 60000;
    this.events = new RingBuffer<DetectionEvent>(options.maxEvents ?? 2000);
    this.historyTracks = new RingBuffer<Track>(options.maxHistoryTracks ?? 1000);
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
   * Clock rule: always uses browser receive time (receiptTime) for lastSeen and timeouts.
   * frame.ts is preserved as metadata only.
   */
  ingest(frame: DetectionFrame, receiptTime?: number): DetectionEvent[] {
    const now = receiptTime ?? Date.now();
    const emittedEvents: DetectionEvent[] = [];

    // Filter detections below threshold
    const validDetections: RawDetection[] = frame.detections.filter(
      (d) => d.confidence >= this.threshold
    );

    const seenTrackIds = new Set<string>();

    for (const det of validDetections) {
      seenTrackIds.add(det.trackId);
      const centroid = getCentroid(det.bbox);

      const existing = this.liveTracks.get(det.trackId);

      // An exited trackId that reappears creates a NEW track instance
      if (existing && existing.status === 'exited') {
        this.archiveTrack(existing);
        this.liveTracks.delete(det.trackId);
        this.cachedSnapshots.delete(det.trackId);
      }

      const current = this.liveTracks.get(det.trackId);

      if (!current) {
        // Brand new track
        let isFlagged = false;

        // Check watchlist rule:
        // Suitcases only become flagged after 10s unattended (attributes.attended=false)
        let unattendedSince: number | undefined;
        if (this.watchlist.has(det.classId)) {
          if (det.classId === 'suitcase') {
            if (det.attributes?.attended === false) {
              unattendedSince = now;
            }
          } else {
            isFlagged = true;
          }
        }

        const newTrack: InternalTrack = {
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
          dirty: true,
          unattendedSince,
        };

        this.liveTracks.set(det.trackId, newTrack);
        emittedEvents.push(
          this.emitEvent('track.new', det.trackId, det.classId, det.confidence, now)
        );

        if (isFlagged) {
          emittedEvents.push(
            this.emitEvent('track.flagged', det.trackId, det.classId, det.confidence, now)
          );
        }
      } else {
        // Existing active track update
        const wasLost = current.status === 'lost';
        current.status = 'visible';
        current.lastSeen = now;
        current.confidence = det.confidence;
        current.peakConfidence = Math.max(current.peakConfidence, det.confidence);
        current.bbox = { ...det.bbox };
        current.dirty = true;

        // Append centroid, capped at 30 points
        const trail = [...current.trail, centroid];
        if (trail.length > 30) {
          trail.splice(0, trail.length - 30);
        }
        current.trail = trail;

        if (det.attributes) {
          current.attributes = { ...current.attributes, ...det.attributes };
        }

        // Check watchlist unattended timer for suitcase
        if (this.watchlist.has(current.classId)) {
          if (current.classId === 'suitcase') {
            if (current.attributes?.attended === false) {
              if (current.unattendedSince === undefined) {
                current.unattendedSince = now;
              } else if (now - current.unattendedSince >= 10000 && !current.flagged) {
                current.flagged = true;
                current.dirty = true;
                emittedEvents.push(
                  this.emitEvent('track.flagged', current.id, current.classId, det.confidence, now)
                );
              }
            } else {
              current.unattendedSince = undefined;
            }
          } else if (!current.flagged) {
            current.flagged = true;
            current.dirty = true;
            emittedEvents.push(
              this.emitEvent('track.flagged', current.id, current.classId, det.confidence, now)
            );
          }
        }

        if (wasLost) {
          emittedEvents.push(
            this.emitEvent('track.reacquired', current.id, current.classId, det.confidence, now)
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
   * Check timeouts for lost (>=1s) and exited (>=5s) tracks, and drop old exited tracks (>=60s).
   */
  step(now: number = Date.now(), seenInCurrentFrame?: Set<string>): DetectionEvent[] {
    const emittedEvents: DetectionEvent[] = [];
    const toDrop: string[] = [];

    for (const track of this.liveTracks.values()) {
      // Check unattended suitcase timer even if not seen in this frame
      if (
        this.watchlist.has(track.classId) &&
        track.classId === 'suitcase' &&
        track.attributes?.attended === false &&
        !track.flagged &&
        track.unattendedSince !== undefined
      ) {
        if (now - track.unattendedSince >= 10000) {
          track.flagged = true;
          track.dirty = true;
          emittedEvents.push(
            this.emitEvent('track.flagged', track.id, track.classId, track.confidence, now)
          );
        }
      }

      if (seenInCurrentFrame?.has(track.id)) {
        continue;
      }

      const elapsed = now - track.lastSeen;

      if (track.status === 'visible' && elapsed >= this.lostTimeoutMs) {
        track.status = 'lost';
        track.dirty = true;
        emittedEvents.push(
          this.emitEvent('track.lost', track.id, track.classId, track.confidence, now)
        );
      } else if (track.status === 'lost' && elapsed >= this.exitTimeoutMs) {
        track.status = 'exited';
        track.exitedAt = now;
        track.dirty = true;
        emittedEvents.push(
          this.emitEvent('track.exited', track.id, track.classId, track.confidence, now)
        );
      } else if (track.status === 'exited' && track.exitedAt !== undefined) {
        if (now - track.exitedAt >= this.dropExitedMs) {
          toDrop.push(track.id);
        }
      }
    }

    // Drop exited tracks older than 60s from live map into history buffer
    for (const id of toDrop) {
      const track = this.liveTracks.get(id);
      if (track) {
        this.archiveTrack(track);
        this.liveTracks.delete(id);
        this.cachedSnapshots.delete(id);
      }
    }

    return emittedEvents;
  }

  private archiveTrack(track: InternalTrack): void {
    this.historyTracks.push(this.createTrackSnapshot(track));
  }

  private createTrackSnapshot(track: InternalTrack): Track {
    return {
      id: track.id,
      classId: track.classId,
      label: track.label,
      displayId: track.displayId,
      status: track.status,
      firstSeen: track.firstSeen,
      lastSeen: track.lastSeen,
      confidence: track.confidence,
      peakConfidence: track.peakConfidence,
      bbox: { ...track.bbox },
      trail: [...track.trail],
      attributes: { ...track.attributes },
      description: { ...track.description },
      thumbnail: track.thumbnail,
      flagged: track.flagged,
    };
  }

  updateDescription(trackId: string, text: string): void {
    const track = this.liveTracks.get(trackId);
    if (track) {
      track.description = {
        status: 'ready',
        text,
      };
      track.dirty = true;
    }
  }

  /**
   * Returns immutable snapshot of all live tracks.
   * Copies ONLY tracks whose lastSeen/status/description/bbox/etc. changed since the previous snapshot.
   * Unchanged tracks reuse the previous object reference so React.memo works.
   */
  getTracks(): Track[] {
    const result: Track[] = [];

    for (const track of this.liveTracks.values()) {
      if (track.dirty || !this.cachedSnapshots.has(track.id)) {
        const snapshot = this.createTrackSnapshot(track);
        this.cachedSnapshots.set(track.id, snapshot);
        track.dirty = false;
        result.push(snapshot);
      } else {
        result.push(this.cachedSnapshots.get(track.id)!);
      }
    }

    return result;
  }

  /**
   * Returns immutable snapshot of visible & lost tracks only.
   */
  getVisibleTracks(): Track[] {
    const all = this.getTracks();
    return all.filter((t) => t.status === 'visible' || t.status === 'lost');
  }

  getTrack(id: string): Track | undefined {
    const track = this.liveTracks.get(id);
    if (!track) return undefined;

    if (track.dirty || !this.cachedSnapshots.has(track.id)) {
      const snapshot = this.createTrackSnapshot(track);
      this.cachedSnapshots.set(track.id, snapshot);
      track.dirty = false;
      return snapshot;
    }

    return this.cachedSnapshots.get(track.id);
  }

  getEvents(): DetectionEvent[] {
    return this.events.toArray();
  }

  getHistoryTracks(): Track[] {
    return this.historyTracks.toArray();
  }

  clear(): void {
    this.liveTracks.clear();
    this.cachedSnapshots.clear();
    this.events.clear();
    this.historyTracks.clear();
  }
}
