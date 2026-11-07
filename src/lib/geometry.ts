import { BBox } from '@/types/detection';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Computes the letterboxed/pillarboxed content rectangle for object-fit: contain.
 */
export function contentRect(
  containerW: number,
  containerH: number,
  sourceW: number,
  sourceH: number
): Rect {
  if (containerW <= 0 || containerH <= 0 || sourceW <= 0 || sourceH <= 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const scale = Math.min(containerW / sourceW, containerH / sourceH);
  const width = Math.round(sourceW * scale);
  const height = Math.round(sourceH * scale);
  const x = Math.round((containerW - width) / 2);
  const y = Math.round((containerH - height) / 2);

  return { x, y, width, height };
}

/**
 * Converts a normalized 0..1 bounding box to screen pixel coordinates
 * relative to the containing content rectangle. Supports horizontal mirroring.
 */
export function toScreen(
  bbox: BBox,
  rect: Rect,
  mirrored = false
): PixelRect {
  const normX = mirrored ? 1 - bbox.x - bbox.w : bbox.x;
  const x = rect.x + normX * rect.width;
  const y = rect.y + bbox.y * rect.height;
  const width = bbox.w * rect.width;
  const height = bbox.h * rect.height;

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height),
  };
}

export interface LabelTarget {
  id: string;
  bbox: BBox;
}

export interface LabelPosition {
  x: number;
  y: number;
  flippedInside: boolean;
}

/**
 * Resolves non-overlapping label coordinates for bounding boxes.
 * Default placement is directly above the top-left corner.
 * If close to the top edge (< 24px), the label flips inside the box.
 * If multiple labels collide, offsets are applied so labels stay legible.
 */
export function resolveLabelPositions(
  boxes: LabelTarget[],
  rect: Rect,
  chipH = 20,
  mirrored = false
): Map<string, LabelPosition> {
  const positions = new Map<string, LabelPosition>();
  const placedRects: Array<{ x: number; y: number; w: number; h: number }> = [];

  // Sort boxes from top to bottom so top labels take precedence
  const sorted = [...boxes].sort((a, b) => a.bbox.y - b.bbox.y);

  const estimatedLabelW = 84; // typical pill width with text
  const topEdgeThreshold = rect.y + 24;

  for (const item of sorted) {
    const screen = toScreen(item.bbox, rect, mirrored);

    let flippedInside = false;
    let labelX = screen.x;
    let labelY = screen.y - chipH - 2;

    // Flip inside box if too close to top edge
    if (labelY < topEdgeThreshold) {
      labelY = screen.y + 4;
      flippedInside = true;
    }

    // Clamp horizontally to stay inside the video content rect
    if (labelX + estimatedLabelW > rect.x + rect.width) {
      labelX = Math.max(rect.x, rect.x + rect.width - estimatedLabelW);
    }
    if (labelX < rect.x) {
      labelX = rect.x;
    }

    // Collision resolution against already placed labels
    let collision = true;
    let attempts = 0;
    while (collision && attempts < 5) {
      collision = false;
      for (const p of placedRects) {
        const overlapX =
          labelX < p.x + p.w && labelX + estimatedLabelW > p.x;
        const overlapY =
          labelY < p.y + p.h && labelY + chipH > p.y;

        if (overlapX && overlapY) {
          collision = true;
          // Offset downward by chip height + spacing
          labelY = p.y + p.h + 2;
          break;
        }
      }
      attempts++;
    }

    placedRects.push({
      x: labelX,
      y: labelY,
      w: estimatedLabelW,
      h: chipH,
    });

    positions.set(item.id, {
      x: Math.round(labelX),
      y: Math.round(labelY),
      flippedInside,
    });
  }

  return positions;
}

/**
 * Linearly interpolate between two bounding boxes for smooth animation.
 */
export function lerpBox(a: BBox, b: BBox, t: number): BBox {
  const clampedT = Math.max(0, Math.min(1, t));
  return {
    x: Number((a.x + (b.x - a.x) * clampedT).toFixed(5)),
    y: Number((a.y + (b.y - a.y) * clampedT).toFixed(5)),
    w: Number((a.w + (b.w - a.w) * clampedT).toFixed(5)),
    h: Number((a.h + (b.h - a.h) * clampedT).toFixed(5)),
  };
}
