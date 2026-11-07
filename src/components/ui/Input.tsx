import React from 'react';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  size?: 28 | 32;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      size = 32,
      leftIcon,
      rightElement,
      disabled = false,
      id,
      className = '',
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const heightClass = size === 28 ? 'h-[28px]' : 'h-[32px]';

    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="font-mono text-section uppercase tracking-wider text-text-3 select-none flex items-center justify-between"
          >
            <span>{label}</span>
          </label>
        )}
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-2.5 flex items-center pointer-events-none text-text-3 [&>svg]:w-3.5 [&>svg]:h-3.5">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className={`w-full bg-bg-2 border ${
              error ? 'border-red/60 focus:border-red' : 'border-line-2 focus:border-cyan/60'
            } text-text-1 placeholder:text-text-3 text-body rounded-[4px] px-2.5 transition-colors duration-fast focus:outline-none focus:ring-1 ${
              error ? 'focus:ring-red' : 'focus:ring-cyan'
            } disabled:opacity-40 disabled:cursor-not-allowed ${
              leftIcon ? 'pl-8' : ''
            } ${rightElement ? 'pr-8' : ''} ${heightClass} ${className}`}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-2 flex items-center">{rightElement}</div>
          )}
        </div>
        {error && (
          <div
            id={`${inputId}-error`}
            className="flex items-center gap-1 text-small text-red mt-0.5"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
