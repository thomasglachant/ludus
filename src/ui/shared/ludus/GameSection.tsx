import './ludus-components.css';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { useUiStore } from '@/state/ui-store-context';
import { GameIcon, type GameIconName } from '@/ui/shared/icons/GameIcon';
import { GameFact } from './GameFact';

export type GameSectionSurface = 'dark' | 'light' | 'plain';
export type GameNoticeTone = 'danger' | 'info' | 'warning';
export type GameBadgeTone = 'danger' | 'neutral' | 'success' | 'warning';
export type GameEmptyStateDensity = 'compact' | 'inline' | 'normal';
export type GameEmptyStateSurface = 'dark' | 'light' | 'plain';

export interface GameStatItem {
  iconName?: GameIconName;
  labelKey: string;
  tone?: 'danger' | 'neutral' | 'positive' | 'warning';
  value: ReactNode;
}

interface GameSectionProps {
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  surface?: GameSectionSurface;
  testId?: string;
  title?: ReactNode;
  titleKey?: string;
}

interface GameStatsProps {
  className?: string;
  columns?: 2 | 3;
  items: GameStatItem[];
}

interface GameNoticeProps {
  children: ReactNode;
  className?: string;
  testId?: string;
  tone?: GameNoticeTone;
}

interface GameEmptyStateProps {
  className?: string;
  density?: GameEmptyStateDensity;
  iconName?: GameIconName;
  message?: ReactNode;
  messageKey?: string;
  surface?: GameEmptyStateSurface;
  testId?: string;
}

interface GameEffectListProps {
  effects: string[];
  emptyMessageKey?: string;
}

interface GameBadgeProps {
  label: string;
  tone?: GameBadgeTone;
}

export function GameSection({
  actions,
  children,
  className,
  surface = 'light',
  testId,
  title,
  titleKey,
}: GameSectionProps) {
  const { t } = useUiStore();

  return (
    <section
      className={cn('game-section', `game-section--${surface}`, className)}
      data-slot="game-section"
      data-testid={testId}
    >
      {titleKey || title || actions ? (
        <header className="game-section__header">
          {titleKey || title ? <h3>{titleKey ? t(titleKey) : title}</h3> : <span />}
          {actions ? <div className="game-section__actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className="game-section__body">{children}</div>
    </section>
  );
}

export function GameStats({ className, columns = 3, items }: GameStatsProps) {
  const { t } = useUiStore();

  return (
    <dl className={cn('game-stats', `game-stats--${columns}`, className)} data-slot="game-stats">
      {items.map((item) => {
        const label = t(item.labelKey);

        return (
          <div key={item.labelKey}>
            <dt>{label}</dt>
            <dd>
              <GameFact
                iconName={item.iconName}
                label={label}
                surface="light"
                tone={item.tone}
                value={item.value}
              />
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

export function GameNotice({ children, className, testId, tone = 'info' }: GameNoticeProps) {
  return (
    <div
      className={cn('game-notice', `game-notice--${tone}`, className)}
      data-slot="game-notice"
      data-testid={testId}
    >
      <GameIcon name={tone === 'info' ? 'notification' : 'warning'} size={17} />
      <span>{children}</span>
    </div>
  );
}

export function GameEmptyState({
  className,
  density = 'normal',
  iconName = 'folderOpen',
  message,
  messageKey,
  surface = 'light',
  testId,
}: GameEmptyStateProps) {
  const { t } = useUiStore();
  const resolvedMessage = messageKey ? t(messageKey) : message;

  if (resolvedMessage === undefined || resolvedMessage === null) {
    return null;
  }

  return (
    <div
      className={cn(
        'game-empty-state',
        `game-empty-state--${surface}`,
        `game-empty-state--${density}`,
        className,
      )}
      data-slot="game-empty-state"
      data-testid={testId}
    >
      <GameIcon name={iconName} size={density === 'inline' ? 15 : 22} />
      <p>{resolvedMessage}</p>
    </div>
  );
}

export function GameEffectList({ effects, emptyMessageKey = 'common.empty' }: GameEffectListProps) {
  if (effects.length === 0) {
    return <GameEmptyState messageKey={emptyMessageKey} />;
  }

  return (
    <ul className="game-effect-list">
      {effects.map((effect, index) => (
        <li key={`${effect}-${index}`}>{effect}</li>
      ))}
    </ul>
  );
}

export function GameBadge({ label, tone = 'neutral' }: GameBadgeProps) {
  return <span className={`status-pill status-pill--${tone}`}>{label}</span>;
}
