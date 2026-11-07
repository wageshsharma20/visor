import React from 'react';

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export const Kbd: React.FC<KbdProps> = ({ children, className = '', ...props }) => {
  return (
    <kbd
      className={`inline-flex items-center justify-center font-mono text-data uppercase px-1.5 py-0.5 min-w-[18px] text-text-2 bg-bg-3 border border-line-2 rounded-chip select-none ${className}`}
      {...props}
    >
      {children}
    </kbd>
  );
};
