import React from 'react';

export interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  icon?: React.ReactNode;
  statusDot?: React.ReactNode;
  action?: React.ReactNode;
  badge?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  icon,
  statusDot,
  action,
  badge,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`h-9 min-h-[36px] px-3 flex items-center justify-between select-none ${className}`}
      {...props}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        {icon && (
          <span className="w-3.5 h-3.5 flex items-center justify-center text-text-2 shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5 [&>svg]:stroke-[1.75]">
            {icon}
          </span>
        )}
        <span className="font-sans text-card-title text-text-1 truncate">
          {title}
        </span>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {statusDot}
        {action}
      </div>
    </div>
  );
};

// Backwards compatibility re-export
export const PanelHeader: React.FC<CardHeaderProps> = CardHeader;
export type PanelHeaderProps = CardHeaderProps;
