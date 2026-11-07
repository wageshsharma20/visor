import { DescriptionUpdate, RawDetection } from '@/types/detection';

/**
 * Builds a natural-language description from a detection's attributes and coordinates.
 */
export function generateDescription(
  classId: string,
  attributes: Record<string, string | number | boolean> = {},
  bbox?: { x: number; y: number; w: number; h: number }
): string {
  // Determine rough position in frame
  let positionDesc = 'in the scene';
  if (bbox) {
    const cx = bbox.x + bbox.w / 2;
    const cy = bbox.y + bbox.h / 2;

    const horiz =
      cx < 0.35 ? 'left side' : cx > 0.65 ? 'right side' : 'center';
    const vert =
      cy < 0.35 ? 'upper' : cy > 0.65 ? 'lower' : 'midground';

    positionDesc = `near the ${vert} ${horiz} of the frame`;
  }

  const upper = attributes.upper ? String(attributes.upper) : '';
  const lower = attributes.lower ? String(attributes.lower) : '';
  const carrying = attributes.carrying ? String(attributes.carrying) : '';
  const speed = attributes.speed ? String(attributes.speed) : 'moving';
  const direction = attributes.direction ? String(attributes.direction) : '';
  const color = attributes.color ? String(attributes.color) : 'dark';
  const vehicleType = attributes.type ? String(attributes.type) : classId;
  const attended = attributes.attended !== undefined ? attributes.attended : true;

  switch (classId.toLowerCase()) {
    case 'person': {
      const clothingParts: string[] = [];
      if (upper) clothingParts.push(`a ${upper}`);
      if (lower) clothingParts.push(lower);
      const clothingStr = clothingParts.length > 0 ? `in ${clothingParts.join(' and ')}` : '';

      const motionParts: string[] = [];
      if (speed) motionParts.push(speed);
      if (direction) motionParts.push(direction);
      const motionStr = motionParts.length > 0 ? motionParts.join(' ') : 'walking';

      const carryStr = carrying && carrying !== 'none' ? `, carrying a ${carrying}` : '';

      return `Person ${clothingStr} ${motionStr} ${positionDesc}${carryStr}.`.replace(
        /\s{2,}/g,
        ' '
      );
    }

    case 'car':
    case 'truck': {
      const dirStr = direction ? `heading ${direction}` : 'traveling along roadway';
      return `${color.charAt(0).toUpperCase() + color.slice(1)} ${vehicleType} ${dirStr} ${positionDesc}.`;
    }

    case 'suitcase':
    case 'backpack':
    case 'handbag': {
      const statusStr = attended ? 'attended' : 'unattended luggage';
      return `${color.charAt(0).toUpperCase() + color.slice(1)} ${classId} (${statusStr}) located ${positionDesc}.`;
    }

    case 'bicycle': {
      return `Bicycle ${positionDesc}, traveling ${direction || 'forward'}.`;
    }

    case 'dog': {
      return `Canine ${color ? `with ${color} coat` : ''} ${positionDesc}.`;
    }

    default:
      return `${classId.charAt(0).toUpperCase() + classId.slice(1)} detected ${positionDesc}.`;
  }
}

interface PendingDesc {
  det: RawDetection;
  readyAt: number;
  attrKey: string;
}

/**
 * Manages async scheduled simulated description generation.
 * Rules (Review finding 5):
 * Generate once per track (and once more only if attributes change), never on every frame.
 */
export class DescriptionSimulator {
  private readonly pendingDescriptions = new Map<string, PendingDesc>();
  private readonly generatedAttrKeys = new Map<string, string>();
  private readonly listeners = new Set<(d: DescriptionUpdate) => void>();
  private totalGeneratedCount = 0;
  private readonly minDelay: number;
  private readonly maxDelay: number;
  private rng: () => number;

  constructor(options: { minDelay?: number; maxDelay?: number; rng?: () => number } = {}) {
    this.minDelay = options.minDelay ?? 1500;
    this.maxDelay = options.maxDelay ?? 3000;
    this.rng = options.rng ?? Math.random;
  }

  setRng(rng: () => number): void {
    this.rng = rng;
  }

  subscribe(callback: (d: DescriptionUpdate) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  getTotalGeneratedCount(): number {
    return this.totalGeneratedCount;
  }

  schedule(detection: RawDetection, now: number = Date.now()): void {
    const trackId = detection.trackId;
    if (this.pendingDescriptions.has(trackId)) {
      return; // Already scheduled
    }

    const attrKey = JSON.stringify(detection.attributes ?? {});
    // If we already generated for this track with identical attributes, skip
    if (this.generatedAttrKeys.get(trackId) === attrKey) {
      return;
    }

    // Delay between minDelay and maxDelay (1.5s to 3s per spec)
    const spread = Math.max(0, this.maxDelay - this.minDelay);
    const delay = this.minDelay + (spread > 0 ? Math.floor(this.rng() * spread) : 0);

    this.pendingDescriptions.set(trackId, {
      det: {
        ...detection,
        bbox: { ...detection.bbox },
        attributes: { ...detection.attributes },
      },
      readyAt: now + delay,
      attrKey,
    });
  }

  /**
   * Advances simulation time and emits ready descriptions.
   */
  step(now: number = Date.now()): DescriptionUpdate[] {
    const readyUpdates: DescriptionUpdate[] = [];
    const completedIds: string[] = [];

    for (const [trackId, pending] of this.pendingDescriptions.entries()) {
      if (now >= pending.readyAt) {
        completedIds.push(trackId);
        this.generatedAttrKeys.set(trackId, pending.attrKey);
        this.totalGeneratedCount++;

        const text = generateDescription(
          pending.det.classId,
          pending.det.attributes,
          pending.det.bbox
        );

        const update: DescriptionUpdate = {
          trackId,
          text,
          ts: now,
        };

        readyUpdates.push(update);

        for (const listener of this.listeners) {
          listener(update);
        }
      }
    }

    for (const id of completedIds) {
      this.pendingDescriptions.delete(id);
    }

    return readyUpdates;
  }

  cancel(trackId: string): void {
    this.pendingDescriptions.delete(trackId);
  }

  clear(): void {
    this.pendingDescriptions.clear();
    this.generatedAttrKeys.clear();
    this.totalGeneratedCount = 0;
  }
}
