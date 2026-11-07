import {
  BBox,
  DescriptionUpdate,
  DetectionFrame,
  DetectionSource,
  RawDetection,
  SourceStatus,
} from '@/types/detection';
import { DescriptionSimulator } from './descriptions';

// Mulberry32 32-bit seeded pseudo-random number generator
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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

export interface SimEntity {
  trackId: string;
  classId: 'person' | 'car' | 'truck' | 'suitcase' | 'bicycle';
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  baseConf: number;
  attributes: Record<string, string | number | boolean>;
  depth: number; // larger is closer to camera (foreground)
  active: boolean;
  spawnTime: number;
  occludedUntil?: number;
}

function computeIoU(a: BBox, b: BBox): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);

  const interW = Math.max(0, x2 - x1);
  const interH = Math.max(0, y2 - y1);
  const interArea = interW * interH;

  if (interArea <= 0) return 0;

  const areaA = a.w * a.h;
  const areaB = b.w * b.h;
  const unionArea = areaA + areaB - interArea;

  return unionArea > 0 ? interArea / unionArea : 0;
}

export interface SimulatedSceneOptions {
  seed?: number;
  width?: number;
  height?: number;
  fps?: number;
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
  private nextEntityId = 1;

  private rng: () => number;
  private initialSeed: number;

  private entities: SimEntity[] = [];
  private boundCanvas: HTMLCanvasElement | null = null;

  // Suitcase scenario state
  private suitcaseDropped = false;
  private carrierEntityId: string | null = null;
  private lastOcclusionTriggerTime = 0;

  private readonly frameListeners = new Set<(f: DetectionFrame) => void>();
  private readonly descListeners = new Set<(d: DescriptionUpdate) => void>();
  private readonly statusListeners = new Set<(s: SourceStatus) => void>();
  private readonly descSimulator: DescriptionSimulator;

  constructor(options: SimulatedSceneOptions = {}) {
    this.initialSeed = options.seed ?? 1337;
    this.rng = mulberry32(this.initialSeed);
    this.descSimulator = new DescriptionSimulator({ rng: this.rng });

    this.descSimulator.subscribe((d) => {
      for (const cb of this.descListeners) {
        cb(d);
      }
    });
  }

  setSeed(seed: number): void {
    this.initialSeed = seed;
    this.rng = mulberry32(seed);
    this.descSimulator.setRng(this.rng);
  }

  bindCanvas(canvas: HTMLCanvasElement | null): void {
    this.boundCanvas = canvas;
  }

  getEntities(): SimEntity[] {
    return this.entities;
  }

  getDescriptionSimulator(): DescriptionSimulator {
    return this.descSimulator;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    this.isPaused = false;
    this.startTime = 0; // Lazily set on first tick
    this.frameCount = 0;
    this.entities = [];
    this.nextEntityId = 1;
    this.suitcaseDropped = false;
    this.carrierEntityId = null;
    this.lastOcclusionTriggerTime = 0;

    this.rng = mulberry32(this.initialSeed);
    this.descSimulator.setRng(this.rng);
    this.descSimulator.clear();

    this.initScene();
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

  private initScene(): void {
    // Initial 4 people
    for (let i = 0; i < 4; i++) {
      this.spawnPerson(0.12 + i * 0.22, 0.45 + (i % 3) * 0.12, i % 2 === 0 ? 1 : -1);
    }

    // 1 car on roadway
    this.spawnCar(0.1, 1);
  }

  private spawnPerson(startX: number, startY: number, dir: 1 | -1): SimEntity {
    const clothingUpper = ['dark jacket', 'grey sweater', 'navy coat', 'black hoodie', 'khaki jacket'];
    const clothingLower = ['blue jeans', 'black trousers', 'khaki pants', 'dark denim'];
    const bagTypes = ['backpack', 'none', 'handbag', 'laptop bag'];

    const uIdx = Math.floor(this.rng() * clothingUpper.length);
    const lIdx = Math.floor(this.rng() * clothingLower.length);
    const bIdx = Math.floor(this.rng() * bagTypes.length);

    const speed = 0.0018 + this.rng() * 0.001;
    const trackId = this.createId();

    const person: SimEntity = {
      trackId,
      classId: 'person',
      x: startX,
      y: startY,
      w: 0.06,
      h: 0.22,
      vx: dir * speed,
      vy: (this.rng() - 0.5) * 0.0003,
      baseConf: 0.94 + this.rng() * 0.05,
      depth: startY + 0.22,
      attributes: {
        upper: clothingUpper[uIdx],
        lower: clothingLower[lIdx],
        carrying: bagTypes[bIdx],
        speed: 'walking',
        direction: dir > 0 ? 'east' : 'west',
      },
      active: true,
      spawnTime: Date.now(),
    };

    // Designate first person to drop suitcase if not yet dropped
    if (!this.carrierEntityId && !this.suitcaseDropped) {
      this.carrierEntityId = trackId;
      person.attributes.carrying = 'suitcase';
    }

    this.entities.push(person);
    return person;
  }

  private spawnCar(startX: number, dir: 1 | -1): SimEntity {
    const colors = ['silver', 'black', 'white', 'slate grey'];
    const types = ['sedan', 'suv', 'compact'];
    const color = colors[Math.floor(this.rng() * colors.length)];
    const type = types[Math.floor(this.rng() * types.length)];

    const car: SimEntity = {
      trackId: this.createId(),
      classId: 'car',
      x: startX,
      y: 0.13,
      w: 0.16,
      h: 0.09,
      vx: dir * 0.006,
      vy: 0,
      baseConf: 0.96 + this.rng() * 0.03,
      depth: 0.22,
      attributes: {
        color,
        type,
        direction: dir > 0 ? 'east' : 'west',
        speed: 'moderate',
      },
      active: true,
      spawnTime: Date.now(),
    };

    this.entities.push(car);
    return car;
  }

  private spawnBicycle(startX: number, dir: 1 | -1): SimEntity {
    const bike: SimEntity = {
      trackId: this.createId(),
      classId: 'bicycle',
      x: startX,
      y: 0.75,
      w: 0.08,
      h: 0.14,
      vx: dir * 0.004,
      vy: 0,
      baseConf: 0.93 + this.rng() * 0.05,
      depth: 0.89,
      attributes: {
        color: 'silver',
        direction: dir > 0 ? 'east' : 'west',
        speed: 'cycling',
      },
      active: true,
      spawnTime: Date.now(),
    };

    this.entities.push(bike);
    return bike;
  }

  private scheduleNextTick(): void {
    this.animFrameId = requestAnimationFrame((timestamp) => {
      if (!this.isRunning || this.isPaused) return;

      const elapsed = timestamp - this.lastTick;
      if (elapsed >= 30) {
        this.lastTick = timestamp;
        this.tick();
      }

      this.scheduleNextTick();
    });
  }

  /**
   * Executes a single simulation step.
   * Exposed for deterministic testing with virtual time.
   */
  tick(customNow?: number): DetectionFrame {
    this.frameCount++;
    const now = customNow ?? Date.now();

    if (this.startTime === 0 || now < this.startTime) {
      this.startTime = now;
    }

    const elapsedSec = (now - this.startTime) / 1000;

    // Advance description generator step
    this.descSimulator.step(now);

    // 1. Maintain 3-7 people at all times.
    const activePeople = this.entities.filter((e) => e.active && e.classId === 'person');
    if (activePeople.length < 4) {
      const enterLeft = this.rng() > 0.5;
      const startX = enterLeft ? -0.06 : 1.02;
      const dir: 1 | -1 = enterLeft ? 1 : -1;
      const startY = 0.42 + this.rng() * 0.35;
      this.spawnPerson(startX, startY, dir);
    }

    // Occasional car
    const activeCars = this.entities.filter((e) => e.active && e.classId === 'car');
    if (activeCars.length === 0 && this.rng() < 0.05) {
      const enterLeft = this.rng() > 0.5;
      this.spawnCar(enterLeft ? -0.18 : 1.05, enterLeft ? 1 : -1);
    }

    // Occasional bicycle
    const activeBikes = this.entities.filter((e) => e.active && e.classId === 'bicycle');
    if (activeBikes.length === 0 && elapsedSec > 20 && this.rng() < 0.02) {
      this.spawnBicycle(-0.1, 1);
    }

    // Suitcase drop scenario:
    // A person in the midground drops a suitcase after ~15s into session
    if (!this.suitcaseDropped && elapsedSec >= 15) {
      const carrier = this.entities.find(
        (e) => e.active && e.classId === 'person' && e.x > 0.35 && e.x < 0.65
      );
      if (carrier) {
        this.suitcaseDropped = true;
        carrier.attributes.carrying = 'none';

        const suitcase: SimEntity = {
          trackId: this.createId(),
          classId: 'suitcase',
          x: Number((carrier.x + 0.02).toFixed(4)),
          y: Number((carrier.y + carrier.h - 0.06).toFixed(4)),
          w: 0.05,
          h: 0.07,
          vx: 0,
          vy: 0,
          baseConf: 0.95,
          depth: carrier.depth - 0.01,
          attributes: {
            color: 'black',
            attended: false,
          },
          active: true,
          spawnTime: now,
        };
        this.entities.push(suitcase);
      }
    }

    // Occasional temporary occlusion (person pauses behind pillar/kiosk for ~1.5s):
    // Triggers every ~25 seconds, lasting 1500ms (enough to exceed 1000ms lostTimeout and reacquire)
    if (now - this.lastOcclusionTriggerTime >= 25000 && activePeople.length >= 2) {
      this.lastOcclusionTriggerTime = now;
      const candidate = activePeople.find(
        (p) => p.x > 0.2 && p.x < 0.8 && (!p.occludedUntil || p.occludedUntil < now)
      );
      if (candidate) {
        candidate.occludedUntil = now + 1500; // 1.5s occlusion
      }
    }

    // 2. Update object kinematics and bounds
    for (const ent of this.entities) {
      if (!ent.active) continue;

      ent.x += ent.vx;
      ent.y += ent.vy;
      ent.depth = ent.y + ent.h;

      // Check if completely off-screen
      if (ent.x + ent.w < -0.15 || ent.x > 1.15) {
        ent.active = false; // Left frame completely
      }
    }

    // Remove inactive entities
    this.entities = this.entities.filter((e) => e.active);

    // 3. Occlusion calculation:
    // When two people overlap by >60% IoU, the one behind is occluded (suppressed from detections)
    const occludedIds = new Set<string>();
    const people = this.entities.filter((e) => e.classId === 'person');

    for (let i = 0; i < people.length; i++) {
      for (let j = i + 1; j < people.length; j++) {
        const p1 = people[i];
        const p2 = people[j];
        const iou = computeIoU(
          { x: p1.x, y: p1.y, w: p1.w, h: p1.h },
          { x: p2.x, y: p2.y, w: p2.w, h: p2.h }
        );

        if (iou > 0.6) {
          // The one with smaller depth is behind
          const behind = p1.depth < p2.depth ? p1 : p2;
          occludedIds.add(behind.trackId);
        }
      }
    }

    // Also suppress entities currently in temporary occlusion window
    for (const ent of this.entities) {
      if (ent.occludedUntil && now < ent.occludedUntil) {
        occludedIds.add(ent.trackId);
      }
    }

    // 4. Build detections with clipping and visible-area check
    const detections: RawDetection[] = [];

    for (const ent of this.entities) {
      if (!ent.active) continue;
      if (occludedIds.has(ent.trackId)) continue; // Suppressed by occlusion

      const origArea = ent.w * ent.h;
      if (origArea <= 0) continue;

      // Clip bounding box strictly to visible frame [0..1]
      const clipX = Math.max(0, ent.x);
      const clipY = Math.max(0, ent.y);
      const clipR = Math.min(1, ent.x + ent.w);
      const clipB = Math.min(1, ent.y + ent.h);

      const clipW = Math.max(0, clipR - clipX);
      const clipH = Math.max(0, clipB - clipY);
      const visibleArea = clipW * clipH;

      // If visible area < 30% of original box, do NOT emit
      if (visibleArea < 0.3 * origArea) {
        continue;
      }

      // Add small jitter for realism, clamped strictly to [0..1]
      const jitterX = (this.rng() - 0.5) * 0.002;
      const jitterY = (this.rng() - 0.5) * 0.002;
      const confNoise = (this.rng() - 0.5) * 0.03;

      const finalX = Math.max(0, Math.min(1 - clipW, Number((clipX + jitterX).toFixed(4))));
      const finalY = Math.max(0, Math.min(1 - clipH, Number((clipY + jitterY).toFixed(4))));
      const finalW = Math.max(0.01, Math.min(1 - finalX, Number(clipW.toFixed(4))));
      const finalH = Math.max(0.01, Math.min(1 - finalY, Number(clipH.toFixed(4))));

      const confidence = Math.max(
        0.5,
        Math.min(0.99, Number((ent.baseConf + confNoise).toFixed(3)))
      );

      const det: RawDetection = {
        trackId: ent.trackId,
        classId: ent.classId,
        confidence,
        bbox: {
          x: finalX,
          y: finalY,
          w: finalW,
          h: finalH,
        },
        attributes: { ...ent.attributes },
      };

      detections.push(det);

      // Async description schedule (only generates once per track or when attributes change)
      this.descSimulator.schedule(det, now);
    }

    const frame: DetectionFrame = {
      frameId: this.frameCount,
      ts: now,
      source: { width: 1280, height: 720 },
      detections,
      latencyMs: 14 + Math.floor(this.rng() * 5),
    };

    for (const listener of this.frameListeners) {
      listener(frame);
    }

    if (this.boundCanvas) {
      const ctx = this.boundCanvas.getContext('2d');
      if (ctx) {
        this.draw(ctx, this.boundCanvas.width, this.boundCanvas.height);
      }
    }

    return frame;
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.fillStyle = CANVAS_PALETTE.floorBg;
    ctx.fillRect(0, 0, width, height);

    const roadY = height * 0.1;
    const roadH = height * 0.18;
    ctx.fillStyle = CANVAS_PALETTE.roadBg;
    ctx.fillRect(0, roadY, width, roadH);

    ctx.strokeStyle = CANVAS_PALETTE.roadLine;
    ctx.lineWidth = 2;
    ctx.setLineDash([16, 16]);
    ctx.beginPath();
    ctx.moveTo(0, roadY + roadH / 2);
    ctx.lineTo(width, roadY + roadH / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = CANVAS_PALETTE.gridLine;
    ctx.lineWidth = 1;

    const startY = height * 0.32;
    const steps = 7;
    for (let i = 0; i <= steps; i++) {
      const y = startY + (i / steps) * (height - startY);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const vSteps = 10;
    for (let i = 0; i <= vSteps; i++) {
      const topX = width * 0.15 + (i / vSteps) * (width * 0.7);
      const bottomX = (i / vSteps) * width;
      ctx.beginPath();
      ctx.moveTo(topX, startY);
      ctx.lineTo(bottomX, height);
      ctx.stroke();
    }

    // Sort entities by depth for natural painter's occlusion
    const sorted = [...this.entities].sort((a, b) => a.depth - b.depth);

    for (const ent of sorted) {
      if (!ent.active) continue;

      const px = ent.x * width;
      const py = ent.y * height;
      const pw = ent.w * width;
      const ph = ent.h * height;

      if (ent.classId === 'car' || ent.classId === 'truck') {
        ctx.fillStyle = CANVAS_PALETTE.dropShadow;
        ctx.beginPath();
        ctx.roundRect(px, py + ph - 4, pw, 8, 4);
        ctx.fill();

        ctx.fillStyle = CANVAS_PALETTE.vehicleBody;
        ctx.beginPath();
        ctx.roundRect(px, py, pw, ph, 6);
        ctx.fill();

        ctx.fillStyle = CANVAS_PALETTE.vehicleWindow;
        ctx.beginPath();
        ctx.roundRect(px + pw * 0.25, py + ph * 0.15, pw * 0.5, ph * 0.7, 3);
        ctx.fill();
      } else if (ent.classId === 'person') {
        ctx.fillStyle = CANVAS_PALETTE.dropShadow;
        ctx.beginPath();
        ctx.ellipse(px + pw / 2, py + ph, pw * 0.5, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = CANVAS_PALETTE.personTorso;
        ctx.beginPath();
        ctx.roundRect(px + pw * 0.2, py + ph * 0.3, pw * 0.6, ph * 0.65, 4);
        ctx.fill();

        ctx.fillStyle = CANVAS_PALETTE.personHead;
        const headR = Math.min(pw * 0.3, ph * 0.18);
        ctx.beginPath();
        ctx.arc(px + pw / 2, py + headR + 2, headR, 0, Math.PI * 2);
        ctx.fill();

        if (ent.attributes.carrying && ent.attributes.carrying !== 'none') {
          ctx.fillStyle = CANVAS_PALETTE.personBag;
          ctx.beginPath();
          ctx.roundRect(px + pw * 0.1, py + ph * 0.45, pw * 0.25, ph * 0.25, 2);
          ctx.fill();
        }
      } else if (ent.classId === 'suitcase') {
        ctx.fillStyle = CANVAS_PALETTE.dropShadow;
        ctx.beginPath();
        ctx.ellipse(px + pw / 2, py + ph, pw * 0.45, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = CANVAS_PALETTE.suitcaseBody;
        ctx.beginPath();
        ctx.roundRect(px, py + ph * 0.2, pw, ph * 0.8, 3);
        ctx.fill();

        ctx.strokeStyle = CANVAS_PALETTE.suitcaseAccent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(px + pw * 0.3, py, pw * 0.4, ph * 0.25, [2, 2, 0, 0]);
        ctx.stroke();
      } else if (ent.classId === 'bicycle') {
        ctx.fillStyle = CANVAS_PALETTE.dropShadow;
        ctx.beginPath();
        ctx.ellipse(px + pw / 2, py + ph, pw * 0.4, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = CANVAS_PALETTE.personHead;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px + pw * 0.25, py + ph * 0.75, pw * 0.2, 0, Math.PI * 2);
        ctx.arc(px + pw * 0.75, py + ph * 0.75, pw * 0.2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
}
