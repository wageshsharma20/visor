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

/**
 * Manages async scheduled simulated description generation.
 */
export class DescriptionSimulator {
  private readonly pendingTimeouts = new Map<string, number>();
  private readonly listeners = new Set<(d: DescriptionUpdate) => void>();

  subscribe(callback: (d: DescriptionUpdate) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  schedule(detection: RawDetection): void {
    if (this.pendingTimeouts.has(detection.trackId)) {
      return; // Already pending
    }

    // 1500ms to 3000ms delay per spec
    const delay = 1500 + Math.floor(Math.random() * 1500);

    const timeoutId = window.setTimeout(() => {
      this.pendingTimeouts.delete(detection.trackId);
      const text = generateDescription(
        detection.classId,
        detection.attributes,
        detection.bbox
      );

      const update: DescriptionUpdate = {
        trackId: detection.trackId,
        text,
        ts: Date.now(),
      };

      for (const listener of this.listeners) {
        listener(update);
      }
    }, delay);

    this.pendingTimeouts.set(detection.trackId, timeoutId);
  }

  cancel(trackId: string): void {
    const tid = this.pendingTimeouts.get(trackId);
    if (tid !== undefined) {
      window.clearTimeout(tid);
      this.pendingTimeouts.delete(trackId);
    }
  }

  clear(): void {
    for (const tid of this.pendingTimeouts.values()) {
      window.clearTimeout(tid);
    }
    this.pendingTimeouts.clear();
  }
}
