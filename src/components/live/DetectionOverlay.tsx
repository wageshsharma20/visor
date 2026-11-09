import React, { useEffect, useRef, useState } from 'react';
import { contentRect, toScreen, Rect } from '@/lib/geometry';
import { useDetectionStore } from '@/stores/detectionStore';
import { useUiStore } from '@/stores/uiStore';

export interface DetectionOverlayProps {
  sourceWidth: number;
  sourceHeight: number;
  mirrored?: boolean;
}

/**
 * Draws tracked objects over the viewport. Normalized boxes are converted to
 * screen space only through lib/geometry. Subscribes with narrow selectors.
 */
export const DetectionOverlay: React.FC<DetectionOverlayProps> = ({
  sourceWidth,
  sourceHeight,
  mirrored = false,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [rect, setRect] = useState<Rect>({ x: 0, y: 0, width: 0, height: 0 });

  const tracks = useDetectionStore((s) => s.visibleTracks);
  const showBoxes = useUiStore((s) => s.showBoxes);
  const selectedId = useUiStore((s) => s.selectedTrackId);
  const setSelected = useUiStore((s) => s.setSelectedTrackId);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () =>
      setRect(contentRect(el.clientWidth, el.clientHeight, sourceWidth, sourceHeight));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [sourceWidth, sourceHeight]);

  return (
    <div ref={ref} className="absolute inset-0 z-10 pointer-events-none" aria-hidden={!showBoxes}>
      {showBoxes &&
        rect.width > 0 &&
        tracks.map((t) => {
          const box = toScreen(t.bbox, rect, mirrored);
          const selected = t.id === selectedId;
          const tone = t.flagged ? 'border-amber' : selected ? 'border-text-1' : 'border-accent';
          const chip = t.flagged
            ? 'bg-amber text-bg-0'
            : selected
              ? 'bg-fill-white text-on-white'
              : 'bg-accent text-on-accent';
          const labelBelow = box.y < 22;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelected(selected ? null : t.id)}
              aria-label={`${t.label} ${t.displayId}, ${Math.round(t.confidence * 100)}%`}
              className={`absolute pointer-events-auto rounded-chip border ${tone} ${
                selected ? 'border-2' : ''
              } transition-[transform,opacity] duration-fast focus-visible:outline-none focus-visible:shadow-focus`}
              style={{
                transform: `translate(${box.x}px, ${box.y}px)`,
                width: box.width,
                height: box.height,
                left: 0,
                top: 0,
              }}
            >
              <span
                className={`absolute left-[-1px] ${
                  labelBelow ? 'top-full mt-1' : 'bottom-full mb-1'
                } whitespace-nowrap px-1.5 py-px rounded-chip font-mono text-hud ${chip}`}
              >
                {t.label.toUpperCase()} {Math.round(t.confidence * 100)}%
              </span>
            </button>
          );
        })}
    </div>
  );
};
