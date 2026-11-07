import {
  DescriptionUpdate,
  DetectionFrame,
  DetectionSource,
  SourceStatus,
} from '@/types/detection';

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

  async start(): Promise<void> {
    this.isExplicitlyStopped = false;
    this.reconnectAttempts = 0;
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
          if (raw && typeof raw === 'object' && Array.isArray(raw.detections)) {
            const frame = raw as DetectionFrame;
            this.handleFrame(frame);
          }
        } catch {
          // Ignore invalid JSON payloads
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
