import React from 'react';
import { Tooltip } from './Tooltip';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  active?: boolean;
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right';
  size?: 28 | 32;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      label,
      shortcut,
      active = false,
      tooltipSide = 'top',
      size = 28,
      disabled = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const sizeClasses = size === 28 ? 'w-[28px] h-[28px]' : 'w-[32px] h-[32px]';

    const stateClasses = active
      ? 'bg-cyan-dim text-cyan border border-cyan/40 hover:bg-cyan-dim/80'
      : 'text-text-2 hover:text-text-1 hover:bg-bg-3 border border-transparent active:bg-bg-2';

    return (
      <Tooltip content={label} shortcut={shortcut} side={tooltipSide} disabled={disabled}>
        <button
          ref={ref}
          type="button"
          aria-label={label}
          aria-pressed={active}
          disabled={disabled}
          className={`inline-flex items-center justify-center rounded-[4px] transition-colors duration-fast select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-1 focus-visible:ring-offset-bg-0 disabled:opacity-40 disabled:pointer-events-none ${sizeClasses} ${stateClasses} ${className}`}
          {...props}
        >
          <span className="w-4 h-4 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4 [&>svg]:stroke-[1.5]">
            {icon}
          </span>
        </button>
      </Tooltip>
    );
  }
);

IconButton.displayName = 'IconButton';
