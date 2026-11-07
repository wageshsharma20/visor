import React from 'react';
import { User } from 'lucide-react';

export interface AvatarItem {
  id: string;
  name: string;
  src?: string;
  fallback?: string;
}

export interface AvatarStackProps {
  avatars: AvatarItem[];
  max?: number;
  className?: string;
}

export const AvatarStack: React.FC<AvatarStackProps> = ({
  avatars,
  max = 3,
  className = '',
}) => {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className={`flex items-center -space-x-1.5 select-none ${className}`}>
      {visible.map((av) => (
        <div
          key={av.id}
          title={av.name}
          className="relative inline-flex items-center justify-center w-6 h-6 rounded-full ring-2 ring-bg-1 bg-bg-3 overflow-hidden text-hud font-sans font-medium text-text-2 uppercase"
        >
          {av.src ? (
            <img src={av.src} alt={av.name} className="w-full h-full object-cover" />
          ) : av.fallback ? (
            <span>{av.fallback.slice(0, 1)}</span>
          ) : (
            <User className="w-3 h-3 text-text-3" />
          )}
        </div>
      ))}
      {remaining > 0 && (
        <div className="relative inline-flex items-center justify-center h-6 px-1.5 rounded-chip ring-2 ring-bg-1 bg-bg-3 text-data font-mono text-text-2">
          +{remaining}
        </div>
      )}
    </div>
  );
};
