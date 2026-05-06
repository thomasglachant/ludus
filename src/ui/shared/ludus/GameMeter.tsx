import './ludus-components.css';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { formatNumber } from '@/ui/shared/formatters/number';
import { GameIcon, type GameIconName } from '@/ui/shared/icons/GameIcon';
import { GameProgress } from '@/ui/shared/ludus/GameProgress';

export type GameMeterSurface = 'dark' | 'light' | 'plain';
export type GameMeterTone = 'dynamic' | 'energy' | 'health' | 'morale' | 'positive';

interface GameMeterProps extends HTMLAttributes<HTMLDivElement> {
  iconName?: GameIconName;
  iconSize?: number;
  label: ReactNode;
  max?: number;
  showLabel?: boolean;
  showValue?: boolean;
  surface?: GameMeterSurface;
  tone?: GameMeterTone;
  value: number;
}

function clampRatio(value: number, max: number) {
  if (max <= 0) {
    return 0;
  }

  return Math.min(1, Math.max(0, value / max));
}

function getMeterColor(tone: GameMeterTone, ratio: number) {
  if (tone === 'health') {
    return 'var(--health-red)';
  }

  if (tone === 'energy') {
    return 'var(--energy-ochre)';
  }

  if (tone === 'morale' || tone === 'positive') {
    return 'var(--morale-green)';
  }

  return `hsl(${Math.round(ratio * 120)} 62% 54%)`;
}

export function GameMeter({
  className,
  iconSize = 17,
  iconName,
  label,
  max = 100,
  showLabel = false,
  showValue = true,
  surface = 'dark',
  tone = 'dynamic',
  value,
  ...props
}: GameMeterProps) {
  const roundedValue = Math.round(value);
  const roundedMax = Math.round(max);
  const ratio = clampRatio(roundedValue, roundedMax);
  const percent = Math.round(ratio * 100);
  const valueLabel =
    roundedMax === 100 ? `${percent}%` : `${formatNumber(roundedValue)} / ${formatNumber(max)}`;
  const ariaLabel = `${label}: ${valueLabel}`;
  const style = {
    '--game-meter-fill': getMeterColor(tone, ratio),
  } as CSSProperties;

  return (
    <div
      aria-label={ariaLabel}
      className={cn(
        'game-meter',
        `game-meter--${surface}`,
        `game-meter--${tone}`,
        showLabel && 'game-meter--labeled',
        className,
      )}
      data-slot="game-meter"
      style={style}
      title={ariaLabel}
      {...props}
    >
      {iconName ? (
        <span aria-hidden="true" className="game-meter__icon">
          <GameIcon name={iconName} size={iconSize} />
        </span>
      ) : null}
      {showLabel ? <span className="game-meter__label">{label}</span> : null}
      <GameProgress
        className="game-meter__track"
        indicatorClassName="game-meter__fill"
        label={ariaLabel}
        max={roundedMax}
        value={roundedValue}
      />
      {showValue ? <strong className="game-meter__value">{valueLabel}</strong> : null}
    </div>
  );
}
