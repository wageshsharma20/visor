import React from 'react';

export type PillVariant =
  | 'visible'
  | 'lost'
  | 'exited'
  | 'flagged'
  | 'rec'
  | 'neutral'
  | 'simulated'
  | 'demo';

export interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: PillVariant;
  dot?: boolean;
  pulse?: boolean;
  children: React.ReactNode;
}

export const Pill = React.forwardRef<HTMLSpanElement, PillProps>(
  (
    {
      variant = 'neutral',
      dot = false,
      pulse = false,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
  const variantStyles: Record<PillVariant, { bg: string; text: string; border: string; dotColor: string }> = {
    visible: {
      bg: 'bg-accent-dim',
      text: 'text-accent-bright',
      border: 'border-accent/20',
      dotColor: 'bg-accent-bright shadow-glow-accent',
    },
    lost: {
      bg: 'bg-text-3/15',
      text: 'text-text-3',
      border: 'border-text-3/30',
      dotColor: 'bg-text-3',
    },
    exited: {
      bg: 'bg-bg-4',
      text: 'text-icon-dim',
      border: 'border-line-2',
      dotColor: 'bg-icon-dim',
    },
    flagged: {
      bg: 'bg-amber/15',
      text: 'text-amber',
      border: 'border-amber/30',
      dotColor: 'bg-amber',
    },
    rec: {
      bg: 'bg-red/15',
      text: 'text-red',
      border: 'border-red/30',
      dotColor: 'bg-red',
    },
    neutral: {
      bg: 'bg-bg-3',
      text: 'text-text-2',
      border: 'border-line-2',
      dotColor: 'bg-text-3',
    },
    simulated: {
      bg: 'bg-amber/15',
      text: 'text-amber',
      border: 'border-amber/30',
      dotColor: 'bg-amber',
    },
    demo: {
      bg: 'bg-amber/15',
      text: 'text-amber',
      border: 'border-amber/30',
      dotColor: 'bg-amber',
    },
  };

  const current = variantStyles[variant];

  return (
    <span
      ref={ref}
      className={`inline-flex items-center gap-1.5 h-5 px-2 font-sans text-small uppercase font-medium tracking-wider rounded-full border ${current.bg} ${current.text} ${current.border} ${className}`}
      {...props}
    >
      {(dot || variant === 'rec') && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${current.dotColor} ${
            pulse || variant === 'rec' ? 'animate-pulse' : ''
          }`}
        />
      )}
      <span>{children}</span>
    </span>
  );
});

Pill.displayName = 'Pill';
