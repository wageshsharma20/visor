import React from 'react';

export type StatusDotState = 'live' | 'idle' | 'warning' | 'error';

export interface StatusDotProps {
  state?: StatusDotState;
  pulse?: boolean;
  className?: string;
}

export const StatusDot = React.forwardRef<HTMLSpanElement, StatusDotProps>(
  (
    {
      state = 'live',
      pulse = false,
      className = '',
    },
    ref
  ) => {
    const stateStyles: Record<StatusDotState, string> = {
      live: 'bg-accent-bright shadow-glow-accent',
      idle: 'bg-text-3',
      warning: 'bg-amber',
      error: 'bg-red',
    };

    return (
      <span
        ref={ref}
        className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${stateStyles[state]} ${
          pulse ? 'animate-pulse' : ''
        } ${className}`}
        aria-hidden="true"
      />
    );
  }
);

StatusDot.displayName = 'StatusDot';
