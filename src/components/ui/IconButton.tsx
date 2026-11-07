import React from 'react';
import { Tooltip } from './Tooltip';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  active?: boolean;
  activeVariant?: 'steel' | 'accent';
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right';
  size?: 32 | 36;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      label,
      shortcut,
      active = false,
      activeVariant = 'steel',
      tooltipSide = 'top',
      size = 32,
      disabled = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const sizeClasses = size === 32 ? 'w-8 h-8' : 'w-9 h-9';

    const activeStyles = {
      steel: 'bg-steel text-on-white hover:brightness-105',
      accent: 'bg-accent text-on-accent shadow-glow-accent',
    }[activeVariant];

    const stateClasses = active
      ? activeStyles
      : 'text-icon-dim hover:text-text-1 hover:bg-bg-3 active:bg-bg-4';

    return (
      <Tooltip content={label} shortcut={shortcut} side={tooltipSide} disabled={disabled}>
        <button
          ref={ref}
          type="button"
          aria-label={label}
          aria-pressed={active}
          disabled={disabled}
          className={`inline-flex items-center justify-center rounded-control transition-colors duration-fast select-none focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-40 disabled:pointer-events-none ${sizeClasses} ${stateClasses} ${className}`}
          {...props}
        >
          <span className="w-4 h-4 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4 [&>svg]:stroke-[1.75]">
            {icon}
          </span>
        </button>
      </Tooltip>
    );
  }
);

IconButton.displayName = 'IconButton';
