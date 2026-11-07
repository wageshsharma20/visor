import React from 'react';

export type PortState = 'streaming' | 'idle' | 'error';

export interface PortProps {
  state?: PortState;
  position?: 'left' | 'right' | 'top' | 'bottom';
  className?: string;
}

export const Port: React.FC<PortProps> = ({
  state = 'streaming',
  position = 'right',
  className = '',
}) => {
  const stateFill = {
    streaming: 'bg-accent-bright shadow-glow-accent',
    idle: 'bg-text-3',
    error: 'bg-red',
  }[state];

  const positionClasses = {
    left: '-left-1 top-1/2 -translate-y-1/2',
    right: '-right-1 top-1/2 -translate-y-1/2',
    top: '-top-1 left-1/2 -translate-x-1/2',
    bottom: '-bottom-1 left-1/2 -translate-x-1/2',
  }[position];

  return (
    <div
      aria-hidden="true"
      className={`absolute w-1.5 h-1.5 rounded-full ring-2 ring-bg-1 ${stateFill} ${positionClasses} ${className}`}
    />
  );
};
