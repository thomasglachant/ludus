import './notifications.css';
import type { BuildingId, GameNotification, GameSave } from '@/domain/types';
import { BUILDING_DEFINITIONS } from '@/game-data/buildings';
import { useUiStore } from '@/state/ui-store-context';
import { BuildingAvatar } from '@/ui/features/buildings/BuildingAvatar';
import { GameEmptyState } from '@/ui/shared/ludus/GameFeedback';
import { IconButton } from '@/ui/shared/ludus/IconButton';
import { GameIcon } from '@/ui/shared/icons/GameIcon';
import { GladiatorPortrait } from '@/ui/features/gladiators/GladiatorPortrait';

interface NotificationListProps {
  emptyMessageKey: string;
  notifications: GameNotification[];
  save: GameSave;
  variant: 'full' | 'side';
  onArchive(notificationId: string): void;
  onOpenBuilding(buildingId: BuildingId): void;
  onOpenGladiator(gladiatorId: string): void;
}

function getDateLabel(notification: GameNotification, t: ReturnType<typeof useUiStore>['t']) {
  return t('notifications.dateLabel', {
    day: t(`days.${notification.occurredAt.dayOfWeek}`),
    week: notification.occurredAt.week,
    year: notification.occurredAt.year,
  });
}

function NotificationSubject({
  notification,
  save,
}: {
  notification: GameNotification;
  save: GameSave;
}) {
  const { t } = useUiStore();

  if (notification.target?.kind === 'gladiator') {
    const { gladiatorId } = notification.target;
    const gladiator = save.gladiators.find((candidate) => candidate.id === gladiatorId);

    if (gladiator) {
      return (
        <span className="notification-card__subject">
          <GladiatorPortrait gladiator={gladiator} size="small" />
          <strong>{gladiator.name}</strong>
        </span>
      );
    }
  }

  if (notification.target?.kind === 'building') {
    const building = save.buildings[notification.target.buildingId];
    const definition = BUILDING_DEFINITIONS[notification.target.buildingId];

    if (building && definition) {
      return (
        <span className="notification-card__subject">
          <BuildingAvatar
            buildingId={notification.target.buildingId}
            level={building.level}
            size="small"
          />
          <strong>{t(definition.nameKey)}</strong>
        </span>
      );
    }
  }

  return (
    <span className="notification-card__icon">
      <GameIcon name="notification" size={22} />
    </span>
  );
}

function getNotificationAction(
  notification: GameNotification,
  save: GameSave,
  handlers: Pick<NotificationListProps, 'onOpenBuilding' | 'onOpenGladiator'>,
) {
  if (notification.target?.kind === 'gladiator') {
    const { gladiatorId } = notification.target;

    return save.gladiators.some((gladiator) => gladiator.id === gladiatorId)
      ? () => handlers.onOpenGladiator(gladiatorId)
      : null;
  }

  if (notification.target?.kind === 'building') {
    const { buildingId } = notification.target;

    return BUILDING_DEFINITIONS[buildingId] ? () => handlers.onOpenBuilding(buildingId) : null;
  }

  return null;
}

function NotificationItem({
  notification,
  onArchive,
  onOpenBuilding,
  onOpenGladiator,
  save,
}: Omit<NotificationListProps, 'emptyMessageKey' | 'notifications' | 'variant'> & {
  notification: GameNotification;
}) {
  const { t } = useUiStore();
  const isArchived = Boolean(notification.archivedAt);
  const action = getNotificationAction(notification, save, { onOpenBuilding, onOpenGladiator });
  const body = (
    <>
      <NotificationSubject notification={notification} save={save} />
      <span className="notification-card__copy">
        <span className="notification-card__date">{getDateLabel(notification, t)}</span>
        <strong>{t(notification.titleKey, notification.params)}</strong>
        <span>{t(notification.descriptionKey, notification.params)}</span>
      </span>
    </>
  );

  return (
    <article
      className={[
        'notification-card',
        isArchived ? 'notification-card--archived' : 'notification-card--unarchived',
      ].join(' ')}
      data-testid={`notification-${notification.id}`}
    >
      {action ? (
        <button className="notification-card__body" type="button" onClick={action}>
          {body}
        </button>
      ) : (
        <span className="notification-card__body">{body}</span>
      )}
      {isArchived ? (
        <span className="notification-card__archived">{t('notifications.archived')}</span>
      ) : (
        <IconButton
          aria-label={t('notifications.archive')}
          className="notification-card__archive"
          data-testid={`notification-archive-${notification.id}`}
          type="button"
          onClick={() => onArchive(notification.id)}
        >
          <GameIcon name="archive" size={17} />
        </IconButton>
      )}
    </article>
  );
}

export function NotificationList({
  emptyMessageKey,
  notifications,
  onArchive,
  onOpenBuilding,
  onOpenGladiator,
  save,
  variant,
}: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <GameEmptyState
        density="compact"
        messageKey={emptyMessageKey}
        surface={variant === 'side' ? 'dark' : 'light'}
      />
    );
  }

  return (
    <div className={`notification-list notification-list--${variant}`}>
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          save={save}
          onArchive={onArchive}
          onOpenBuilding={onOpenBuilding}
          onOpenGladiator={onOpenGladiator}
        />
      ))}
    </div>
  );
}
