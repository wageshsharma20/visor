import React from 'react';

export type PillVariant = 'visible' | 'lost' | 'flagged' | 'connected' | 'error' | 'rec' | 'neutral';

export interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: PillVariant;
  dot?: boolean;
  pulse?: boolean;
  children: React.ReactNode;
}

export const Pill: React.FC<PillProps> = ({
  variant = 'neutral',
  dot = false,
  pulse = false,
  children,
  className = '',
  ...props
}) => {
  const variantStyles: Record<PillVariant, { bg: string; text: string; border: string; dotColor: string }> = {
    visible: {
      bg: 'bg-cyan-dim',
      text: 'text-cyan',
      border: 'border-cyan/20',
      dotColor: 'bg-cyan',
    },
    lost: {
      bg: 'bg-text-3/15',
      text: 'text-text-3',
      border: 'border-text-3/30',
      dotColor: 'bg-text-3',
    },
    flagged: {
      bg: 'bg-amber/15',
      text: 'text-amber',
      border: 'border-amber/30',
      dotColor: 'bg-amber',
    },
    connected: {
      bg: 'bg-green/15',
      text: 'text-green',
      border: 'border-green/30',
      dotColor: 'bg-green',
    },
    error: {
      bg: 'bg-red/15',
      text: 'text-red',
      border: 'border-red/30',
      dotColor: 'bg-red',
    },
    rec: {
      bg: 'bg-red/15',
      text: 'text-red',
      border: 'border-red/30',
      dotColor: 'bg-red',
    },
    neutral: {
      bg: 'bg-bg-2',
      text: 'text-text-2',
      border: 'border-line-1',
      dotColor: 'bg-text-3',
    },
  };

  const current = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 h-[18px] px-1.5 font-mono text-hud uppercase tracking-wider rounded-[2px] border ${current.bg} ${current.text} ${current.border} ${className}`}
      {...props}
    >
      {(dot || variant === 'rec') && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${current.dotColor} ${
            pulse || variant === 'rec' ? 'animate-pulse' : ''
          }`}
        />
      )}
      <span>{children}</span>
    </span>
  );
};
