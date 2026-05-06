import './buildings.css';
import type { BuildingId, GameSave } from '@/domain/types';
import { BUILDING_DEFINITIONS, BUILDING_IDS } from '@/game-data/buildings';
import { useUiStore } from '@/state/ui-store-context';
import { BuildingAvatar } from '@/ui/features/buildings/BuildingAvatar';
import { EntityList, EntityListRow } from '@/ui/shared/components/EntityList';

interface BuildingsListPanelProps {
  save: GameSave;
  onClose(): void;
  onOpenBuilding(buildingId: BuildingId): void;
}

export function BuildingsListPanel({ onOpenBuilding, save }: BuildingsListPanelProps) {
  const { t } = useUiStore();
  const buildingIds = BUILDING_IDS.filter((buildingId) => save.buildings[buildingId].isPurchased);

  return (
    <section className="panel-shell panel-shell--wide" data-testid="buildings-list-panel">
      <div className="building-list-groups">
        {buildingIds.length > 0 ? (
          <section className="building-list-group">
            <h3>{t('buildingsList.purchased')}</h3>
            <EntityList>
              {buildingIds.map((buildingId) => {
                const building = save.buildings[buildingId];
                const definition = BUILDING_DEFINITIONS[buildingId];

                return (
                  <EntityListRow
                    avatar={
                      <BuildingAvatar buildingId={buildingId} level={building.level} size="small" />
                    }
                    info={[
                      {
                        iconName: 'landmark',
                        id: 'level',
                        label: t('buildingPanel.level'),
                        value: building.level,
                      },
                    ]}
                    key={buildingId}
                    openLabel={t('location.open', { name: t(definition.nameKey) })}
                    subtitle={t(definition.descriptionKey)}
                    testId={`buildings-list-${buildingId}`}
                    title={t(definition.nameKey)}
                    onOpen={() => onOpenBuilding(buildingId)}
                  />
                );
              })}
            </EntityList>
          </section>
        ) : null}
      </div>
    </section>
  );
}
