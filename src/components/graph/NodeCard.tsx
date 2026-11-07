import React from 'react';
import { Card, CardHeader, CardProps } from '@/components/ui';
import { Port, PortState } from './Port';

export interface NodeCardPorts {
  left?: string;
  right?: string;
  top?: string;
  bottom?: string;
}

export interface NodeCardProps extends CardProps {
  title: string;
  icon?: React.ReactNode;
  statusDot?: React.ReactNode;
  action?: React.ReactNode;
  ports?: NodeCardPorts;
  portState?: PortState;
}

export const NodeCard: React.FC<NodeCardProps> = ({
  title,
  icon,
  statusDot,
  action,
  ports,
  portState = 'streaming',
  children,
  className = '',
  ...props
}) => {
  return (
    <Card className={`relative ${className}`} {...props}>
      {ports?.left && <Port id={ports.left} state={portState} position="left" />}
      {ports?.right && <Port id={ports.right} state={portState} position="right" />}
      {ports?.top && <Port id={ports.top} state={portState} position="top" />}
      {ports?.bottom && <Port id={ports.bottom} state={portState} position="bottom" />}
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
