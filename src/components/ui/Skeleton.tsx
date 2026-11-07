import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string;
  height?: string;
  radius?: '2' | '4';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = 'w-full',
  height = 'h-4',
  radius = '4',
  className = '',
  ...props
}) => {
  const radiusClass = radius === '2' ? 'rounded-[2px]' : 'rounded-[4px]';

  return (
    <div
      aria-hidden="true"
      className={`${width} ${height} ${radiusClass} animate-shimmer border border-line-1/50 ${className}`}
      {...props}
    />
  );
};
