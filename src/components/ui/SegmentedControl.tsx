import React from 'react';

export interface SegmentOption<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 28 | 32;
  disabled?: boolean;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 28,
  disabled = false,
  className = '',
}: SegmentedControlProps<T>) {
  const heightClass = size === 28 ? 'h-[28px]' : 'h-[32px]';

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (disabled) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (index + 1) % options.length;
      onChange(options[nextIndex].value);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (index - 1 + options.length) % options.length;
      onChange(options[prevIndex].value);
    }
  };

  return (
    <div
      role="radiogroup"
      className={`inline-flex items-center p-0.5 bg-bg-2 border border-line-1 rounded-[4px] select-none ${heightClass} ${
        disabled ? 'opacity-40 pointer-events-none' : ''
      } ${className}`}
    >
      {options.map((option, idx) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`h-full px-2.5 flex items-center justify-center gap-1.5 rounded-[2px] text-small font-normal transition-colors duration-fast focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan ${
              isSelected
                ? 'bg-bg-1 text-text-1 font-medium border border-line-2 shadow-sm'
                : 'text-text-2 hover:text-text-1 hover:bg-bg-3 border border-transparent'
            }`}
          >
            {option.icon && (
              <span className="w-3.5 h-3.5 flex items-center justify-center [&>svg]:w-3.5 [&>svg]:h-3.5">
                {option.icon}
              </span>
            )}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
