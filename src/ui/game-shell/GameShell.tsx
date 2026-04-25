import { useState } from 'react';
import type { BuildingId } from '../../domain/types';
import type { MapLocationDefinition, MapLocationId } from '../../game-data/map-layout';
import { useGameStore } from '../../state/game-store';
import { TopHud } from '../hud/TopHud';
import { LudusMap } from '../map/LudusMap';
import { BottomGladiatorRoster } from '../roster/BottomGladiatorRoster';
import { ContextualPanelHost } from '../panels/ContextualPanelHost';
import type { ContextPanelKind } from './game-shell-types';
import { LeftNavigationRail } from './LeftNavigationRail';
import { ToastAndAlertLayer } from './ToastAndAlertLayer';

export function GameShell() {
  const {
    acceptWeeklyContract,
    applyPlanningRecommendations,
    currentSave,
    errorKey,
    isLoading,
    purchaseBuilding,
    purchaseBuildingImprovement,
    purchaseDormitoryBed,
    resetActiveDemo,
    resolveGameEventChoice,
    saveCurrentGame,
    scoutOpponent,
    selectBuildingPolicy,
    setGameSpeed,
    updateGladiatorRoutine,
    upgradeBuilding,
  } = useGameStore();
  const [activePanelKind, setActivePanelKind] = useState<ContextPanelKind | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<MapLocationId | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<BuildingId | null>(null);
  const [selectedGladiatorId, setSelectedGladiatorId] = useState<string | null>(null);
  const [focusGladiatorId, setFocusGladiatorId] = useState<string | undefined>();

  if (!currentSave) {
    return null;
  }

  const openPanel = (panelKind: ContextPanelKind) => {
    setActivePanelKind(panelKind);
  };

  const closePanel = () => {
    setActivePanelKind(null);
  };

  const selectLocation = (location: MapLocationDefinition) => {
    setSelectedLocationId(location.id);

    if (location.kind === 'building') {
      setSelectedBuildingId(location.id);
      setActivePanelKind('building');
      return;
    }

    setActivePanelKind(location.id === 'market' ? 'market' : 'arena');
  };

  const selectGladiator = (gladiatorId: string) => {
    setSelectedGladiatorId(gladiatorId);
    setFocusGladiatorId(gladiatorId);
    setActivePanelKind('gladiator');
  };

  return (
    <section className="game-shell">
      <TopHud
        isSaving={isLoading}
        save={currentSave}
        onResetDemo={resetActiveDemo}
        onSave={() => void saveCurrentGame()}
        onSpeedChange={setGameSpeed}
      />
      <LeftNavigationRail
        activePanelKind={activePanelKind}
        alertCount={currentSave.planning.alerts.length}
        onOpenPanel={openPanel}
      />
      <main className="game-shell__map-stage">
        <LudusMap
          focusGladiatorId={focusGladiatorId}
          save={currentSave}
          selectedGladiatorId={selectedGladiatorId ?? undefined}
          selectedLocationId={selectedLocationId}
          onGladiatorSelect={selectGladiator}
          onLocationSelect={selectLocation}
        />
      </main>
      <ContextualPanelHost
        activePanelKind={activePanelKind}
        save={currentSave}
        selectedBuildingId={selectedBuildingId}
        selectedGladiatorId={selectedGladiatorId}
        onAcceptContract={acceptWeeklyContract}
        onApplyPlanningRecommendations={applyPlanningRecommendations}
        onClose={closePanel}
        onPurchaseBuilding={purchaseBuilding}
        onPurchaseBuildingImprovement={purchaseBuildingImprovement}
        onPurchaseDormitoryBed={purchaseDormitoryBed}
        onResolveEventChoice={resolveGameEventChoice}
        onScoutOpponent={scoutOpponent}
        onSelectBuildingPolicy={selectBuildingPolicy}
        onUpdateGladiatorRoutine={updateGladiatorRoutine}
        onUpgradeBuilding={upgradeBuilding}
      />
      <BottomGladiatorRoster
        save={currentSave}
        selectedGladiatorId={selectedGladiatorId ?? undefined}
        onSelectGladiator={selectGladiator}
      />
      <ToastAndAlertLayer errorKey={errorKey} save={currentSave} />
    </section>
  );
}
