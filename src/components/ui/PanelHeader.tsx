import React from 'react';

export interface PanelHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({
  title,
  badge,
  action,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`h-[36px] min-h-[36px] px-3 flex items-center justify-between border-b border-line-1 bg-bg-1 select-none ${className}`}
      {...props}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="font-mono text-section uppercase tracking-wider text-text-3 truncate">
          {title}
        </span>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>
      {action && <div className="flex items-center gap-1 shrink-0">{action}</div>}
    </div>
  );
};
