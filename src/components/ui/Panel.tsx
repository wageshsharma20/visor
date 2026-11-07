import React from 'react';

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-bg-1 border border-line-1 flex flex-col relative overflow-hidden ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Panel.displayName = 'Panel';
