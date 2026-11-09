/**
 * Wire contract shared by the API and its tests. Mirrors src/types/detection.ts
 * (DetectionFrame) so a model can push exactly what the frontend consumes.
 */

export interface BBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RawDetection {
  trackId: string;
  classId: string;
  confidence: number;
  bbox: BBox;
  attributes?: Record<string, string | number | boolean>;
}

export interface DetectionFrame {
  frameId: number;
  ts: number;
  source: { width: number; height: number };
  detections: RawDetection[];
  latencyMs?: number;
}

/** One stored detection: a track's latest state, upserted per frame. */
export interface DetectionRecord {
  trackId: string;
  classId: string;
  firstSeen: number;
  lastSeen: number;
  confidence: number;
  peakConfidence: number;
  bbox: BBox;
  frames: number;
}

export interface ModelConfig {
  name: string;
  version: string;
  runtime: string;
  confidenceThreshold: number;
  iouThreshold: number;
  classes: string[];
  updatedAt: number;
}

export const DEFAULT_MODEL: ModelConfig = {
  name: 'yolov8n',
  version: '1.2.0',
  runtime: 'onnx',
  confidenceThreshold: 0.5,
  iouThreshold: 0.45,
  classes: ['person', 'vehicle', 'backpack', 'handbag', 'suitcase', 'animal'],
  updatedAt: 0,
};

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const unit = (v: unknown): v is number => finite(v) && v >= 0 && v <= 1;
const nonEmpty = (v: unknown, max = 64): v is string =>
  typeof v === 'string' && v.trim().length > 0 && v.length <= max;

function isBBox(v: unknown): v is BBox {
  if (!v || typeof v !== 'object') return false;
  const b = v as Record<string, unknown>;
  return unit(b.x) && unit(b.y) && unit(b.w) && unit(b.h);
}

function isDetection(v: unknown): v is RawDetection {
  if (!v || typeof v !== 'object') return false;
  const d = v as Record<string, unknown>;
  return nonEmpty(d.trackId) && nonEmpty(d.classId) && unit(d.confidence) && isBBox(d.bbox);
}

export const MAX_DETECTIONS_PER_FRAME = 200;

/** Returns null when valid, otherwise a short reason. */
export function frameError(v: unknown): string | null {
  if (!v || typeof v !== 'object') return 'body must be a JSON object';
  const f = v as Record<string, unknown>;
  if (!finite(f.frameId)) return 'frameId must be a number';
  if (!finite(f.ts)) return 'ts must be epoch milliseconds';
  const s = f.source as Record<string, unknown> | undefined;
  if (!s || !finite(s.width) || !finite(s.height) || s.width <= 0 || s.height <= 0) {
    return 'source.width and source.height must be positive numbers';
  }
  if (!Array.isArray(f.detections)) return 'detections must be an array';
  if (f.detections.length > MAX_DETECTIONS_PER_FRAME) {
    return `at most ${MAX_DETECTIONS_PER_FRAME} detections per frame`;
  }
  const bad = f.detections.findIndex((d) => !isDetection(d));
  if (bad !== -1) return `detections[${bad}] is invalid (trackId, classId, confidence 0-1, bbox 0-1)`;
  if (f.latencyMs !== undefined && !finite(f.latencyMs)) return 'latencyMs must be a number';
  return null;
}

/** Returns null when valid, otherwise a short reason. Partial updates allowed. */
export function modelPatchError(v: unknown): string | null {
  if (!v || typeof v !== 'object') return 'body must be a JSON object';
  const m = v as Record<string, unknown>;
  if (m.name !== undefined && !nonEmpty(m.name)) return 'name must be a non-empty string';
  if (m.version !== undefined && !nonEmpty(m.version)) return 'version must be a non-empty string';
  if (m.runtime !== undefined && !nonEmpty(m.runtime)) return 'runtime must be a non-empty string';
  if (m.confidenceThreshold !== undefined && !unit(m.confidenceThreshold)) {
    return 'confidenceThreshold must be between 0 and 1';
  }
  if (m.iouThreshold !== undefined && !unit(m.iouThreshold)) return 'iouThreshold must be between 0 and 1';
  if (m.classes !== undefined) {
    if (!Array.isArray(m.classes) || m.classes.length > 100 || !m.classes.every((c) => nonEmpty(c))) {
      return 'classes must be an array of up to 100 non-empty strings';
    }
  }
  return null;
}
