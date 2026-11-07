import React, { useEffect, useRef } from 'react';
import { useGraphContext, PortState } from './GraphContext';

export type { PortState };

export interface PortProps {
  id?: string;
  state?: PortState;
  position?: 'left' | 'right' | 'top' | 'bottom';
  className?: string;
}

export const Port: React.FC<PortProps> = ({
  id,
  state = 'streaming',
  position = 'right',
  className = '',
}) => {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const context = useGraphContext();
  const registerPort = context?.registerPort;

  useEffect(() => {
    if (!id || !elementRef.current || !registerPort) return;
    return registerPort(id, elementRef.current);
  }, [id, registerPort]);

  const stateFill: Record<PortState, string> = {
    streaming: 'bg-accent-bright shadow-glow-accent',
    idle: 'bg-text-3',
    error: 'bg-red',
  };

  const positionClasses = {
    left: 'left-0 -translate-x-1/2 top-1/2 -translate-y-1/2',
    right: 'left-full -translate-x-1/2 top-1/2 -translate-y-1/2',
    top: 'top-0 -translate-y-1/2 left-1/2 -translate-x-1/2',
    bottom: 'top-full -translate-y-1/2 left-1/2 -translate-x-1/2',
  }[position];

  return (
    <div
      ref={elementRef}
      id={id ? `port-${id}` : undefined}
      data-port-id={id}
      aria-hidden="true"
      className={`absolute w-1.5 h-1.5 rounded-full ring-2 ring-bg-1 z-20 ${stateFill[state]} ${positionClasses} ${className}`}
    />
  );
};
