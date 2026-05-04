import type { ReactNode } from 'react';
import { formatNumber } from '../formatters/number';
import { ResourceBadge } from '../game/ResourceBadge';
import type { GameIconName } from '../icons/GameIcon';
import { Tooltip } from './Tooltip';

interface IconValueStatProps {
  className?: string;
  iconName: GameIconName;
  label: string;
  tooltipContent?: string;
  value: ReactNode;
}

function formatStatValue(value: ReactNode) {
  return typeof value === 'number' ? formatNumber(value) : value;
}

export function IconValueStat({
  className,
  iconName,
  label,
  tooltipContent,
  value,
}: IconValueStatProps) {
  return (
    <Tooltip content={tooltipContent ?? label}>
      <ResourceBadge
        className={['icon-value-stat', className].filter(Boolean).join(' ')}
        iconName={iconName}
        label={label}
        value={formatStatValue(value)}
      />
    </Tooltip>
  );
}
