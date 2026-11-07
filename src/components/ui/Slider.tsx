import React, { useRef, useCallback } from 'react';

export interface SliderProps {
  variant?: 'default' | 'compact';
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

  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  const updateValueFromPointer = useCallback(
    (clientX: number) => {
      if (!trackRef.current || disabled) return;
      const rect = trackRef.current.getBoundingClientRect();
      const rawPct = (clientX - rect.left) / rect.width;
      const clampedPct = Math.max(0, Math.min(1, rawPct));
      const rawVal = min + clampedPct * (max - min);
      const steppedVal = Math.round(rawVal / step) * step;
      const finalVal = Math.max(min, Math.min(max, Number(steppedVal.toFixed(4))));
      onChange(finalVal);
    },
    [disabled, max, min, onChange, step]
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
        className={`inline-flex items-center gap-2 select-none ${
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
          className="relative w-[120px] h-5 bg-bg-3 rounded-full cursor-pointer overflow-hidden p-0.5 focus-visible:outline-none focus-visible:shadow-focus"
        >
          {/* White fill pill */}
          <div
            className="h-full bg-fill-white rounded-full transition-[width] duration-fast relative flex items-center justify-end"
            style={{ width: `${Math.max(12, percentage)}%` }}
          >
            {/* Dark thumb inside fill */}
            <div className="w-3.5 h-3.5 rounded-full bg-bg-4 border border-line-2 shrink-0 mr-0.5" />
          </div>
        </div>
        <span className="font-mono text-data text-text-2 w-10 text-right shrink-0">
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
        className="relative w-full h-7 bg-bg-3 rounded-full cursor-pointer flex items-center justify-between px-2.5 overflow-hidden focus-visible:outline-none focus-visible:shadow-focus"
      >
        {/* Background Min/Max labels */}
        {minLabel && <span className="text-small text-text-3 z-10 pointer-events-none">{minLabel}</span>}
        {maxLabel && <span className="text-small text-text-3 z-10 pointer-events-none">{maxLabel}</span>}

        {/* White fill pill */}
        <div
          className="absolute inset-y-1 left-1 bg-fill-white rounded-full transition-[width] duration-fast flex items-center justify-end pr-0.5 pointer-events-none"
          style={{ width: `calc(${percentage}% - 8px)` }}
        >
          {/* Dark thumb circle at end */}
          <div className="w-5 h-5 rounded-full bg-bg-4 border border-line-2 shrink-0" />
        </div>
      </div>
    </div>
  );
};
