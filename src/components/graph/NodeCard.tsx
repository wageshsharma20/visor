import React from 'react';
import { Card, CardHeader, CardProps } from '@/components/ui';
import { Port, PortState } from './Port';

export interface NodeCardProps extends CardProps {
  title: string;
  icon?: React.ReactNode;
  statusDot?: React.ReactNode;
  action?: React.ReactNode;
  leftPort?: PortState;
  rightPort?: PortState;
}

export const NodeCard: React.FC<NodeCardProps> = ({
  title,
  icon,
  statusDot,
  action,
  leftPort,
  rightPort,
  children,
  className = '',
  ...props
}) => {
  return (
    <Card className={`relative ${className}`} {...props}>
      {leftPort && <Port state={leftPort} position="left" />}
      {rightPort && <Port state={rightPort} position="right" />}
      <CardHeader
        title={title}
        icon={icon}
        statusDot={statusDot}
        action={action}
      />
      <div className="p-3 text-body text-text-2">
        {children}
      </div>
    </Card>
  );
};
