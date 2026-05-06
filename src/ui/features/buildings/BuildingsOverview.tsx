import './buildings.css';
import type { BuildingId, GameAlert, GameSave } from '@/domain/types';
import { BUILDING_DEFINITIONS, BUILDING_IDS } from '@/game-data/buildings';
import { getBuildingAssetSet } from '@/game-data/visual-assets';
import { useUiStore } from '@/state/ui-store-context';
import { GameIcon } from '@/ui/shared/icons/GameIcon';

interface BuildingsOverviewProps {
  className?: string;
  save: GameSave;
  selectedBuildingId?: BuildingId;
  showHeader?: boolean;
  variant?: 'embedded' | 'standalone';
  onOpenBuilding(buildingId: BuildingId): void;
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
  className,
  onOpenBuilding,
  save,
  selectedBuildingId,
  showHeader = true,
  variant = 'standalone',
}: BuildingsOverviewProps) {
  const { t } = useUiStore();
  const purchasedBuildingIds = BUILDING_IDS.filter(
    (buildingId) => save.buildings[buildingId].isPurchased,
  );

  return (
    <section
      className={['buildings-overview', `buildings-overview--${variant}`, className]
        .filter(Boolean)
        .join(' ')}
      aria-label={t('buildingsOverview.title')}
    >
      {showHeader ? (
        <div className="buildings-overview__header">
          <div>
            <span className="buildings-overview__eyebrow">{t('buildingsOverview.eyebrow')}</span>
            <h1>{t('buildingsOverview.title')}</h1>
          </div>
        </div>
      ) : null}

      <div className="buildings-overview__content">
        <div className="buildings-overview__grid">
          {purchasedBuildingIds.map((buildingId) => {
            const building = save.buildings[buildingId];
            const definition = BUILDING_DEFINITIONS[buildingId];
            const assetSet = getBuildingAssetSet(buildingId, building.level);
            const alerts = getBuildingAlerts(save, buildingId);
            const alertSeverity = getHighestAlertSeverity(alerts);

            return (
              <button
                className={[
                  'building-overview-card',
                  `building-overview-card--${buildingId}`,
                  selectedBuildingId === buildingId ? 'is-selected' : '',
                  alertSeverity ? `building-overview-card--${alertSeverity}` : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                data-testid={`building-overview-${buildingId}`}
                key={buildingId}
                type="button"
                aria-pressed={selectedBuildingId === buildingId}
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
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
