import type { BuildingId, GameAlert, GameSave } from '../../domain/types';
import { BUILDING_DEFINITIONS, BUILDING_IDS } from '../../game-data/buildings';
import { getBuildingAssetSet } from '../../game-data/visual-assets';
import { useUiStore } from '../../state/ui-store-context';
import { GameIcon } from '../icons/GameIcon';

interface BuildingsOverviewProps {
  save: GameSave;
  onOpenBuilding(buildingId: BuildingId): void;
  onOpenPlanning(): void;
}

function getBuildingAlerts(save: GameSave, buildingId: BuildingId) {
  return save.planning.alerts.filter((alert) => alert.buildingId === buildingId);
}

function getHighestAlertSeverity(alerts: GameAlert[]) {
  if (alerts.some((alert) => alert.severity === 'critical')) {
    return 'critical';
  }

  if (alerts.some((alert) => alert.severity === 'warning')) {
    return 'warning';
  }

  return alerts.length > 0 ? 'info' : undefined;
}

export function BuildingsOverview({
  onOpenBuilding,
  onOpenPlanning,
  save,
}: BuildingsOverviewProps) {
  const { t } = useUiStore();
  const purchasedBuildingIds = BUILDING_IDS.filter(
    (buildingId) => save.buildings[buildingId].isPurchased,
  );
  const unassignedAlertCount = save.planning.alerts.filter((alert) => !alert.buildingId).length;

  return (
    <section className="buildings-overview" aria-label={t('buildingsOverview.title')}>
      <div className="buildings-overview__header">
        <div>
          <span className="buildings-overview__eyebrow">{t('buildingsOverview.eyebrow')}</span>
          <h1>{t('buildingsOverview.title')}</h1>
        </div>
      </div>

      <div className="buildings-overview__content">
        <div className="buildings-overview__grid">
          {purchasedBuildingIds.map((buildingId) => {
            const building = save.buildings[buildingId];
            const definition = BUILDING_DEFINITIONS[buildingId];
            const assetSet = getBuildingAssetSet(buildingId, building.level);
            const alerts = getBuildingAlerts(save, buildingId);
            const alertSeverity = getHighestAlertSeverity(alerts);
            const requiredStaff = definition.requiredStaffByLevel?.[building.level] ?? 0;

            return (
              <button
                className={[
                  'building-overview-card',
                  `building-overview-card--${buildingId}`,
                  alertSeverity ? `building-overview-card--${alertSeverity}` : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                data-testid={`building-overview-${buildingId}`}
                key={buildingId}
                type="button"
                onClick={() => onOpenBuilding(buildingId)}
              >
                <span className="building-overview-card__visual">
                  {assetSet?.exterior ? (
                    <img alt="" src={assetSet.exterior} />
                  ) : (
                    <GameIcon
                      name={buildingId === 'trainingGround' ? 'training' : 'landmark'}
                      size={56}
                    />
                  )}
                </span>
                <span className="building-overview-card__body">
                  <span className="building-overview-card__title-row">
                    <strong>{t(definition.nameKey)}</strong>
                    {alerts.length > 0 ? (
                      <span className="building-overview-card__alert-badge">
                        <GameIcon name="alert" size={15} />
                        {alerts.length}
                      </span>
                    ) : null}
                  </span>
                  <span className="building-overview-card__description">
                    {t(definition.descriptionKey)}
                  </span>
                  <span className="building-overview-card__metrics">
                    <span>
                      <GameIcon name="landmark" size={16} />
                      {t('buildingsOverview.levelValue', { level: building.level })}
                    </span>
                    <span>
                      <GameIcon name="workforce" size={16} />
                      {requiredStaff > 0
                        ? t('buildingsOverview.staffValue', {
                            current: building.staffAssignmentIds.length,
                            required: requiredStaff,
                          })
                        : t('buildingsOverview.noStaffRequired')}
                    </span>
                    <span>
                      <GameIcon name="energy" size={16} />
                      {t('buildingsOverview.efficiencyValue', { value: building.efficiency })}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <aside className="buildings-overview__side-panel">
          <section className="buildings-overview__alerts">
            <h2>{t('buildingsOverview.alertsTitle')}</h2>
            {save.planning.alerts.length > 0 ? (
              <div className="buildings-overview__alert-list">
                {save.planning.alerts.slice(0, 4).map((alert) => (
                  <span
                    className={`buildings-overview__alert buildings-overview__alert--${alert.severity}`}
                    key={alert.id}
                  >
                    <GameIcon name="alert" size={16} />
                    {t(alert.titleKey)}
                  </span>
                ))}
                {unassignedAlertCount > 0 ? (
                  <button type="button" onClick={onOpenPlanning}>
                    {t('buildingsOverview.unassignedAlerts', { count: unassignedAlertCount })}
                  </button>
                ) : null}
              </div>
            ) : (
              <p>{t('buildingsOverview.noAlerts')}</p>
            )}
          </section>
        </aside>
      </div>
    </section>
  );
}
