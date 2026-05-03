import type { BuildingId, GameSave } from '../../domain/types';
import { BUILDING_DEFINITIONS, BUILDING_IDS } from '../../game-data/buildings';
import { useUiStore } from '../../state/ui-store-context';
import { BuildingAvatar } from '../buildings/BuildingAvatar';
import { EntityList, EntityListRow } from '../components/EntityList';
import { PanelShell } from '../components/shared';

interface BuildingsListPanelProps {
  save: GameSave;
  onClose(): void;
  onOpenBuilding(buildingId: BuildingId): void;
}

export function BuildingsListPanel({ onClose, onOpenBuilding, save }: BuildingsListPanelProps) {
  const { t } = useUiStore();
  const buildingIds = BUILDING_IDS.filter((buildingId) => save.buildings[buildingId].isPurchased);

  return (
    <PanelShell
      eyebrowKey="buildings.panelTitle"
      titleKey="navigation.buildings"
      testId="buildings-list-panel"
      wide
      onClose={onClose}
    >
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
                    avatar={<BuildingAvatar buildingId={buildingId} size="small" />}
                    info={[
                      {
                        iconName: 'landmark',
                        id: 'level',
                        label: t('buildingPanel.level'),
                        value: building.level,
                      },
                      {
                        iconName: 'workforce',
                        id: 'efficiency',
                        label: t('buildingPanel.efficiency'),
                        value: `${building.efficiency}%`,
                      },
                    ]}
                    key={buildingId}
                    openLabel={t('map.openLocation', { name: t(definition.nameKey) })}
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
    </PanelShell>
  );
}
