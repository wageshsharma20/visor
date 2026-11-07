import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 32 | 36;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 32,
      loading = false,
      disabled = false,
      icon,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 font-sans text-body-strong transition-colors duration-fast rounded-control select-none focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed';

    const sizeStyles = {
      32: 'h-8 px-3 text-body-strong',
      36: 'h-9 px-3.5 text-body-strong',
    }[size];

    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        'bg-fill-white text-on-white hover:brightness-105 active:brightness-95 border border-transparent',
      accent:
        'bg-accent text-on-accent hover:brightness-105 active:brightness-95 border border-transparent shadow-glow-accent',
      secondary:
        'bg-bg-3 text-text-1 border border-line-2 hover:bg-bg-4 hover:border-line-1 active:bg-bg-2',
      ghost:
        'bg-transparent text-text-2 hover:text-text-1 hover:bg-bg-3 active:bg-bg-2 border border-transparent',
      danger:
        'bg-red/12 text-red border border-red/30 hover:bg-red hover:text-bg-0 active:bg-red/90',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseStyles} ${sizeStyles} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : icon ? (
          <span className="inline-flex items-center justify-center shrink-0 w-4 h-4 [&>svg]:w-4 [&>svg]:h-4 [&>svg]:stroke-[1.75]">
            {icon}
          </span>
        ) : null}
        {children && <span>{children}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
