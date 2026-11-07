import React, {
  useState,
  useRef,
  useCallback,
  useLayoutEffect,
  useEffect,
  useMemo,
  useId,
} from 'react';
import { computeBezierWire, computePortCenter, Point } from '@/lib/wireMath';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import {
  GraphContext,
  WireDescriptor,
} from './GraphContext';

export type { WireState, PortState, WireOrientation, WireDescriptor } from './GraphContext';

export interface GraphCanvasProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  children,
  className = '',
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const portsRegistry = useRef<Map<string, HTMLElement>>(new Map());
  const [portPositions, setPortPositions] = useState<Record<string, Point>>({});
  const [wires, setWires] = useState<WireDescriptor[]>([]);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });

  const prefersReducedMotion = usePrefersReducedMotion();
  const filterPrefix = useId().replace(/:/g, '');

  // Measure all registered ports relative to container
  const measurePorts = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    setCanvasDimensions((prev) => {
      if (prev.width === rect.width && prev.height === rect.height) return prev;
      return { width: rect.width, height: rect.height };
    });

    const newPositions: Record<string, Point> = {};
    portsRegistry.current.forEach((element, id) => {
      newPositions[id] = computePortCenter(element, container);
    });

    setPortPositions((prev) => {
      const prevKeys = Object.keys(prev);
      const newKeys = Object.keys(newPositions);
      if (prevKeys.length !== newKeys.length) return newPositions;
      for (const k of newKeys) {
        if (!prev[k] || prev[k].x !== newPositions[k].x || prev[k].y !== newPositions[k].y) {
          return newPositions;
        }
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    setContainerEl(containerRef.current);
  }, []);

  // ResizeObserver on the container element and on window
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    measurePorts();

    const ro = new ResizeObserver(() => {
      measurePorts();
    });

    ro.observe(container);
    window.addEventListener('resize', measurePorts);
    window.addEventListener('scroll', measurePorts, true);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measurePorts);
      window.removeEventListener('scroll', measurePorts, true);
    };
  }, [measurePorts]);

  const registerPort = useCallback(
    (id: string, element: HTMLElement) => {
      portsRegistry.current.set(id, element);

      // Observe this specific port element for layout changes
      const ro = new ResizeObserver(() => {
        measurePorts();
      });
      ro.observe(element);

      // Measure immediately on next tick / animation frame
      measurePorts();

      return () => {
        ro.disconnect();
        portsRegistry.current.delete(id);
        measurePorts();
      };
    },
    [measurePorts]
  );

  const registerWire = useCallback((wire: WireDescriptor) => {
    setWires((prev) => {
      const idx = prev.findIndex((w) => w.id === wire.id);
      if (idx !== -1) {
        const existing = prev[idx];
        if (
          existing.from === wire.from &&
          existing.to === wire.to &&
          existing.state === wire.state &&
          existing.orientation === wire.orientation &&
          existing.curvature === wire.curvature &&
          existing.filterId === wire.filterId &&
          existing.className === wire.className
        ) {
          return prev;
        }
        const updated = [...prev];
        updated[idx] = wire;
        return updated;
      }
      return [...prev, wire];
    });

    return () => {
      setWires((prev) => prev.filter((w) => w.id !== wire.id));
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      registerPort,
      registerWire,
      containerElement: containerEl,
    }),
    [registerPort, registerWire, containerEl]
  );

  return (
    <GraphContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        data-graph-canvas="true"
        className={`relative overflow-visible ${className}`}
        {...props}
      >
        {/* ONE absolutely-positioned SVG layer for all wires per DESIGN.md §4 */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0"
          width={canvasDimensions.width || '100%'}
          height={canvasDimensions.height || '100%'}
          aria-hidden="true"
        >
          <defs>
            {wires.map((wire, idx) => {
              const fId = wire.filterId || `wire-filter-${filterPrefix}-${idx}`;
              return (
                <filter
                  key={fId}
                  id={fId}
                  x="-30%"
                  y="-30%"
                  width="160%"
                  height="160%"
                >
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              );
            })}
          </defs>

          {wires.map((wire, idx) => {
            const start = portPositions[wire.from];
            const end = portPositions[wire.to];
            if (!start || !end) return null;

            const curve = computeBezierWire(
              start,
              end,
              wire.orientation || 'auto',
              wire.curvature ?? 0.5
            );

            const state = wire.state || 'streaming';
            const fId = wire.filterId || `wire-filter-${filterPrefix}-${idx}`;

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
              <g key={wire.id} className={wire.className || ''}>
                {/* Main wire bezier stroke */}
                <path
                  d={curve.path}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="1.5"
                  strokeOpacity={strokeOpacity}
                  strokeLinecap="round"
                  strokeDasharray={state === 'error' ? '4 4' : undefined}
                  data-wire-id={wire.id}
                  data-wire-from={wire.from}
                  data-wire-to={wire.to}
                  data-start-x={start.x}
                  data-start-y={start.y}
                  data-end-x={end.x}
                  data-end-y={end.y}
                />

                {/* Exact Port Dots at wire endpoints */}
                <circle
                  cx={start.x}
                  cy={start.y}
                  r="3"
                  fill={portFill}
                  stroke="var(--bg-1)"
                  strokeWidth="2"
                  data-endpoint-port={wire.from}
                />
                <circle
                  cx={end.x}
                  cy={end.y}
                  r="3"
                  fill={portFill}
                  stroke="var(--bg-1)"
                  strokeWidth="2"
                  data-endpoint-port={wire.to}
                />

                {/* Animated traveling pulse dot: only if streaming AND !prefersReducedMotion */}
                {state === 'streaming' && !prefersReducedMotion && (
                  <circle
                    r="2.5"
                    fill="var(--accent-bright)"
                    filter={`url(#${fId})`}
                    data-wire-pulse="true"
                  >
                    <animateMotion
                      path={curve.path}
                      dur="1.6s"
                      repeatCount="indefinite"
                      keyPoints="0;1"
                      keyTimes="0;1"
                    />
                  </circle>
                )}
              </g>
            );
          })}
        </svg>

        {/* DOM content rendered on top of the SVG wire layer */}
        <div className="relative z-10 w-full h-full overflow-visible">
          {children}
        </div>
      </div>
    </GraphContext.Provider>
  );
};
