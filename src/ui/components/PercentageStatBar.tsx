import type { CSSProperties } from 'react';
import { formatNumber } from '../formatters/number';
import { GameIcon, type GameIconName } from '../icons/GameIcon';
import { Tooltip } from './Tooltip';

interface PercentageStatBarProps {
  className?: string;
  iconName: GameIconName;
  label: string;
  max?: number;
  tone?: 'energy' | 'health' | 'morale';
  value: number;
}

function clampRatio(value: number, max: number) {
  if (max <= 0) {
    return 0;
  }

  return Math.min(1, Math.max(0, value / max));
}

export function PercentageStatBar({
  className,
  iconName,
  label,
  max = 100,
  tone = 'energy',
  value,
}: PercentageStatBarProps) {
  const roundedValue = Math.round(value);
  const roundedMax = Math.round(max);
  const percent = Math.round(clampRatio(roundedValue, roundedMax) * 100);
  const valueLabel = `${formatNumber(roundedValue)} / ${formatNumber(roundedMax)}`;
  const title = `${label}: ${valueLabel}`;
  const style = {
    '--percentage-stat-percent': `${percent}%`,
  } as CSSProperties;

  return (
    <div
      aria-label={title}
      className={['percentage-stat-bar', `percentage-stat-bar--${tone}`, className ?? '']
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      <span className="percentage-stat-bar__icon-target">
        <Tooltip content={label}>
          <GameIcon className="percentage-stat-bar__icon" name={iconName} size={18} />
        </Tooltip>
      </span>
      <span className="percentage-stat-bar__track" aria-hidden="true">
        <span className="percentage-stat-bar__fill" />
        <strong className="percentage-stat-bar__value">{valueLabel}</strong>
      </span>
    </div>
  );
}
