import React from 'react';
import { Zap } from 'lucide-react';
import { Port } from './Port';

export interface HubNodeProps {
  label?: React.ReactNode;
  active?: boolean;
  inPort?: string;
  outPort?: string;
  inPosition?: 'left' | 'top';
  outPosition?: 'right' | 'bottom';
  orientation?: 'horizontal' | 'vertical';
  onClick?: () => void;
  className?: string;
}

export const HubNode: React.FC<HubNodeProps> = ({
  label,
  active = true,
  inPort,
  outPort,
  inPosition = 'left',
  outPosition = 'right',
  orientation = 'horizontal',
  onClick,
  className = '',
}) => {
  const isVertical = orientation === 'vertical';

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center select-none ${className}`}
    >
      {/* Hub square that sits directly on the wire */}
      <div className="relative inline-flex items-center justify-center">
        {inPort && (
          <Port
            id={inPort}
            position={isVertical ? 'top' : inPosition}
            state={active ? 'streaming' : 'idle'}
          />
        )}
        {outPort && (
          <Port
            id={outPort}
            position={isVertical ? 'bottom' : outPosition}
            state={active ? 'streaming' : 'idle'}
          />
        )}

        <button
          type="button"
          onClick={onClick}
          aria-label={typeof label === 'string' ? label : 'Hub Inference Node'}
          className={`w-9 h-9 rounded-control bg-bg-2 border border-line-2 flex items-center justify-center transition-all duration-fast z-10 ${
            active
              ? 'text-text-1 hover:border-accent hover:shadow-glow-accent cursor-pointer'
              : 'text-text-3 border-dashed cursor-default'
          } focus-visible:outline-none focus-visible:shadow-focus`}
        >
          <Zap className="w-4 h-4 text-text-1" />
        </button>

        {/* In vertical mode, position label beside the hub square so the hub stays centered on the wire */}
        {label && isVertical && (
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 font-mono text-data text-text-3 whitespace-nowrap">
            {label}
          </div>
        )}
      </div>

      {/* In horizontal mode, position label strictly below the hub node without truncating */}
      {label && !isVertical && (
        <div className="font-mono text-data text-text-3 mt-1.5 text-center leading-tight">
          {label}
        </div>
      )}
    </div>
  );
};
