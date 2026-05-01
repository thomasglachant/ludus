import { getBuildingPurchaseAvailability } from '../../domain/buildings/building-unlocks';
import type { BuildingId, GameSave } from '../../domain/types';
import { BUILDING_DEFINITIONS, BUILDING_IDS } from '../../game-data/buildings';
import { useUiStore } from '../../state/ui-store-context';
import { Badge, MetricList, PanelShell, SectionCard } from '../components/shared';
import { formatMoneyAmount } from '../formatters/money';

interface BuildingsListPanelProps {
  save: GameSave;
  onClose(): void;
  onOpenBuilding(buildingId: BuildingId): void;
}

export function BuildingsListPanel({ onClose, onOpenBuilding, save }: BuildingsListPanelProps) {
  const { t } = useUiStore();
  const groups = [
    {
      id: 'purchased',
      titleKey: 'buildingsList.purchased',
      buildingIds: BUILDING_IDS.filter(
        (buildingId) => getBuildingPurchaseAvailability(save, buildingId).status === 'purchased',
      ),
    },
    {
      id: 'available',
      titleKey: 'buildingsList.available',
      buildingIds: BUILDING_IDS.filter((buildingId) => {
        return getBuildingPurchaseAvailability(save, buildingId).status === 'available';
      }),
    },
    {
      id: 'locked',
      titleKey: 'buildingsList.locked',
      buildingIds: BUILDING_IDS.filter((buildingId) => {
        return getBuildingPurchaseAvailability(save, buildingId).status === 'locked';
      }),
    },
  ];

  return (
    <PanelShell
      eyebrowKey="buildings.panelTitle"
      titleKey="navigation.buildings"
      testId="buildings-list-panel"
      wide
      onClose={onClose}
    >
      <div className="building-list-groups">
        {groups.map((group) =>
          group.buildingIds.length > 0 ? (
            <section className="building-list-group" key={group.id}>
              <h3>{t(group.titleKey)}</h3>
              <div className="planning-card-grid planning-card-grid--compact">
                {group.buildingIds.map((buildingId) => {
                  const building = save.buildings[buildingId];
                  const definition = BUILDING_DEFINITIONS[buildingId];
                  const purchaseAvailability = getBuildingPurchaseAvailability(save, buildingId);
                  const isAvailable = purchaseAvailability.status === 'available';
                  const statusLabelKey =
                    purchaseAvailability.status === 'purchased'
                      ? 'common.purchased'
                      : isAvailable
                        ? 'buildingsList.availableStatus'
                        : 'buildingsList.lockedStatus';
                  const statusTone = building.isPurchased
                    ? 'success'
                    : isAvailable
                      ? 'warning'
                      : 'neutral';

                  return (
                    <SectionCard key={buildingId} testId={`buildings-list-${buildingId}`}>
                      <div className="building-list-card__header">
                        <strong>{t(definition.nameKey)}</strong>
                        <Badge label={t(statusLabelKey)} tone={statusTone} />
                      </div>
                      <span>{t(definition.descriptionKey)}</span>
                      <MetricList
                        columns={2}
                        items={[
                          { labelKey: 'buildingPanel.level', value: building.level },
                          {
                            labelKey: 'buildingPanel.efficiency',
                            value: `${building.efficiency}%`,
                          },
                          {
                            labelKey: 'buildings.requiredDomus',
                            value: t('common.level', {
                              level: purchaseAvailability.requiredDomusLevel,
                            }),
                          },
                          {
                            labelKey: 'buildings.purchaseCostLabel',
                            value: purchaseAvailability.isPurchased
                              ? t('common.purchased')
                              : purchaseAvailability.purchaseCost
                                ? formatMoneyAmount(purchaseAvailability.purchaseCost)
                                : t('common.empty'),
                          },
                        ]}
                      />
                      <div className="context-panel__actions">
                        <button type="button" onClick={() => onOpenBuilding(buildingId)}>
                          <span>{t('common.open')}</span>
                        </button>
                      </div>
                    </SectionCard>
                  );
                })}
              </div>
            </section>
          ) : null,
        )}
      </div>
    </PanelShell>
  );
}
