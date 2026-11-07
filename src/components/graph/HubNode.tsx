import React from 'react';
import { Zap } from 'lucide-react';

export interface HubNodeProps {
  label?: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export const HubNode: React.FC<HubNodeProps> = ({
  label,
  active = true,
  onClick,
  className = '',
}) => {
  return (
    <div className={`inline-flex flex-col items-center gap-1.5 select-none ${className}`}>
      <button
        type="button"
        onClick={onClick}
        aria-label={label || 'Hub Inference Node'}
        className={`w-9 h-9 rounded-control bg-bg-2 border border-line-2 flex items-center justify-center transition-all duration-fast ${
          active
            ? 'text-text-1 hover:border-accent hover:shadow-glow-accent cursor-pointer'
            : 'text-text-3 border-dashed cursor-default'
        } focus-visible:outline-none focus-visible:shadow-focus`}
      >
        <Zap className="w-4 h-4 text-text-1" />
      </button>
      {label && (
        <span className="font-mono text-data text-text-3 truncate max-w-[80px]">
          {label}
        </span>
      )}
    </div>
  );
};
