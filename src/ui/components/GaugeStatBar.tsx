import type { CSSProperties } from 'react';
import { formatNumber } from '../formatters/number';
import { GameIcon, type GameIconName } from '../icons/GameIcon';

interface GaugeStatBarProps {
  className?: string;
  iconClassName?: string;
  iconName?: GameIconName;
  iconSize?: number;
  label: string;
  max?: number;
  showLabel?: boolean;
  tone?: 'dynamic' | 'green';
  value: number;
  variant?: 'compact' | 'major';
}

function clampRatio(value: number, max: number) {
  if (max <= 0) {
    return 0;
  }

  return Math.min(1, Math.max(0, value / max));
}

function getDynamicGaugeColor(ratio: number) {
  return `hsl(${Math.round(ratio * 120)} 62% 54%)`;
}

export function GaugeStatBar({
  className,
  iconClassName,
  iconName,
  iconSize,
  label,
  max = 100,
  showLabel = false,
  tone = 'dynamic',
  value,
  variant = 'compact',
}: GaugeStatBarProps) {
  const roundedValue = Math.round(value);
  const ratio = clampRatio(roundedValue, max);
  const percent = Math.round(ratio * 100);
  const title = `${label}: ${formatNumber(roundedValue)} / ${formatNumber(max)}`;
  const style = {
    '--gauge-fill': tone === 'green' ? '#78c46b' : getDynamicGaugeColor(ratio),
    '--gauge-percent': `${percent}%`,
  } as CSSProperties;

  return (
    <div
      aria-label={title}
      className={[
        'gauge-stat-bar',
        `gauge-stat-bar--${variant}`,
        showLabel ? 'gauge-stat-bar--labeled' : '',
        iconName ? '' : 'gauge-stat-bar--no-icon',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
      title={title}
    >
      {iconName ? (
        <span className={iconClassName}>
          <GameIcon name={iconName} size={iconSize ?? (variant === 'major' ? 18 : 16)} />
        </span>
      ) : null}
      {showLabel ? <span className="gauge-stat-bar__label">{label}</span> : null}
      <span className="gauge-stat-bar__track" aria-hidden="true">
        <span className="gauge-stat-bar__fill" />
      </span>
      <strong>{variant === 'major' ? `${percent}%` : formatNumber(roundedValue)}</strong>
    </div>
  );
}
