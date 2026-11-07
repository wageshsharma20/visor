import { createContext, useContext } from 'react';

export type WireState = 'streaming' | 'idle' | 'error';
export type PortState = WireState;
export type WireOrientation = 'horizontal' | 'vertical' | 'auto';

export interface WireDescriptor {
  id: string;
  from: string;
  to: string;
  state?: WireState;
  orientation?: WireOrientation;
  curvature?: number;
  filterId?: string;
  className?: string;
}

export interface GraphContextValue {
  registerPort: (id: string, element: HTMLElement) => () => void;
  registerWire: (wire: WireDescriptor) => () => void;
  containerElement?: HTMLDivElement | null;
}

export const GraphContext = createContext<GraphContextValue | null>(null);

export function useGraphContext(): GraphContextValue | null {
  return useContext(GraphContext);
}
