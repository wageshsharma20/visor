import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 28 | 32;

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
      size = 28,
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
      'inline-flex items-center justify-center gap-1.5 font-sans font-normal transition-colors duration-fast rounded-[4px] select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-1 focus-visible:ring-offset-bg-0 disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed';

    const sizeStyles = {
      28: 'h-[28px] px-2.5 text-body',
      32: 'h-[32px] px-3.5 text-body',
    }[size];

    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        'bg-cyan text-[#061014] font-medium hover:brightness-105 active:brightness-95 border border-cyan/20',
      secondary:
        'bg-bg-2 text-text-1 border border-line-2 hover:bg-bg-3 hover:border-line-1 active:bg-bg-1',
      ghost:
        'bg-transparent text-text-2 hover:text-text-1 hover:bg-bg-3 active:bg-bg-2 border border-transparent',
      danger:
        'bg-red/10 text-red border border-red/30 hover:bg-red hover:text-bg-0 active:bg-red/90',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseStyles} ${sizeStyles} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-current" />
        ) : icon ? (
          <span className="inline-flex items-center justify-center shrink-0 w-4 h-4">
            {icon}
          </span>
        ) : null}
        {children && <span>{children}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
