import type { BuildingId, GameAlert, GameSave } from '../../domain/types';
import {
  getGladiatorTraitDefinition,
  getRemainingGladiatorTraitDuration,
} from '../../domain/gladiator-traits/gladiator-trait-actions';
import { BUILDING_DEFINITIONS } from '../../game-data/buildings';
import { useUiStore } from '../../state/ui-store-context';
import { BuildingAvatar } from '../buildings/BuildingAvatar';
import { GameIcon, type GameIconName } from '../icons/GameIcon';
import { GladiatorPortrait } from '../roster/GladiatorPortrait';
import { GameActionDock, type GameActionDockAction } from './GameActionDock';
import { ShellWidgetPanel } from './ShellWidgetPanel';

interface SideMenuProps {
  actions?: GameActionDockAction[];
  save: GameSave;
  onOpenBuilding(buildingId: BuildingId): void;
  onOpenGladiator(gladiatorId: string): void;
  onOpenMarket(): void;
  onOpenWeeklyPlanning(): void;
}

interface AlertsListProps extends SideMenuProps {
  alerts: GameAlert[];
}

interface AlertItemProps extends SideMenuProps {
  alert: GameAlert;
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
  onOpenMarket,
  onOpenWeeklyPlanning,
}: SideMenuProps) {
  const { t } = useUiStore();

  return (
    <aside className="side-menu" aria-label={t('sideMenu.title')}>
      <ShellWidgetPanel className="side-menu__alerts-panel">
        <h2>{t('buildingsOverview.alertsTitle')}</h2>
        <AlertsList
          alerts={save.planning.alerts}
          save={save}
          onOpenBuilding={onOpenBuilding}
          onOpenGladiator={onOpenGladiator}
          onOpenMarket={onOpenMarket}
          onOpenWeeklyPlanning={onOpenWeeklyPlanning}
        />
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
  onOpenMarket,
  onOpenWeeklyPlanning,
}: AlertsListProps) {
  const { t } = useUiStore();
  const sortedAlerts = sortAlertsBySeverity(alerts);

  if (alerts.length === 0) {
    return (
      <div className="side-menu__alerts-list">
        <p className="side-menu__empty">{t('buildingsOverview.noAlerts')}</p>
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
