import type { GameSave } from '@/domain/types';
import { BUILDING_DEFINITIONS } from '@/game-data/buildings';
import { useGameStore } from '@/state/game-store-context';
import { useUiStore, type BuildingSurfaceTab } from '@/state/ui-store-context';
import { GameSurface, SurfaceHeader } from '@/ui/features/ludus/surfaces/SurfaceFrame';
import { SurfaceContextSheet } from '@/ui/features/ludus/surfaces/SurfaceContextSheet';
import { BuildingPanel } from './BuildingPanel';
import { BuildingsOverview } from './BuildingsOverview';

export function BuildingsSurface({ save }: { save: GameSave }) {
  const { activeSurface, openContextSheet, openSurface } = useUiStore();
  const {
    purchaseBuilding,
    purchaseBuildingImprovement,
    purchaseBuildingSkill,
    selectBuildingPolicy,
    upgradeBuilding,
  } = useGameStore();
  const selectedBuildingId = activeSurface.selectedBuildingId;
  const selectedBuilding =
    selectedBuildingId && save.buildings[selectedBuildingId]?.isPurchased
      ? save.buildings[selectedBuildingId]
      : null;
  const tab = activeSurface.selectedBuildingTab ?? 'overview';

  if (!selectedBuilding || !selectedBuildingId) {
    return (
      <GameSurface className="game-surface--buildings" testId="buildings-surface">
        <SurfaceHeader eyebrowKey="buildingsOverview.eyebrow" titleKey="buildingsOverview.title" />
        <div className="game-surface__body game-surface__body--list buildings-surface__body">
          <BuildingsOverview
            save={save}
            showHeader={false}
            variant="embedded"
            onOpenBuilding={(buildingId) =>
              openSurface({
                kind: 'buildings',
                selectedBuildingId: buildingId,
                selectedBuildingTab: 'overview',
              })
            }
          />
        </div>
      </GameSurface>
    );
  }

  const definition = BUILDING_DEFINITIONS[selectedBuildingId];

  return (
    <GameSurface className="game-surface--buildings" testId="buildings-surface">
      <SurfaceHeader
        backLabelKey="navigation.buildings"
        eyebrowKey="buildingsOverview.eyebrow"
        titleKey={definition.nameKey}
        onBack={() => openSurface({ kind: 'buildings' })}
      />
      <div className="game-surface__body game-surface__body--detail buildings-surface__body">
        <div className="buildings-surface__detail">
          <BuildingPanel
            activeTab={tab}
            buildingId={selectedBuildingId}
            save={save}
            onClose={() => openSurface({ kind: 'buildings' })}
            onOpenGladiator={(gladiatorId) =>
              openContextSheet({ id: gladiatorId, kind: 'gladiator', source: 'building' })
            }
            onPurchaseBuilding={purchaseBuilding}
            onPurchaseBuildingImprovement={purchaseBuildingImprovement}
            onPurchaseBuildingSkill={purchaseBuildingSkill}
            onSelectBuildingPolicy={selectBuildingPolicy}
            onTabChange={(nextTab: BuildingSurfaceTab) =>
              openSurface({
                ...activeSurface,
                kind: 'buildings',
                selectedBuildingId,
                selectedBuildingTab: nextTab,
              })
            }
            onUpgradeBuilding={upgradeBuilding}
          />
        </div>
      </div>
      <SurfaceContextSheet save={save} />
    </GameSurface>
  );
}
