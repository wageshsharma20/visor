import { DEFAULT_MODEL, DetectionFrame, DetectionRecord, ModelConfig } from './contract';

export interface DetectionQuery {
  classId?: string;
  limit: number;
  /** Return records whose lastSeen is strictly before this (pagination). */
  before?: number;
}

export interface Store {
  ingestFrame(frame: DetectionFrame): Promise<void>;
  latestFrame(): Promise<DetectionFrame | null>;
  listDetections(q: DetectionQuery): Promise<DetectionRecord[]>;
  clearDetections(): Promise<number>;
  getModel(): Promise<ModelConfig>;
  updateModel(patch: Partial<ModelConfig>): Promise<ModelConfig>;
}

/** Records kept by the memory store; older ones are evicted (ring-buffer rule). */
export const MEMORY_RECORD_CAP = 5000;

export function mergeRecord(
  prev: DetectionRecord | undefined,
  d: DetectionFrame['detections'][number],
  ts: number,
): DetectionRecord {
  if (!prev) {
    return {
      trackId: d.trackId,
      classId: d.classId,
      firstSeen: ts,
      lastSeen: ts,
      confidence: d.confidence,
      peakConfidence: d.confidence,
      bbox: d.bbox,
      frames: 1,
    };
  }
  return {
    ...prev,
    classId: d.classId,
    lastSeen: Math.max(prev.lastSeen, ts),
    confidence: d.confidence,
    peakConfidence: Math.max(prev.peakConfidence, d.confidence),
    bbox: d.bbox,
    frames: prev.frames + 1,
  };
}

/**
 * In-process store used when DATABASE_URL is unset (local dev and tests).
 * On Vercel each function instance has its own memory, so production
 * should always set DATABASE_URL.
 */
export class MemoryStore implements Store {
  private latest: DetectionFrame | null = null;
  private records = new Map<string, DetectionRecord>();
  private model: ModelConfig = { ...DEFAULT_MODEL };

  async ingestFrame(frame: DetectionFrame): Promise<void> {
    if (!this.latest || frame.frameId >= this.latest.frameId) this.latest = frame;
    for (const d of frame.detections) {
      const prev = this.records.get(d.trackId);
      this.records.delete(d.trackId); // re-insert to keep Map order = recency
      this.records.set(d.trackId, mergeRecord(prev, d, frame.ts));
    }
    while (this.records.size > MEMORY_RECORD_CAP) {
      const oldest = this.records.keys().next().value as string;
      this.records.delete(oldest);
    }
  }

  async latestFrame(): Promise<DetectionFrame | null> {
    return this.latest;
  }

  async listDetections(q: DetectionQuery): Promise<DetectionRecord[]> {
    return [...this.records.values()]
      .filter((r) => (q.classId ? r.classId === q.classId : true))
      .filter((r) => (q.before !== undefined ? r.lastSeen < q.before : true))
      .sort((a, b) => b.lastSeen - a.lastSeen)
      .slice(0, q.limit);
  }

  async clearDetections(): Promise<number> {
    const n = this.records.size;
    this.records.clear();
    this.latest = null;
    return n;
  }

  async getModel(): Promise<ModelConfig> {
    return this.model;
  }

  async updateModel(patch: Partial<ModelConfig>): Promise<ModelConfig> {
    this.model = { ...this.model, ...patch, updatedAt: Date.now() };
    return this.model;
  }
}
