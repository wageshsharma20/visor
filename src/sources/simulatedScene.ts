import {
  BBox,
  DescriptionUpdate,
  DetectionFrame,
  DetectionSource,
  RawDetection,
  SourceStatus,
} from '@/types/detection';
import { DescriptionSimulator } from './descriptions';

// Canvas drawing palette aligned with tokens.css
const CANVAS_PALETTE = {
  floorBg: '#0A0A0A', // audit-ignore
  roadBg: '#131313', // audit-ignore
  roadLine: '#2B2B2B', // audit-ignore
  gridLine: 'rgba(255, 255, 255, 0.04)', // audit-ignore
  dropShadow: 'rgba(0, 0, 0, 0.45)', // audit-ignore
  vehicleBody: '#1C1C1C', // audit-ignore
  vehicleWindow: '#262626', // audit-ignore
  personTorso: '#262626', // audit-ignore
  personHead: '#9A9A9A', // audit-ignore
  personBag: '#C8B6E8', // audit-ignore
  suitcaseBody: '#262626', // audit-ignore
  suitcaseAccent: '#E8B04B', // audit-ignore
};

interface SimEntity {
  trackId: string;
  classId: 'person' | 'car' | 'truck' | 'suitcase' | 'bicycle';
  x: number; // 0..1
  y: number; // 0..1
  w: number; // 0..1
  h: number; // 0..1
  vx: number;
  vy: number;
  baseConf: number;
  attributes: Record<string, string | number | boolean>;
  active: boolean;
  spawnTime: number;
}

export class SimulatedSceneSource implements DetectionSource {
  readonly id = 'simulated-synthetic';
  readonly kind = 'simulated' as const;
  readonly label = 'SIMULATED · SYNTHETIC SCENE';

  private isRunning = false;
  private isPaused = false;
  private animFrameId: number | null = null;
  private lastTick = 0;
  private frameCount = 0;
  private startTime = 0;
  private suitcaseSpawned = false;
  private nextEntityId = 1;

  private entities: SimEntity[] = [];
  private boundCanvas: HTMLCanvasElement | null = null;

  private readonly frameListeners = new Set<(f: DetectionFrame) => void>();
  private readonly descListeners = new Set<(d: DescriptionUpdate) => void>();
  private readonly statusListeners = new Set<(s: SourceStatus) => void>();
  private readonly descSimulator = new DescriptionSimulator();

  constructor() {
    this.descSimulator.subscribe((d) => {
      for (const cb of this.descListeners) {
        cb(d);
      }
    });
  }

  bindCanvas(canvas: HTMLCanvasElement | null): void {
    this.boundCanvas = canvas;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    this.isPaused = false;
    this.startTime = Date.now();
    this.suitcaseSpawned = false;
    this.frameCount = 0;
    this.entities = [];
    this.nextEntityId = 1;

    this.initDefaultEntities();

    this.notifyStatus({ state: 'streaming', fps: 30 });

    this.lastTick = performance.now();
    this.scheduleNextTick();
  }

  stop(): void {
    this.isRunning = false;
    this.isPaused = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.descSimulator.clear();
    this.entities = [];
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
    this.lastTick = performance.now();
    this.notifyStatus({ state: 'streaming', fps: 30 });
    this.scheduleNextTick();
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

  private createId(): string {
    const id = `T${String(this.nextEntityId).padStart(3, '0')}`;
    this.nextEntityId++;
    return id;
  }

  private initDefaultEntities(): void {
    // 4 initial people walking in lobby/concourse
    const clothingUpper = ['dark jacket', 'grey sweater', 'navy coat', 'black hoodie'];
    const clothingLower = ['blue jeans', 'black trousers', 'khaki pants', 'dark denim'];
    const bagTypes = ['backpack', 'none', 'handbag', 'laptop bag'];

    for (let i = 0; i < 4; i++) {
      const dir = i % 2 === 0 ? 1 : -1;
      this.entities.push({
        trackId: this.createId(),
        classId: 'person',
        x: 0.15 + i * 0.22,
        y: 0.42 + (i % 3) * 0.12,
        w: 0.055,
        h: 0.22,
        vx: dir * (0.0008 + i * 0.0003),
        vy: (Math.random() - 0.5) * 0.0002,
        baseConf: 0.94 + Math.random() * 0.05,
        attributes: {
          upper: clothingUpper[i],
          lower: clothingLower[i],
          carrying: bagTypes[i],
          speed: 'walking',
          direction: dir > 0 ? 'east' : 'west',
        },
        active: true,
        spawnTime: Date.now(),
      });
    }

    // 1 car crossing roadway at top
    this.entities.push({
      trackId: this.createId(),
      classId: 'car',
      x: 0.1,
      y: 0.13,
      w: 0.16,
      h: 0.09,
      vx: 0.0035,
      vy: 0,
      baseConf: 0.97,
      attributes: {
        color: 'silver',
        type: 'sedan',
        direction: 'east',
        speed: 'moderate',
      },
      active: true,
      spawnTime: Date.now(),
    });
  }

  private scheduleNextTick(): void {
    this.animFrameId = requestAnimationFrame((timestamp) => {
      if (!this.isRunning || this.isPaused) return;

      const elapsed = timestamp - this.lastTick;
      // Target ~30 fps (~33ms intervals)
      if (elapsed >= 30) {
        this.lastTick = timestamp;
        this.tick();
      }

      this.scheduleNextTick();
    });
  }

  private tick(): void {
    this.frameCount++;
    const now = Date.now();
    const sessionSeconds = (now - this.startTime) / 1000;

    // Trigger unattended suitcase every ~60s
    if (!this.suitcaseSpawned && sessionSeconds >= 60) {
      this.suitcaseSpawned = true;
      const suitcase: SimEntity = {
        trackId: this.createId(),
        classId: 'suitcase',
        x: 0.48,
        y: 0.62,
        w: 0.05,
        h: 0.07,
        vx: 0,
        vy: 0,
        baseConf: 0.96,
        attributes: {
          color: 'black',
          attended: false,
        },
        active: true,
        spawnTime: now,
      };
      this.entities.push(suitcase);
    }

    // Update entity positions
    for (const ent of this.entities) {
      if (!ent.active) continue;

      ent.x += ent.vx;
      ent.y += ent.vy;

      if (ent.classId === 'car' || ent.classId === 'truck') {
        if (ent.x > 1.1) {
          ent.x = -0.2;
        } else if (ent.x < -0.2) {
          ent.x = 1.1;
        }
      } else if (ent.classId === 'person') {
        // Reverse direction at scene bounds
        if (ent.x < 0.05) {
          ent.vx = Math.abs(ent.vx);
          ent.attributes.direction = 'east';
        } else if (ent.x + ent.w > 0.95) {
          ent.vx = -Math.abs(ent.vx);
          ent.attributes.direction = 'west';
        }

        if (ent.y < 0.38) {
          ent.vy = Math.abs(ent.vy);
        } else if (ent.y + ent.h > 0.88) {
          ent.vy = -Math.abs(ent.vy);
        }
      }
    }

    // Build raw detections with ±1.5% jitter & confidence noise for realism
    const detections: RawDetection[] = [];

    for (const ent of this.entities) {
      if (!ent.active) continue;

      // Jitter
      const jitterX = (Math.random() - 0.5) * 0.003;
      const jitterY = (Math.random() - 0.5) * 0.003;
      const jitterW = (Math.random() - 0.5) * 0.003;
      const jitterH = (Math.random() - 0.5) * 0.003;
      const confNoise = (Math.random() - 0.5) * 0.04;

      const bbox: BBox = {
        x: Math.max(0, Math.min(0.95, Number((ent.x + jitterX).toFixed(4)))),
        y: Math.max(0, Math.min(0.95, Number((ent.y + jitterY).toFixed(4)))),
        w: Math.max(0.02, Math.min(0.8, Number((ent.w + jitterW).toFixed(4)))),
        h: Math.max(0.04, Math.min(0.8, Number((ent.h + jitterH).toFixed(4)))),
      };

      const confidence = Math.max(
        0.5,
        Math.min(0.99, Number((ent.baseConf + confNoise).toFixed(3)))
      );

      const det: RawDetection = {
        trackId: ent.trackId,
        classId: ent.classId,
        confidence,
        bbox,
        attributes: { ...ent.attributes },
      };

      detections.push(det);

      // Async description generation schedule
      this.descSimulator.schedule(det);
    }

    // Emit DetectionFrame
    const frame: DetectionFrame = {
      frameId: this.frameCount,
      ts: now,
      source: { width: 1280, height: 720 },
      detections,
      latencyMs: 14 + Math.floor(Math.random() * 5),
    };

    for (const listener of this.frameListeners) {
      listener(frame);
    }

    // Render to bound canvas if present
    if (this.boundCanvas) {
      const ctx = this.boundCanvas.getContext('2d');
      if (ctx) {
        this.draw(ctx, this.boundCanvas.width, this.boundCanvas.height);
      }
    }
  }

  /**
   * Renders the stylized synthetic scene directly onto a canvas context.
   */
  draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Background - dark slate floor
    ctx.fillStyle = CANVAS_PALETTE.floorBg;
    ctx.fillRect(0, 0, width, height);

    // Roadway band at top
    const roadY = height * 0.1;
    const roadH = height * 0.18;
    ctx.fillStyle = CANVAS_PALETTE.roadBg;
    ctx.fillRect(0, roadY, width, roadH);

    // Dashed road lane marker
    ctx.strokeStyle = CANVAS_PALETTE.roadLine;
    ctx.lineWidth = 2;
    ctx.setLineDash([16, 16]);
    ctx.beginPath();
    ctx.moveTo(0, roadY + roadH / 2);
    ctx.lineTo(width, roadY + roadH / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Concourse floor perspective grid
    ctx.strokeStyle = CANVAS_PALETTE.gridLine;
    ctx.lineWidth = 1;

    // Horizontal floor grid lines
    const startY = height * 0.32;
    const steps = 7;
    for (let i = 0; i <= steps; i++) {
      const y = startY + (i / steps) * (height - startY);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical perspective lines
    const vSteps = 10;
    for (let i = 0; i <= vSteps; i++) {
      const topX = width * 0.15 + (i / vSteps) * (width * 0.7);
      const bottomX = (i / vSteps) * width;
      ctx.beginPath();
      ctx.moveTo(topX, startY);
      ctx.lineTo(bottomX, height);
      ctx.stroke();
    }

    // Draw entities
    for (const ent of this.entities) {
      if (!ent.active) continue;

      const px = ent.x * width;
      const py = ent.y * height;
      const pw = ent.w * width;
      const ph = ent.h * height;

      if (ent.classId === 'car' || ent.classId === 'truck') {
        // Vehicle base
        ctx.fillStyle = CANVAS_PALETTE.dropShadow;
        ctx.beginPath();
        ctx.roundRect(px, py + ph - 4, pw, 8, 4);
        ctx.fill();

        // Vehicle body
        ctx.fillStyle = CANVAS_PALETTE.vehicleBody;
        ctx.beginPath();
        ctx.roundRect(px, py, pw, ph, 6);
        ctx.fill();

        // Windshield
        ctx.fillStyle = CANVAS_PALETTE.vehicleWindow;
        ctx.beginPath();
        ctx.roundRect(px + pw * 0.25, py + ph * 0.15, pw * 0.5, ph * 0.7, 3);
        ctx.fill();
      } else if (ent.classId === 'person') {
        // Person base
        ctx.fillStyle = CANVAS_PALETTE.dropShadow;
        ctx.beginPath();
        ctx.ellipse(px + pw / 2, py + ph, pw * 0.5, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Torso capsule
        ctx.fillStyle = CANVAS_PALETTE.personTorso;
        ctx.beginPath();
        ctx.roundRect(px + pw * 0.2, py + ph * 0.3, pw * 0.6, ph * 0.65, 4);
        ctx.fill();

        // Head
        ctx.fillStyle = CANVAS_PALETTE.personHead;
        const headR = Math.min(pw * 0.3, ph * 0.18);
        ctx.beginPath();
        ctx.arc(px + pw / 2, py + headR + 2, headR, 0, Math.PI * 2);
        ctx.fill();

        // Small indicator if carrying bag
        if (ent.attributes.carrying && ent.attributes.carrying !== 'none') {
          ctx.fillStyle = CANVAS_PALETTE.personBag;
          ctx.beginPath();
          ctx.roundRect(px + pw * 0.1, py + ph * 0.45, pw * 0.25, ph * 0.25, 2);
          ctx.fill();
        }
      } else if (ent.classId === 'suitcase') {
        // Luggage base
        ctx.fillStyle = CANVAS_PALETTE.dropShadow;
        ctx.beginPath();
        ctx.ellipse(px + pw / 2, py + ph, pw * 0.45, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Suitcase body
        ctx.fillStyle = CANVAS_PALETTE.suitcaseBody;
        ctx.beginPath();
        ctx.roundRect(px, py + ph * 0.2, pw, ph * 0.8, 3);
        ctx.fill();

        // Handle
        ctx.strokeStyle = CANVAS_PALETTE.suitcaseAccent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(px + pw * 0.3, py, pw * 0.4, ph * 0.25, [2, 2, 0, 0]);
        ctx.stroke();
      }
    }
  }
}
