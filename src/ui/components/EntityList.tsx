import { Children, type ReactNode } from 'react';
import { useUiStore } from '../../state/ui-store-context';
import { GameIcon, type GameIconName } from '../icons/GameIcon';
import { CTAButton } from './CTAButton';
import { IconValueStat } from './IconValueStat';

export type EntityListInfoTone = 'danger' | 'neutral' | 'positive' | 'warning';

export interface EntityListInfoItem {
  iconName: GameIconName;
  id: string;
  label: string;
  tone?: EntityListInfoTone;
  value: ReactNode;
}

export interface EntityListActionItem {
  amountMoney?: ReactNode;
  disabled?: boolean;
  iconName?: GameIconName;
  id: string;
  label: string;
  testId?: string;
  variant?: 'primary' | 'secondary';
  onClick(): void;
}

interface EntityListProps {
  children?: ReactNode;
  className?: string;
  emptyMessageKey?: string;
  emptyTestId?: string;
}

interface EntityListEmptyProps {
  messageKey?: string;
  testId?: string;
}

interface EntityListRowProps {
  actions?: EntityListActionItem[];
  avatar?: ReactNode;
  className?: string;
  info?: EntityListInfoItem[];
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
  info,
  infoContent,
  onOpen,
}: Pick<
  EntityListRowProps,
  'actions' | 'avatar' | 'className' | 'info' | 'infoContent' | 'onOpen'
>) {
  return [
    'entity-list-row',
    onOpen ? 'entity-list-row--clickable' : null,
    avatar ? null : 'entity-list-row--no-avatar',
    infoContent || (info && info.length > 0) ? null : 'entity-list-row--no-info',
    actions && actions.length > 0 ? null : 'entity-list-row--no-actions',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

function EntityListAction({ action }: { action: EntityListActionItem }) {
  const content = (
    <>
      {action.iconName ? <GameIcon name={action.iconName} size={17} /> : null}
      <span>{action.label}</span>
    </>
  );
  const handleClick = () => action.onClick();

  if (action.variant === 'primary') {
    return (
      <CTAButton
        amountMoney={action.amountMoney}
        data-testid={action.testId}
        disabled={action.disabled}
        onClick={handleClick}
      >
        {content}
      </CTAButton>
    );
  }

  return (
    <button
      className="entity-list-row__button"
      data-testid={action.testId}
      disabled={action.disabled}
      type="button"
      onClick={handleClick}
    >
      {content}
    </button>
  );
}

export function EntityListEmpty({ messageKey = 'common.emptyList', testId }: EntityListEmptyProps) {
  const { t } = useUiStore();

  return (
    <div className="entity-list-empty" data-testid={testId}>
      <GameIcon name="folderOpen" size={22} />
      <p>{t(messageKey)}</p>
    </div>
  );
}

export function EntityList({ children, className, emptyMessageKey, emptyTestId }: EntityListProps) {
  const rows = Children.toArray(children).filter(Boolean);

  if (rows.length === 0) {
    return <EntityListEmpty messageKey={emptyMessageKey} testId={emptyTestId} />;
  }

  return <div className={['entity-list', className].filter(Boolean).join(' ')}>{rows}</div>;
}

export function EntityListRow({
  actions = [],
  avatar,
  className,
  info = [],
  infoContent,
  onOpen,
  openLabel,
  subtitle,
  testId,
  title,
}: EntityListRowProps) {
  const { t } = useUiStore();

  return (
    <article
      className={getRowClassName({ actions, avatar, className, info, infoContent, onOpen })}
      data-testid={testId}
    >
      {onOpen ? (
        <button
          aria-label={openLabel ?? t('common.open')}
          className="entity-list-row__open-button"
          type="button"
          onClick={onOpen}
        />
      ) : null}
      {avatar ? <div className="entity-list-row__avatar">{avatar}</div> : null}
      <div className="entity-list-row__identity">
        <strong>{title}</strong>
        {subtitle ? <div className="entity-list-row__subtitle">{subtitle}</div> : null}
      </div>
      {infoContent ? <div className="entity-list-row__info">{infoContent}</div> : null}
      {!infoContent && info.length > 0 ? (
        <dl className="entity-list-row__info">
          {info.map((item) => (
            <div
              className={`entity-list-row__info-item entity-list-row__info-item--${item.tone ?? 'neutral'}`}
              key={item.id}
            >
              <dt className="entity-list-row__info-label">{item.label}</dt>
              <dd>
                <IconValueStat iconName={item.iconName} label={item.label} value={item.value} />
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {actions.length > 0 ? (
        <div className="entity-list-row__actions">
          {actions.map((action) => (
            <EntityListAction action={action} key={action.id} />
          ))}
        </div>
      ) : null}
    </article>
  );
}
