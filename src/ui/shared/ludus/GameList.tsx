import './ludus-components.css';
import { Children, type ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { useUiStore } from '@/state/ui-store-context';
import { GameIcon, type GameIconName } from '@/ui/shared/icons/GameIcon';
import { GameEmptyState } from './GameSection';
import { GameFact, type GameFactTone } from './GameFact';
import { ListActionButton } from './ListActionButton';

export interface GameListFact {
  iconName: GameIconName;
  id: string;
  label: string;
  tone?: GameFactTone;
  value: ReactNode;
}

export interface GameListAction {
  amountMoney?: ReactNode;
  disabled?: boolean;
  iconName?: GameIconName;
  id: string;
  label: string;
  testId?: string;
  variant?: 'primary' | 'secondary';
  onClick(): void;
}

interface GameListProps {
  children?: ReactNode;
  className?: string;
  emptyMessageKey?: string;
  emptyTestId?: string;
}

interface GameListRowProps {
  actions?: GameListAction[];
  avatar?: ReactNode;
  className?: string;
  facts?: GameListFact[];
  infoContent?: ReactNode;
  openLabel?: string;
  subtitle?: ReactNode;
  testId?: string;
  title: ReactNode;
  onOpen?(): void;
}

function getRowClassName({
  actions,
  avatar,
  className,
  facts,
  infoContent,
  onOpen,
}: Pick<
  GameListRowProps,
  'actions' | 'avatar' | 'className' | 'facts' | 'infoContent' | 'onOpen'
>) {
  return cn(
    'game-list-row',
    onOpen && 'game-list-row--clickable',
    !avatar && 'game-list-row--no-avatar',
    !infoContent && (!facts || facts.length === 0) && 'game-list-row--no-info',
    (!actions || actions.length === 0) && 'game-list-row--no-actions',
    className,
  );
}

function GameListActionButton({ action }: { action: GameListAction }) {
  const content = (
    <>
      {action.iconName ? <GameIcon name={action.iconName} size={17} /> : null}
      <span>{action.label}</span>
    </>
  );

  return (
    <ListActionButton
      amountMoney={action.amountMoney}
      data-testid={action.testId}
      disabled={action.disabled}
      variant={action.variant}
      type="button"
      onClick={action.onClick}
    >
      {content}
    </ListActionButton>
  );
}

export function GameList({ children, className, emptyMessageKey, emptyTestId }: GameListProps) {
  const rows = Children.toArray(children).filter(Boolean);

  if (rows.length === 0) {
    return (
      <GameEmptyState messageKey={emptyMessageKey ?? 'common.emptyList'} testId={emptyTestId} />
    );
  }

  return (
    <div className={cn('game-list', className)} data-slot="game-list">
      {rows}
    </div>
  );
}

export function GameListRow({
  actions = [],
  avatar,
  className,
  facts = [],
  infoContent,
  onOpen,
  openLabel,
  subtitle,
  testId,
  title,
}: GameListRowProps) {
  const { t } = useUiStore();

  return (
    <article
      className={getRowClassName({ actions, avatar, className, facts, infoContent, onOpen })}
      data-slot="game-list-row"
      data-testid={testId}
    >
      {onOpen ? (
        <button
          aria-label={openLabel ?? t('common.open')}
          className="game-list-row__open-button"
          type="button"
          onClick={onOpen}
        />
      ) : null}
      {avatar ? <div className="game-list-row__avatar">{avatar}</div> : null}
      <div className="game-list-row__identity">
        <strong>{title}</strong>
        {subtitle ? <div className="game-list-row__subtitle">{subtitle}</div> : null}
      </div>
      {infoContent ? <div className="game-list-row__info">{infoContent}</div> : null}
      {!infoContent && facts.length > 0 ? (
        <dl className="game-list-row__info">
          {facts.map((fact) => (
            <div className="game-list-row__fact" key={fact.id}>
              <dt>{fact.label}</dt>
              <dd>
                <GameFact
                  iconName={fact.iconName}
                  label={fact.label}
                  showLabel={false}
                  surface="light"
                  tone={fact.tone}
                  value={fact.value}
                />
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {actions.length > 0 ? (
        <div className="game-list-row__actions">
          {actions.map((action) => (
            <GameListActionButton action={action} key={action.id} />
          ))}
        </div>
      ) : null}
    </article>
  );
}
