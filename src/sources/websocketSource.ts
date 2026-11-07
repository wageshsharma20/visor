import {
  BBox,
  DescriptionUpdate,
  DetectionFrame,
  DetectionSource,
  RawDetection,
  SourceStatus,
} from '@/types/detection';

function isBBox(obj: unknown): obj is BBox {
  if (!obj || typeof obj !== 'object') return false;
  const b = obj as Record<string, unknown>;
  return (
    typeof b.x === 'number' &&
    !isNaN(b.x) &&
    typeof b.y === 'number' &&
    !isNaN(b.y) &&
    typeof b.w === 'number' &&
    !isNaN(b.w) &&
    typeof b.h === 'number' &&
    !isNaN(b.h)
  );
}

function isRawDetection(obj: unknown): obj is RawDetection {
  if (!obj || typeof obj !== 'object') return false;
  const d = obj as Record<string, unknown>;
  return (
    typeof d.trackId === 'string' &&
    d.trackId.trim().length > 0 &&
    typeof d.classId === 'string' &&
    d.classId.trim().length > 0 &&
    typeof d.confidence === 'number' &&
    !isNaN(d.confidence) &&
    isBBox(d.bbox)
  );
}

export function validateDetectionFrame(data: unknown): data is DetectionFrame {
  if (!data || typeof data !== 'object') return false;
  const f = data as Record<string, unknown>;

  if (typeof f.frameId !== 'number' || isNaN(f.frameId)) return false;
  if (typeof f.ts !== 'number' || isNaN(f.ts)) return false;
  if (!f.source || typeof f.source !== 'object') return false;

  const src = f.source as Record<string, unknown>;
  if (typeof src.width !== 'number' || typeof src.height !== 'number') return false;

  if (!Array.isArray(f.detections)) return false;
  for (const det of f.detections) {
    if (!isRawDetection(det)) {
      return false;
    }
  }

  return true;
}

export class WebSocketSource implements DetectionSource {
  readonly id = 'remote-websocket';
  readonly kind = 'remote' as const;
  label = 'REMOTE · WEBSOCKET';

  private url: string;
  private ws: WebSocket | null = null;
  private isExplicitlyStopped = false;
  private reconnectTimeoutId: number | null = null;
  private reconnectAttempts = 0;
  private lastFpsCalcTime = 0;
  private frameCountSinceLastCalc = 0;
  private currentFps = 0;
  private malformedFrameCount = 0;

  private readonly frameListeners = new Set<(f: DetectionFrame) => void>();
  private readonly descListeners = new Set<(d: DescriptionUpdate) => void>();
  private readonly statusListeners = new Set<(s: SourceStatus) => void>();

  constructor(url = 'wss://localhost:8765') {
    this.url = url;
  }

  setUrl(url: string): void {
    this.url = url;
    if (this.ws && !this.isExplicitlyStopped) {
      // Reconnect with new URL
      this.disconnect();
      this.connect();
    }
  }

  getUrl(): string {
    return this.url;
  }

  getMalformedFrameCount(): number {
    return this.malformedFrameCount;
  }

  resetMalformedFrameCount(): void {
    this.malformedFrameCount = 0;
  }

  async start(): Promise<void> {
    this.isExplicitlyStopped = false;
    this.reconnectAttempts = 0;
    this.malformedFrameCount = 0;
    this.connect();
  }

  stop(): void {
    this.isExplicitlyStopped = true;
    if (this.reconnectTimeoutId !== null) {
      window.clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    this.disconnect();
    this.notifyStatus({ state: 'idle' });
  }

  pause(): void {
    this.notifyStatus({ state: 'paused' });
  }

  resume(): void {
    this.notifyStatus({ state: 'streaming', fps: this.currentFps });
  }

  onFrame(cb: (f: DetectionFrame) => void): () => void {
    this.frameListeners.add(cb);
    return () => this.frameListeners.delete(cb);
  }

  onDescription(cb: (d: DescriptionUpdate) => void): () => void {
    this.descListeners.add(cb);
    return () => this.descListeners.delete(cb);
  }

  onStatus(cb: (s: SourceStatus) => void): () => void {
    this.statusListeners.add(cb);
    return () => this.statusListeners.delete(cb);
  }

  private notifyStatus(status: SourceStatus): void {
    for (const listener of this.statusListeners) {
      listener(status);
    }
  }

  private connect(): void {
    if (this.isExplicitlyStopped) return;

    this.notifyStatus({ state: 'connecting' });

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.lastFpsCalcTime = performance.now();
        this.frameCountSinceLastCalc = 0;
        this.notifyStatus({ state: 'streaming', fps: 0 });
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const raw = typeof event.data === 'string' ? JSON.parse(event.data) : null;
          if (validateDetectionFrame(raw)) {
            this.handleFrame(raw);
          } else {
            // Drop malformed frame and count it
            this.malformedFrameCount++;
          }
        } catch {
          // JSON parsing failed: drop and count
          this.malformedFrameCount++;
        }
      };

      this.ws.onerror = () => {
        this.notifyStatus({
          state: 'error',
          message: `WebSocket connection error to ${this.url}`,
        });
      };

      this.ws.onclose = () => {
        if (!this.isExplicitlyStopped) {
          this.scheduleReconnect();
        }
      };
    } catch (err: unknown) {
      this.notifyStatus({
        state: 'error',
        message: (err as Error).message || 'Failed to initialize WebSocket',
      });
      this.scheduleReconnect();
    }
  }

  private handleFrame(frame: DetectionFrame): void {
    this.frameCountSinceLastCalc++;
    const now = performance.now();
    const elapsed = now - this.lastFpsCalcTime;

    if (elapsed >= 1000) {
      this.currentFps = Math.round((this.frameCountSinceLastCalc * 1000) / elapsed);
      this.frameCountSinceLastCalc = 0;
      this.lastFpsCalcTime = now;
      this.notifyStatus({ state: 'streaming', fps: this.currentFps });
    }

    for (const listener of this.frameListeners) {
      listener(frame);
    }
  }

  private disconnect(): void {
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      try {
        this.ws.close();
      } catch {
        /* Already closed */
      }
      this.ws = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.isExplicitlyStopped) return;

    this.reconnectAttempts++;
    // Exponential backoff capped at 10s
    const delay = Math.min(10000, 1000 * Math.pow(1.5, this.reconnectAttempts));

    this.reconnectTimeoutId = window.setTimeout(() => {
      this.connect();
    }, delay);
  }
}
