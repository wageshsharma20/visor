import React from 'react';

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export const Kbd: React.FC<KbdProps> = ({ children, className = '', ...props }) => {
  return (
    <kbd
      className={`inline-flex items-center justify-center font-mono text-hud uppercase px-1 py-0.5 min-w-[16px] text-text-2 bg-bg-2 border border-line-2 rounded-[2px] select-none ${className}`}
      {...props}
    >
      {children}
    </kbd>
  );
};
