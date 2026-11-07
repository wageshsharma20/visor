import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'accent' | 'amber' | 'red';
  children: React.ReactNode;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'default',
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      default: 'bg-bg-3 text-text-2 border-line-2',
      accent: 'bg-accent-dim text-accent-bright border-accent/30',
      amber: 'bg-amber/15 text-amber border-amber/30',
      red: 'bg-red/15 text-red border-red/30',
    }[variant];

    return (
      <span
        ref={ref}
        className={`inline-flex items-center px-2 py-0.5 text-data font-mono uppercase tracking-wider rounded-chip border ${variantStyles} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
