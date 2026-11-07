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

export function computeBezierWire(
  start: Point,
  end: Point,
  orientation: 'horizontal' | 'vertical' = 'horizontal',
  curvature = 0.5
): BezierCurve {
  let cp1: Point;
  let cp2: Point;

  if (orientation === 'horizontal') {
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
