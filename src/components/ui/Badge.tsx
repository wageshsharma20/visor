import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'cyan' | 'amber' | 'green' | 'red';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-bg-2 text-text-2 border-line-1',
    cyan: 'bg-cyan-dim text-cyan border-cyan/30',
    amber: 'bg-amber/15 text-amber border-amber/30',
    green: 'bg-green/15 text-green border-green/30',
    red: 'bg-red/15 text-red border-red/30',
  }[variant];

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 text-section font-mono uppercase tracking-wider rounded-[2px] border ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
