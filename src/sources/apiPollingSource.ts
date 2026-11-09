import {
  DescriptionUpdate,
  DetectionFrame,
  DetectionSource,
  SourceStatus,
} from '@/types/detection';
import { validateDetectionFrame } from './websocketSource';

/** Same-origin backend (Vercel functions in /api). */
export const API_BASE = '/api';

/**
 * Reads frames that a model pushes to POST /api/frames by polling
 * GET /api/frames/latest. Vercel functions can't hold a WebSocket open,
 * so this is the live path for the hosted backend.
 */
export class ApiPollingSource implements DetectionSource {
  readonly id = 'remote-api';
  readonly kind = 'remote' as const;
  readonly label = 'REMOTE · API';

  private timer: number | null = null;
  private running = false;
  private paused = false;
  private lastFrameId: number | null = null;
  private failures = 0;
  private frameTimes: number[] = [];

  private readonly frameListeners = new Set<(f: DetectionFrame) => void>();
  private readonly descListeners = new Set<(d: DescriptionUpdate) => void>();
  private readonly statusListeners = new Set<(s: SourceStatus) => void>();

  constructor(
    private readonly intervalMs = 100,
    private readonly fetchImpl: typeof fetch = (...args) => fetch(...args),
  ) {}

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    this.failures = 0;
    this.lastFrameId = null;
    this.frameTimes = [];
    this.emitStatus({ state: 'connecting' });
    this.schedule(0);
  }

  stop(): void {
    this.running = false;
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = null;
    this.emitStatus({ state: 'idle' });
  }

  pause(): void {
    this.paused = true;
    this.emitStatus({ state: 'paused' });
  }

  resume(): void {
    this.paused = false;
    this.emitStatus({ state: 'streaming', fps: this.fps() });
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

  /** Visible for tests: run one poll immediately. */
  async pollOnce(): Promise<void> {
    const qs = this.lastFrameId === null ? '' : `?after=${this.lastFrameId}`;
    try {
      const res = await this.fetchImpl(`${API_BASE}/frames/latest${qs}`, { cache: 'no-store' });
      if (!this.running) return;
      if (res.status === 204) {
        this.failures = 0;
        if (this.lastFrameId === null) this.emitStatus({ state: 'streaming', fps: 0 });
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const frame: unknown = await res.json();
      if (!validateDetectionFrame(frame)) return;
      this.failures = 0;
      this.lastFrameId = frame.frameId;
      this.recordFrame();
      if (!this.paused) for (const l of this.frameListeners) l(frame);
    } catch (e) {
      if (!this.running) return;
      this.failures++;
      if (this.failures === 3) {
        this.emitStatus({ state: 'error', message: `Backend unreachable (${(e as Error).message})` });
      }
    }
  }

  private schedule(delay: number): void {
    this.timer = window.setTimeout(async () => {
      if (!this.running) return;
      await this.pollOnce();
      if (!this.running) return;
      // Back off while failing, up to 5s.
      const next = this.failures ? Math.min(5000, this.intervalMs * 2 ** this.failures) : this.intervalMs;
      this.schedule(next);
    }, delay);
  }

  private recordFrame(): void {
    const now = performance.now();
    this.frameTimes.push(now);
    while (this.frameTimes.length && now - this.frameTimes[0] > 1000) this.frameTimes.shift();
    if (this.frameTimes.length % 5 === 1) this.emitStatus({ state: 'streaming', fps: this.fps() });
  }

  private fps(): number {
    return this.frameTimes.length;
  }

  private emitStatus(s: SourceStatus): void {
    for (const l of this.statusListeners) l(s);
  }
}

/** True when the backend is reachable. Used to decide whether to offer it. */
export async function backendAvailable(fetchImpl: typeof fetch = fetch): Promise<boolean> {
  try {
    const res = await fetchImpl(`${API_BASE}/health`, { cache: 'no-store' });
    if (!res.ok) return false;
    const body = (await res.json()) as { ok?: boolean };
    return body.ok === true;
  } catch {
    return false;
  }
}
