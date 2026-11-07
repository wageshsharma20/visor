import React, { useRef, useCallback } from 'react';

export interface SliderProps {
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  label?: string;
  formatValue?: (val: number) => string;
  disabled?: boolean;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  min = 0,
  max = 1,
  step = 0.05,
  value,
  onChange,
  label,
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

  return (
    <div className={`flex items-center gap-3 select-none ${disabled ? 'opacity-40' : ''} ${className}`}>
      {label && (
        <span className="font-mono text-section uppercase text-text-3 shrink-0">
          {label}
        </span>
      )}
      <div
        ref={trackRef}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label || 'Confidence threshold'}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onKeyDown={handleKeyDown}
        className="relative flex-1 h-6 flex items-center cursor-pointer outline-none group focus-visible:ring-1 focus-visible:ring-cyan rounded-[2px]"
      >
        {/* Track background */}
        <div className="w-full h-[2px] bg-line-2 relative overflow-hidden rounded-[1px]">
          {/* Active fill */}
          <div
            className="h-full bg-cyan transition-[width] duration-fast"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* 10px square thumb with 2px radius per DESIGN.md §8 */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-cyan border border-bg-0 rounded-[2px] shadow-sm transition-transform duration-fast group-hover:scale-110"
          style={{ left: `calc(${percentage}% - 5px)` }}
        />
      </div>

      <span className="font-mono text-data text-text-1 w-12 text-right shrink-0">
        {formatValue(value)}
      </span>
    </div>
  );
};
