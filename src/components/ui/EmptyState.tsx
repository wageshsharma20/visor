import React from 'react';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-6 select-none ${className}`}
    >
      <div className="w-10 h-10 rounded-[4px] bg-bg-2 border border-line-1 flex items-center justify-center text-text-3 mb-3 [&>svg]:w-5 [&>svg]:h-5 [&>svg]:stroke-[1.5]">
        {icon}
      </div>
      <h3 className="text-body-strong text-text-1 mb-1">{title}</h3>
      <p className="text-small text-text-2 max-w-xs mb-4 leading-relaxed">{description}</p>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
};
