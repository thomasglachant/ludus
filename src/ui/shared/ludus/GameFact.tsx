import './ludus-components.css';
import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { GameIcon, type GameIconName } from '@/ui/shared/icons/GameIcon';

export type GameFactSurface = 'dark' | 'light' | 'plain';
export type GameFactTone = 'danger' | 'neutral' | 'positive' | 'warning';

export interface GameFactProps extends HTMLAttributes<HTMLElement> {
  as?: 'button' | 'div' | 'span';
  disabled?: boolean;
  iconSize?: number;
  iconName?: GameIconName;
  label: ReactNode;
  showLabel?: boolean;
  surface?: GameFactSurface;
  tone?: GameFactTone;
  type?: 'button' | 'submit';
  value: ReactNode;
}

function getContent({ iconName, iconSize = 17, label, showLabel = true, value }: GameFactProps) {
  return (
    <>
      {iconName ? (
        <span aria-hidden="true" className="game-fact__icon">
          <GameIcon name={iconName} size={iconSize} />
        </span>
      ) : null}
      <span className="game-fact__copy">
        {showLabel ? <span className="game-fact__label">{label}</span> : null}
        <strong className="game-fact__value">{value}</strong>
      </span>
    </>
  );
}

export function GameFact({
  as = 'span',
  className,
  disabled,
  iconSize,
  iconName,
  label,
  showLabel,
  surface = 'dark',
  tone = 'neutral',
  type = 'button',
  value,
  ...props
}: GameFactProps) {
  const classes = cn('game-fact', `game-fact--${surface}`, `game-fact--${tone}`, className);
  const content = getContent({ iconName, iconSize, label, showLabel, value });

  if (as === 'button') {
    return (
      <button
        aria-label={typeof label === 'string' ? label : undefined}
        className={classes}
        data-slot="game-fact"
        disabled={disabled}
        type={type}
        {...(props as HTMLAttributes<HTMLButtonElement>)}
      >
        {content}
      </button>
    );
  }

  const Component = as;

  return (
    <Component
      aria-label={typeof label === 'string' ? label : undefined}
      className={classes}
      data-slot="game-fact"
      {...props}
    >
      {content}
    </Component>
  );
}
