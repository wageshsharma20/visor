import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string;
  height?: string;
  radius?: 'chip' | 'control' | 'card';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = 'w-full',
  height = 'h-4',
  radius = 'control',
  className = '',
  ...props
}) => {
  const radiusClass = {
    chip: 'rounded-chip',
    control: 'rounded-control',
    card: 'rounded-card',
  }[radius];

  return (
    <div
      aria-hidden="true"
      className={`${width} ${height} ${radiusClass} animate-shimmer border border-line-1/40 ${className}`}
      {...props}
    />
  );
};
