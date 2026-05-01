import type { ReactNode } from 'react';
import { formatNumber } from '../formatters/number';
import { GameIcon, type GameIconName } from '../icons/GameIcon';
import { Tooltip } from './Tooltip';

interface IconValueStatProps {
  iconName: GameIconName;
  label: string;
  tooltipContent?: string;
  value: ReactNode;
}

function formatStatValue(value: ReactNode) {
  return typeof value === 'number' ? formatNumber(value) : value;
}

export function IconValueStat({ iconName, label, tooltipContent, value }: IconValueStatProps) {
  return (
    <Tooltip content={tooltipContent ?? label}>
      <span className="icon-value-stat">
        <GameIcon name={iconName} size={18} />
        <strong>{formatStatValue(value)}</strong>
      </span>
    </Tooltip>
  );
}
