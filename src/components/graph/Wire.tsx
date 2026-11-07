import React, { useEffect, useId } from 'react';
import {
  useGraphContext,
  WireState,
  WireOrientation,
} from './GraphContext';
import { computeBezierWire, Point } from '@/lib/wireMath';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';

export type { WireState, WireOrientation };

export interface WireProps {
  from?: string;
  to?: string;
  start?: Point;
  end?: Point;
  state?: WireState;
  orientation?: WireOrientation;
  curvature?: number;
  className?: string;
}

export const Wire: React.FC<WireProps> = ({
  from,
  to,
  start,
  end,
  state = 'streaming',
  orientation = 'auto',
  curvature = 0.5,
  className = '',
}) => {
  const generatedId = useId();
  const filterId = useId().replace(/:/g, '');
  const context = useGraphContext();
  const registerWire = context?.registerWire;
  const prefersReducedMotion = usePrefersReducedMotion();

  // If inside GraphCanvas and using port IDs, register with GraphCanvas
  useEffect(() => {
    if (registerWire && from && to) {
      return registerWire({
        id: generatedId,
        from,
        to,
        state,
        orientation,
        curvature,
        filterId: `wire-filter-${filterId}`,
        className,
      });
    }
  }, [registerWire, from, to, state, orientation, curvature, filterId, className, generatedId]);

  // If inside GraphCanvas with from/to, GraphCanvas renders the SVG layer!
  if (context && from && to) {
    return null;
  }

  // Standalone fallback when start and end coordinates are passed
  if (!start || !end) return null;

  const curve = computeBezierWire(start, end, orientation, curvature);

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
      className={`absolute inset-0 w-full h-full pointer-events-none overflow-visible ${className}`}
      aria-hidden="true"
    >
      <defs>
        <filter id={`wire-pulse-glow-${filterId}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <path
        d={curve.path}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeOpacity={strokeOpacity}
        strokeLinecap="round"
        strokeDasharray={state === 'error' ? '4 4' : undefined}
      />

      <circle
        cx={start.x}
        cy={start.y}
        r="3"
        fill={portFill}
        stroke="var(--bg-1)"
        strokeWidth="2"
      />
      <circle
        cx={end.x}
        cy={end.y}
        r="3"
        fill={portFill}
        stroke="var(--bg-1)"
        strokeWidth="2"
      />

      {state === 'streaming' && !prefersReducedMotion && (
        <circle r="2.5" fill="var(--accent-bright)" filter={`url(#wire-pulse-glow-${filterId})`}>
          <animateMotion
            path={curve.path}
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
