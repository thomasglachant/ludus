import './alert.css';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { GameIcon, type GameIconName } from '@/ui/shared/icons/GameIcon';

export type AlertLevel = 'info' | 'warning' | 'error';

export interface AlertProps {
  className?: string;
  description: ReactNode;
  iconName?: GameIconName;
  level: AlertLevel;
  testId?: string;
  title?: string;
}

const defaultIconsByLevel: Record<AlertLevel, GameIconName> = {
  error: 'injuryRisk',
  info: 'notification',
  warning: 'alert',
};

export function Alert({ className, description, iconName, level, testId, title }: AlertProps) {
  const resolvedIconName = iconName ?? defaultIconsByLevel[level];
  const role = level === 'info' ? 'status' : 'alert';

  return (
    <div
      className={cn('alert', `alert--${level}`, className)}
      data-slot="alert"
      data-testid={testId}
      role={role}
    >
      <span className="alert__icon-frame">
        <GameIcon className="alert__icon" color="currentColor" name={resolvedIconName} size={22} />
      </span>
      <div className="alert__content">
        {title ? <div className="alert__title">{title}</div> : null}
        <div className="alert__description">{description}</div>
      </div>
    </div>
  );
}
