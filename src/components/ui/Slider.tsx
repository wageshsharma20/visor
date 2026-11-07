import React, { useRef, useCallback } from 'react';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';

export interface SliderProps {
  variant?: 'default' | 'compact';
  surface?: 'card' | 'well';
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  label?: string;
  minLabel?: string;
  maxLabel?: string;
  formatValue?: (val: number) => string;
  disabled?: boolean;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  variant = 'default',
  surface = 'card',
  min = 0,
  max = 1,
  step = 0.05,
  value,
  onChange,
  label,
  minLabel,
  maxLabel,
  formatValue = (v) => `${(v * 100).toFixed(0)}%`,
  disabled = false,
  className = '',
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const trackBg = surface === 'well' ? 'bg-bg-4' : 'bg-bg-3';
  const transitionClass = prefersReducedMotion ? '' : 'transition-transform duration-fast';

  const updateValueFromPointer = useCallback(
    (clientX: number) => {
      if (!trackRef.current || disabled) return;
      const rect = trackRef.current.getBoundingClientRect();
      const thumbRadius = variant === 'compact' ? 8 : 10;
      const padLeft = variant === 'compact' ? 2 : 4;
      const trackLeft = rect.left;
      const railWidth = Math.max(1, rect.width - (padLeft + thumbRadius) * 2);
      // Map pointer position using the rail: (clientX - (trackLeft + padLeft + thumbRadius)) / railWidth
      const rawPct = (clientX - (trackLeft + padLeft + thumbRadius)) / railWidth;
      const clampedPct = Math.max(0, Math.min(1, rawPct));
      const rawVal = min + clampedPct * (max - min);
      const steppedVal = Math.round(rawVal / step) * step;
      const finalVal = Math.max(min, Math.min(max, Number(steppedVal.toFixed(4))));
      onChange(finalVal);
    },
    [disabled, max, min, onChange, step, variant]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateValueFromPointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (disabled || e.buttons !== 1) return;
    updateValueFromPointer(e.clientX);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    let next = value;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      next = Math.min(max, value + step);
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      next = Math.max(min, value - step);
      e.preventDefault();
    } else if (e.key === 'Home') {
      next = min;
      e.preventDefault();
    } else if (e.key === 'End') {
      next = max;
      e.preventDefault();
    }
    if (next !== value) {
      onChange(Number(next.toFixed(4)));
    }
  };

  if (variant === 'compact') {
    return (
      <div
        data-slider-compact-root
        className={`inline-flex items-center gap-2 select-none w-[164px] shrink-0 ${
          disabled ? 'opacity-40 pointer-events-none' : ''
        } ${className}`}
      >
        <div
          ref={trackRef}
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-label={label || 'Threshold'}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onKeyDown={handleKeyDown}
          className={`relative w-[120px] h-5 ${trackBg} rounded-full cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:shadow-focus shrink-0`}
        >
          {/* 1. Rail: left 2px, width: calc(100% - 4px - 16px) = calc(100% - 20px) */}
          <div
            data-slider-rail="compact"
            className="absolute top-0.5 bottom-0.5 left-0.5 pointer-events-none"
            style={{ width: 'calc(100% - 20px)' }}
          >
            {/* 2. Thumb carrier: same width as rail, translateX(P%) */}
            <div
              data-slider-carrier="compact"
              className={`relative w-full h-full ${transitionClass} pointer-events-none`}
              style={{ transform: `translateX(${percentage}%)` }}
            >
              {/* 3. Fill: full-width white pill, right at thumb center (8px) */}
              <div
                data-slider-fill="compact"
                className="absolute inset-y-0 bg-fill-white rounded-full pointer-events-none z-10"
                style={{
                  right: 'calc(100% - 8px)',
                  width: 'calc(100% + 16px)',
                }}
              />

              {/* 16px dark circle thumb at carrier left: 0 */}
              <div
                data-slider-thumb="compact"
                className="absolute top-0 left-0 w-4 h-4 rounded-full bg-bg-4 border border-line-2 pointer-events-none z-30"
              />
            </div>
          </div>
        </div>
        <span
          data-slider-readout
          className="font-mono text-data text-text-2 w-[36px] text-right shrink-0"
        >
          {formatValue(value)}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1.5 w-full select-none ${disabled ? 'opacity-40' : ''} ${className}`}>
      {label && (
        <div className="flex items-center justify-between text-label">
          <span className="text-text-2">{label}</span>
          <span className="font-mono text-data text-text-1">{formatValue(value)}</span>
        </div>
      )}

      <div
        ref={trackRef}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label || 'Threshold'}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onKeyDown={handleKeyDown}
        className={`relative w-full h-7 ${trackBg} rounded-full cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:shadow-focus`}
      >
        {/* Layer 1: Base min/max labels rendered on the track background in text-3 */}
        {(minLabel || maxLabel) && (
          <div
            data-slider-labels-base
            className="absolute inset-0 flex items-center justify-between px-7 text-small text-text-3 pointer-events-none select-none z-0"
          >
            <span data-slider-min-label>{minLabel}</span>
            <span data-slider-max-label>{maxLabel}</span>
          </div>
        )}

        {/* 1. Rail: left 4px, width: calc(100% - 8px - 20px) = calc(100% - 28px) */}
        <div
          data-slider-rail="default"
          className="absolute top-1 bottom-1 left-1 pointer-events-none"
          style={{ width: 'calc(100% - 28px)' }}
        >
          {/* 2. Thumb carrier: same width as rail, translateX(P%) */}
          <div
            data-slider-carrier="default"
            className={`relative w-full h-full ${transitionClass} pointer-events-none`}
            style={{ transform: `translateX(${percentage}%)` }}
          >
            {/* 3. Fill: full-width white pill, right at thumb center (10px) */}
            <div
              data-slider-fill="default"
              className="absolute inset-y-0 bg-fill-white rounded-full pointer-events-none z-10"
              style={{
                right: 'calc(100% - 10px)',
                width: 'calc(100% + 20px)',
              }}
            />

            {/* 4. On-white label layer: clipped to the fill with inverse translateX */}
            {(minLabel || maxLabel) && (
              <div
                data-slider-clip
                className="absolute inset-y-0 overflow-hidden pointer-events-none select-none z-20"
                style={{
                  right: 'calc(100% - 10px)',
                  width: 'calc(100% + 20px)',
                }}
              >
                <div
                  className={`absolute inset-y-0 ${transitionClass}`}
                  style={{
                    left: 'calc(100% - 10px)',
                    width: 'calc(100% - 20px)',
                    transform: `translateX(-${percentage}%)`,
                  }}
                >
                  <div
                    data-slider-labels-clipped
                    className="absolute inset-y-0 flex items-center justify-between px-7 text-small text-on-white font-medium"
                    style={{
                      left: '-4px',
                      width: 'calc(100% + 28px)',
                    }}
                  >
                    <span>{minLabel}</span>
                    <span>{maxLabel}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 20px dark circle thumb at carrier left: 0 */}
            <div
              data-slider-thumb="default"
              className="absolute top-0 left-0 w-5 h-5 rounded-full bg-bg-4 border border-line-2 pointer-events-none z-30"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
