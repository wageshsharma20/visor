import React from 'react';

export interface MetaChipProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const MetaChip = React.forwardRef<HTMLDivElement, MetaChipProps>(
  (
    {
      icon,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`inline-flex items-center gap-1.5 h-[22px] px-2 bg-bg-3 rounded-chip text-data font-mono text-text-2 select-none shrink-0 ${className}`}
        {...props}
      >
        {icon && (
          <span className="w-3 h-3 flex items-center justify-center text-text-3 [&>svg]:w-3 [&>svg]:h-3">
            {icon}
          </span>
        )}
        <span className="truncate">{children}</span>
      </div>
    );
  }
);

MetaChip.displayName = 'MetaChip';
