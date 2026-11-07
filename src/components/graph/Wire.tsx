import React from 'react';
import { computeBezierWire, Point } from '@/lib/wireMath';

export type WireState = 'streaming' | 'idle' | 'error';

export interface WireProps {
  start: Point;
  end: Point;
  state?: WireState;
  orientation?: 'horizontal' | 'vertical';
  curvature?: number;
  className?: string;
}

export const Wire: React.FC<WireProps> = ({
  start,
  end,
  state = 'streaming',
  orientation = 'horizontal',
  curvature = 0.5,
  className = '',
}) => {
  const curve = computeBezierWire(start, end, orientation, curvature);

  // Bounding box for SVG container
  const minX = Math.min(start.x, end.x, curve.cp1.x, curve.cp2.x) - 10;
  const minY = Math.min(start.y, end.y, curve.cp1.y, curve.cp2.y) - 10;
  const maxX = Math.max(start.x, end.x, curve.cp1.x, curve.cp2.x) + 10;
  const maxY = Math.max(start.y, end.y, curve.cp1.y, curve.cp2.y) + 10;
  const width = Math.max(20, maxX - minX);
  const height = Math.max(20, maxY - minY);

  // SVG-local coordinates
  const localStart = { x: start.x - minX, y: start.y - minY };
  const localEnd = { x: end.x - minX, y: end.y - minY };
  const localCurve = computeBezierWire(localStart, localEnd, orientation, curvature);

  const strokeColor = {
    streaming: 'var(--accent)',
    idle: 'var(--line-2)',
    error: 'var(--red)',
  }[state];

  const strokeOpacity = {
    streaming: 0.7,
    idle: 1,
    error: 0.6,
  }[state];

  const portFill = {
    streaming: 'var(--accent-bright)',
    idle: 'var(--text-3)',
    error: 'var(--red)',
  }[state];

  return (
    <svg
      className={`absolute pointer-events-none overflow-visible ${className}`}
      style={{
        left: `${minX}px`,
        top: `${minY}px`,
        width: `${width}px`,
        height: `${height}px`,
      }}
      aria-hidden="true"
    >
      <defs>
        <filter id={`wire-glow-${state}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Main wire bezier path */}
      <path
        d={localCurve.path}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeOpacity={strokeOpacity}
        strokeLinecap="round"
        strokeDasharray={state === 'error' ? '4 4' : undefined}
      />

      {/* Start and end port dots */}
      <circle
        cx={localStart.x}
        cy={localStart.y}
        r="3"
        fill={portFill}
        stroke="var(--bg-1)"
        strokeWidth="2"
      />
      <circle
        cx={localEnd.x}
        cy={localEnd.y}
        r="3"
        fill={portFill}
        stroke="var(--bg-1)"
        strokeWidth="2"
      />

      {/* Traveling animated pulse dot (only in streaming state) */}
      {state === 'streaming' && (
        <circle r="2.5" fill="var(--accent-bright)" filter={`url(#wire-glow-${state})`}>
          <animateMotion
            path={localCurve.path}
            dur="1.6s"
            repeatCount="indefinite"
            keyPoints="0;1"
            keyTimes="0;1"
          />
        </circle>
      )}
    </svg>
  );
};
