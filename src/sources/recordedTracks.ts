import {
  DescriptionUpdate,
  DetectionFrame,
  DetectionSource,
  RawDetection,
  SourceStatus,
} from '@/types/detection';

export interface RecordedTrackFrame {
  frameId: number;
  t: number; // seconds into video
  detections: RawDetection[];
}

export interface RecordedTracksData {
  source: {
    width: number;
    height: number;
    fps?: number;
  };
  frames: RecordedTrackFrame[];
}

export class RecordedTracksSource implements DetectionSource {
  readonly id = 'demo-recorded';
  readonly kind = 'simulated' as const;
  readonly label = 'RECORDED · DEMO SCENE';

  private data: RecordedTracksData | null = null;
  private readonly tracksUrl: string;
  private videoEl: HTMLVideoElement | null = null;
  private animFrameId: number | null = null;
  private isRunning = false;
  private isPaused = false;
  private lastEmittedFrameId = -1;

  // Fallback internal clock if no video element is bound
  private fallbackClockSeconds = 0;
  private lastTickPerf = 0;

  private readonly frameListeners = new Set<(f: DetectionFrame) => void>();
  private readonly descListeners = new Set<(d: DescriptionUpdate) => void>();
  private readonly statusListeners = new Set<(s: SourceStatus) => void>();

  constructor(tracksUrl = '/demo/scene.tracks.json', initialData?: RecordedTracksData) {
    this.tracksUrl = tracksUrl;
    if (initialData) {
      this.data = initialData;
    }
  }

  setTracksData(data: RecordedTracksData): void {
    this.data = data;
  }

  getTracksData(): RecordedTracksData | null {
    return this.data;
  }

  bindVideo(video: HTMLVideoElement | null): void {
    this.videoEl = video;
  }

  async start(ctx: { video?: HTMLVideoElement } = {}): Promise<void> {
    if (this.isRunning) return;

    if (ctx.video) {
      this.videoEl = ctx.video;
    }

    this.notifyStatus({ state: 'connecting' });

    if (!this.data) {
      try {
        const response = await fetch(this.tracksUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} loading demo tracks from ${this.tracksUrl}`);
        }
        this.data = (await response.json()) as RecordedTracksData;
      } catch (err: unknown) {
        this.notifyStatus({
          state: 'error',
          message: (err as Error).message || 'Failed to load recorded tracks',
        });
        return;
      }
    }

    this.isRunning = true;
    this.isPaused = false;
    this.fallbackClockSeconds = 0;
    this.lastTickPerf = performance.now();
    this.lastEmittedFrameId = -1;

    const fps = this.data.source.fps ?? 30;
    this.notifyStatus({ state: 'streaming', fps });

    this.scheduleTick();
  }

  stop(): void {
    this.isRunning = false;
    this.isPaused = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.lastEmittedFrameId = -1;
    this.notifyStatus({ state: 'idle' });
  }

  pause(): void {
    if (!this.isRunning || this.isPaused) return;
    this.isPaused = true;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.notifyStatus({ state: 'paused' });
  }

  resume(): void {
    if (!this.isRunning || !this.isPaused) return;
    this.isPaused = false;
    this.lastTickPerf = performance.now();
    const fps = this.data?.source.fps ?? 30;
    this.notifyStatus({ state: 'streaming', fps });
    this.scheduleTick();
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

  /**
   * Binary search for the frame entry closest to currentTime.
   */
  findClosestFrame(currentTime: number): RecordedTrackFrame | null {
    if (!this.data || this.data.frames.length === 0) {
      return null;
    }

    const frames = this.data.frames;
    let low = 0;
    let high = frames.length - 1;

    if (currentTime <= frames[0].t) return frames[0];
    if (currentTime >= frames[high].t) return frames[high];

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const midTime = frames[mid].t;

      if (midTime === currentTime) {
        return frames[mid];
      }

      if (midTime < currentTime) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    // Compare high vs low
    const leftFrame = frames[high] ?? frames[0];
    const rightFrame = frames[low] ?? frames[frames.length - 1];

    const diffLeft = Math.abs(currentTime - leftFrame.t);
    const diffRight = Math.abs(currentTime - rightFrame.t);

    return diffLeft <= diffRight ? leftFrame : rightFrame;
  }

  private scheduleTick(): void {
    this.animFrameId = requestAnimationFrame((nowPerf) => {
      if (!this.isRunning || this.isPaused) return;

      const elapsedMs = nowPerf - this.lastTickPerf;
      this.lastTickPerf = nowPerf;

      let currentTime = 0;

      if (this.videoEl && !isNaN(this.videoEl.currentTime)) {
        currentTime = this.videoEl.currentTime;
      } else {
        // Fallback clock
        this.fallbackClockSeconds += elapsedMs / 1000;
        const totalDuration =
          this.data && this.data.frames.length > 0
            ? this.data.frames[this.data.frames.length - 1].t
            : 10;

        if (totalDuration > 0 && this.fallbackClockSeconds >= totalDuration) {
          // Loop
          this.fallbackClockSeconds = this.fallbackClockSeconds % totalDuration;
        }
        currentTime = this.fallbackClockSeconds;
      }

      const frame = this.findClosestFrame(currentTime);

      if (frame && frame.frameId !== this.lastEmittedFrameId && this.data) {
        this.lastEmittedFrameId = frame.frameId;

        const detectionFrame: DetectionFrame = {
          frameId: frame.frameId,
          ts: Date.now(),
          source: {
            width: this.data.source.width,
            height: this.data.source.height,
          },
          detections: frame.detections,
          latencyMs: 12,
        };

        for (const listener of this.frameListeners) {
          listener(detectionFrame);
        }
      }

      this.scheduleTick();
    });
  }
}
