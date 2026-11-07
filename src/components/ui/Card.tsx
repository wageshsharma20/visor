import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ interactive = false, children, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-bg-2 border border-line-1 rounded-card flex flex-col relative transition-colors duration-fast ${
          interactive ? 'hover:border-line-2 cursor-pointer' : ''
        } ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Backwards compatibility re-export
export const Panel = Card;
export type PanelProps = CardProps;
