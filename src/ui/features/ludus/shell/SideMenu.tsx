import type { BuildingId, GameAlert, GameSave } from '@/domain/types';
import {
  getGladiatorTraitDefinition,
  getRemainingGladiatorTraitDuration,
} from '@/domain/gladiator-traits/gladiator-trait-actions';
import { sortGameNotificationsByDateDesc } from '@/domain/notifications/notification-actions';
import { BUILDING_DEFINITIONS } from '@/game-data/buildings';
import { useUiStore } from '@/state/ui-store-context';
import { BuildingAvatar } from '@/ui/features/buildings/BuildingAvatar';
import { Button } from '@/ui/shared/ludus/Button';
import { GameEmptyState } from '@/ui/shared/ludus/GameFeedback';
import { GameIcon, type GameIconName } from '@/ui/shared/icons/GameIcon';
import { NotificationList } from '@/ui/features/notifications/NotificationList';
import { GladiatorPortrait } from '@/ui/features/gladiators/GladiatorPortrait';
import { GameActionDock, type GameActionDockAction } from './GameActionDock';
import { ShellWidgetPanel } from './ShellWidgetPanel';

interface SideMenuProps {
  actions?: GameActionDockAction[];
  save: GameSave;
  onOpenBuilding(buildingId: BuildingId): void;
  onOpenGladiator(gladiatorId: string): void;
  onOpenFinance(): void;
  onOpenMarket(): void;
  onOpenNotifications(): void;
  onOpenWeeklyPlanning(): void;
  onArchiveNotification(notificationId: string): void;
}

interface AlertsListProps {
  alerts: GameAlert[];
  save: GameSave;
  onOpenBuilding(buildingId: BuildingId): void;
  onOpenGladiator(gladiatorId: string): void;
  onOpenFinance(): void;
  onOpenMarket(): void;
  onOpenWeeklyPlanning(): void;
}

interface AlertItemProps {
  alert: GameAlert;
  save: GameSave;
  onOpenBuilding(buildingId: BuildingId): void;
  onOpenGladiator(gladiatorId: string): void;
  onOpenFinance(): void;
  onOpenMarket(): void;
  onOpenWeeklyPlanning(): void;
}

const ALERT_SEVERITY_ORDER: Record<GameAlert['severity'], number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

function sortAlertsBySeverity(alerts: GameAlert[]) {
  return alerts
    .map((alert, index) => ({ alert, index }))
    .sort((left, right) => {
      const severityDelta =
        ALERT_SEVERITY_ORDER[left.alert.severity] - ALERT_SEVERITY_ORDER[right.alert.severity];

      return severityDelta || left.index - right.index;
    })
    .map(({ alert }) => alert);
}

export function SideMenu({
  actions = [],
  save,
  onOpenBuilding,
  onOpenGladiator,
  onOpenFinance,
  onOpenMarket,
  onOpenNotifications,
  onOpenWeeklyPlanning,
  onArchiveNotification,
}: SideMenuProps) {
  const { t } = useUiStore();
  const activeNotifications = sortGameNotificationsByDateDesc(
    save.notifications.filter((notification) => !notification.archivedAt),
  );

  return (
    <aside className="side-menu" aria-label={t('sideMenu.title')}>
      <ShellWidgetPanel className="side-menu__alerts-panel">
        <h2>{t('buildingsOverview.alertsTitle')}</h2>
        <AlertsList
          alerts={save.planning.alerts}
          save={save}
          onOpenBuilding={onOpenBuilding}
          onOpenGladiator={onOpenGladiator}
          onOpenFinance={onOpenFinance}
          onOpenMarket={onOpenMarket}
          onOpenWeeklyPlanning={onOpenWeeklyPlanning}
        />
      </ShellWidgetPanel>
      <ShellWidgetPanel className="side-menu__notifications-panel">
        <h2>{t('notifications.title')}</h2>
        <NotificationList
          emptyMessageKey="notifications.empty"
          notifications={activeNotifications}
          save={save}
          variant="side"
          onArchive={onArchiveNotification}
          onOpenBuilding={onOpenBuilding}
          onOpenGladiator={onOpenGladiator}
        />
        <Button
          className="side-menu__notifications-view-all"
          data-testid="side-menu-view-notifications"
          type="button"
          onClick={onOpenNotifications}
        >
          <GameIcon name="notification" size={17} />
          <span>{t('notifications.viewAll')}</span>
        </Button>
      </ShellWidgetPanel>
      <GameActionDock actions={actions} />
    </aside>
  );
}

function AlertsList({
  alerts,
  save,
  onOpenBuilding,
  onOpenGladiator,
  onOpenFinance,
  onOpenMarket,
  onOpenWeeklyPlanning,
}: AlertsListProps) {
  const sortedAlerts = sortAlertsBySeverity(alerts);

  if (alerts.length === 0) {
    return (
      <div className="side-menu__alerts-list">
        <GameEmptyState density="compact" messageKey="buildingsOverview.noAlerts" surface="dark" />
      </div>
    );
  }

  return (
    <div className="side-menu__alerts-list">
      {sortedAlerts.slice(0, 4).map((alert) => (
        <AlertItem
          alert={alert}
          key={alert.id}
          save={save}
          onOpenBuilding={onOpenBuilding}
          onOpenGladiator={onOpenGladiator}
          onOpenFinance={onOpenFinance}
          onOpenMarket={onOpenMarket}
          onOpenWeeklyPlanning={onOpenWeeklyPlanning}
        />
      ))}
    </div>
  );
}

function AlertItem({
  alert,
  save,
  onOpenBuilding,
  onOpenGladiator,
  onOpenFinance,
  onOpenMarket,
  onOpenWeeklyPlanning,
}: AlertItemProps) {
  const { t } = useUiStore();
  const gladiator = alert.gladiatorId
    ? save.gladiators.find((candidate) => candidate.id === alert.gladiatorId)
    : undefined;
  const buildingId = alert.buildingId;
  const building = buildingId ? save.buildings[buildingId] : undefined;
  const buildingDefinition = buildingId ? BUILDING_DEFINITIONS[buildingId] : undefined;
  const trait = alert.traitId
    ? gladiator?.traits.find((candidate) => candidate.traitId === alert.traitId)
    : undefined;
  const traitDefinition = trait ? getGladiatorTraitDefinition(trait.traitId) : undefined;
  const traitDuration = trait
    ? getRemainingGladiatorTraitDuration(trait, {
        year: save.time.year,
        week: save.time.week,
        dayOfWeek: save.time.dayOfWeek,
      })
    : undefined;
  const durationLabel = traitDuration
    ? t('traits.duration.remainingDays', { count: traitDuration.days })
    : null;
  const className = `side-menu__alert side-menu__alert--${alert.severity}`;
  const content = (
    <>
      <span className="side-menu__alert-subject">
        {gladiator ? (
          <>
            <GladiatorPortrait gladiator={gladiator} size="small" />
            <strong>{gladiator.name}</strong>
          </>
        ) : building && buildingDefinition && buildingId ? (
          <>
            <BuildingAvatar buildingId={buildingId} level={building.level} size="small" />
            <strong>{t(buildingDefinition.nameKey)}</strong>
          </>
        ) : (
          <span className="side-menu__alert-icon">
            <GameIcon
              color={traitDefinition?.visual.color}
              name={(traitDefinition?.visual.iconName ?? 'alert') as GameIconName}
              size={22}
            />
          </span>
        )}
      </span>
      <span className="side-menu__alert-copy">
        <strong>{t(alert.titleKey)}</strong>
        {durationLabel ? <span>{durationLabel}</span> : null}
      </span>
    </>
  );

  const actionHandler =
    alert.actionKind === 'openWeeklyPlanning'
      ? onOpenWeeklyPlanning
      : alert.actionKind === 'openFinance'
        ? onOpenFinance
        : alert.actionKind === 'openMarket'
          ? onOpenMarket
          : gladiator
            ? () => onOpenGladiator(gladiator.id)
            : buildingId && buildingDefinition
              ? () => onOpenBuilding(buildingId)
              : null;

  if (actionHandler) {
    return (
      <button className={className} type="button" onClick={actionHandler}>
        {content}
      </button>
    );
  }

  return <span className={className}>{content}</span>;
}
