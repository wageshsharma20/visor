export interface Point {
  x: number;
  y: number;
}

export interface BezierCurve {
  path: string;
  start: Point;
  cp1: Point;
  cp2: Point;
  end: Point;
}

/**
 * Computes the exact center of a port element relative to the container element.
 * Properly accounts for container borders, scroll offsets, and bounding rects.
 */
export function computePortCenter(portEl: HTMLElement, containerEl: HTMLElement): Point {
  const portRect = portEl.getBoundingClientRect();
  const contRect = containerEl.getBoundingClientRect();

  // Container border offsets (clientLeft / clientTop)
  const borderLeft = containerEl.clientLeft || 0;
  const borderTop = containerEl.clientTop || 0;

  const x =
    portRect.left +
    portRect.width / 2 -
    (contRect.left + borderLeft) +
    containerEl.scrollLeft;

  const y =
    portRect.top +
    portRect.height / 2 -
    (contRect.top + borderTop) +
    containerEl.scrollTop;

  return {
    x: Math.round(x * 10) / 10,
    y: Math.round(y * 10) / 10,
  };
}

/**
 * Computes Euclidean distance between two points.
 */
export function computeDistance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/**
 * Computes a cubic bezier wire between two points.
 * Orientation can be 'horizontal', 'vertical', or 'auto' (inferred from coordinates).
 */
export function computeBezierWire(
  start: Point,
  end: Point,
  orientation: 'horizontal' | 'vertical' | 'auto' = 'horizontal',
  curvature = 0.5
): BezierCurve {
  const actualOrientation =
    orientation === 'auto'
      ? Math.abs(end.x - start.x) >= Math.abs(end.y - start.y)
        ? 'horizontal'
        : 'vertical'
      : orientation;

  let cp1: Point;
  let cp2: Point;

  if (actualOrientation === 'horizontal') {
    const deltaX = Math.max(20, Math.abs(end.x - start.x) * curvature);
    cp1 = { x: start.x + deltaX, y: start.y };
    cp2 = { x: end.x - deltaX, y: end.y };
  } else {
    const deltaY = Math.max(20, Math.abs(end.y - start.y) * curvature);
    cp1 = { x: start.x, y: start.y + deltaY };
    cp2 = { x: end.x, y: end.y - deltaY };
  }

  const path = `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;

  return {
    path,
    start,
    cp1,
    cp2,
    end,
  };
}
