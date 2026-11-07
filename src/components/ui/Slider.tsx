import React, { useRef, useCallback } from 'react';

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

  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const trackBg = surface === 'well' ? 'bg-bg-4' : 'bg-bg-3';

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
          className={`relative w-[120px] h-5 ${trackBg} rounded-full cursor-pointer overflow-hidden p-0.5 focus-visible:outline-none focus-visible:shadow-focus`}
        >
          {/* White fill pill with transform: scaleX */}
          <div
            className="absolute inset-y-0.5 left-0.5 w-[calc(100%-4px)] bg-fill-white rounded-full origin-left transition-transform duration-fast pointer-events-none"
            style={{ transform: `scaleX(${percentage / 100})` }}
          />
          {/* Dark thumb with transform: translateX */}
          <div
            className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-bg-4 border border-line-2 origin-left transition-transform duration-fast pointer-events-none"
            style={{
              transform: `translateX(calc(${percentage}% - ${percentage / 100 * 16}px))`,
            }}
          />
        </div>
        <span className="font-mono text-data text-text-2 w-10 text-right shrink-0">
          {formatValue(value)}
        </span>
      </div>
    );
  }

  const scaleFactor = percentage > 0 ? 100 / percentage : 1;

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
          <div className="absolute inset-0 flex items-center justify-between px-3 text-small text-text-3 pointer-events-none select-none z-0">
            <span>{minLabel}</span>
            <span>{maxLabel}</span>
          </div>
        )}

        {/* Layer 2: White fill pill animated with scaleX */}
        <div
          className="absolute inset-y-1 left-1 w-[calc(100%-8px)] bg-fill-white rounded-full origin-left transition-transform duration-fast pointer-events-none z-10"
          style={{ transform: `scaleX(${percentage / 100})` }}
        />

        {/* Layer 3: Duplicate min/max labels clipped to the white fill in on-white color */}
        {(minLabel || maxLabel) && (
          <div
            className="absolute inset-y-1 left-1 w-[calc(100%-8px)] rounded-full overflow-hidden origin-left transition-transform duration-fast pointer-events-none select-none z-20"
            style={{ transform: `scaleX(${percentage / 100})` }}
          >
            <div
              className="w-full h-full flex items-center justify-between px-3 text-small text-on-white font-medium origin-left"
              style={{ transform: `scaleX(${scaleFactor})` }}
            >
              <span>{minLabel}</span>
              <span>{maxLabel}</span>
            </div>
          </div>
        )}

        {/* Layer 4: Dark 20px circle thumb animated with translateX */}
        <div
          className="absolute top-1 left-1 w-5 h-5 rounded-full bg-bg-4 border border-line-2 transition-transform duration-fast pointer-events-none z-30"
          style={{
            transform: `translateX(calc(${percentage}% - ${percentage / 100 * 20}px))`,
          }}
        />
      </div>
    </div>
  );
};
