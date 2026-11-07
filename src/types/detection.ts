/**
 * Normalized 0..1, relative to the source frame, origin top-left.
 */
export interface BBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * One object in one frame, as emitted by a model.
 */
export interface RawDetection {
  trackId: string; // stable across frames, e.g. "T004"
  classId: string; // "person" | "car" | "backpack" | ...
  confidence: number; // 0..1
  bbox: BBox;
  attributes?: Record<string, string | number | boolean>;
}

/**
 * One message from a source.
 */
export interface DetectionFrame {
  frameId: number;
  ts: number; // epoch ms when the frame was captured
  source: { width: number; height: number };
  detections: RawDetection[];
  latencyMs?: number;
}

/**
 * Async, slower enrichment from a vision-language model.
 */
export interface DescriptionUpdate {
  trackId: string;
  text: string;
  ts: number;
}

export type TrackStatus = 'visible' | 'lost' | 'exited';

/**
 * Frontend-owned object built by the tracker from frames.
 */
export interface Track {
  id: string;
  classId: string;
  label: string; // display name, e.g. "Person"
  displayId: string; // display name e.g. ID-004
  status: TrackStatus;
  firstSeen: number;
  lastSeen: number;
  confidence: number; // latest
  peakConfidence: number;
  bbox: BBox; // latest
  trail: Array<{ x: number; y: number }>; // centroids, capped at 30
  attributes: Record<string, string | number | boolean>;
  description: { status: 'pending' | 'ready' | 'unavailable'; text?: string };
  thumbnail?: string; // small dataURL cropped at first sighting
  flagged: boolean; // class is on the watchlist
}

export type DetectionEventType =
  | 'track.new'
  | 'track.lost'
  | 'track.reacquired'
  | 'track.exited'
  | 'track.flagged';

export interface DetectionEvent {
  id: string;
  ts: number;
  type: DetectionEventType;
  trackId: string;
  classId: string;
  confidence: number;
}

export type SourceStatus =
  | { state: 'idle' }
  | { state: 'connecting' }
  | { state: 'streaming'; fps: number }
  | { state: 'paused' }
  | { state: 'error'; message: string };

/**
 * The only thing the app knows about where detections come from.
 */
export interface DetectionSource {
  readonly id: string;
  readonly kind: 'simulated' | 'browser-model' | 'remote';
  readonly label: string; // shown in the HUD/model chip
  start(ctx: { video?: HTMLVideoElement }): Promise<void>;
  stop(): void;
  pause(): void;
  resume(): void;
  onFrame(cb: (f: DetectionFrame) => void): () => void;
  onDescription(cb: (d: DescriptionUpdate) => void): () => void;
  onStatus(cb: (s: SourceStatus) => void): () => void;
}
