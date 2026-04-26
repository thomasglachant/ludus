import { useState } from 'react';
import type { BuildingId } from '../../domain/types';
import type { MapLocationDefinition, MapLocationId } from '../../game-data/map-layout';
import { useGameStore } from '../../state/game-store';
import { useUiStore } from '../../state/ui-store';
import { CombatScreen } from '../combat/CombatScreen';
import { TopHud } from '../hud/TopHud';
import { LudusMap } from '../map/LudusMap';
import { GameMenuModal } from '../modals/GameMenuModal';
import { LoadGameModal } from '../modals/LoadGameModal';
import { OptionsModal } from '../modals/OptionsModal';
import { BottomGladiatorRoster } from '../roster/BottomGladiatorRoster';
import { ContextualPanelHost } from '../panels/ContextualPanelHost';
import type { ContextPanelKind } from './game-shell-types';
import { LeftNavigationRail } from './LeftNavigationRail';
import { ToastAndAlertLayer } from './ToastAndAlertLayer';

type GameDialog = 'menu' | 'loadGame' | 'options';

export function GameShell() {
  const {
    acceptWeeklyContract,
    applyPlanningRecommendations,
    currentSave,
    errorKey,
    hasUnsavedChanges,
    isLoading,
    isSaving,
    lastSavedAt,
    purchaseBuilding,
    purchaseBuildingImprovement,
    purchaseDormitoryBed,
    resetActiveDemo,
    resolveGameEventChoice,
    saveCurrentGame,
    saveCurrentGameAs,
    saveNoticeKey,
    scoutOpponent,
    selectBuildingPolicy,
    setGameSpeed,
    updateGladiatorRoutine,
    upgradeBuilding,
  } = useGameStore();
  const { navigate, openConfirmModal, openFormModal } = useUiStore();
  const [activePanelKind, setActivePanelKind] = useState<ContextPanelKind | null>(null);
  const [activeDialog, setActiveDialog] = useState<GameDialog | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<MapLocationId | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<BuildingId | null>(null);
  const [selectedGladiatorId, setSelectedGladiatorId] = useState<string | null>(null);
  const [focusGladiatorId, setFocusGladiatorId] = useState<string | undefined>();
  const [activeCombatId, setActiveCombatId] = useState<string | undefined>();

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

  const closeGameDialog = () => {
    setActiveDialog(null);
  };

  const openArenaCombat = (combatId: string) => {
    setActiveCombatId(combatId);
  };

  const saveGameFromMenu = () => {
    void saveCurrentGame().then(closeGameDialog);
  };

  const openSaveAsDialog = () => {
    closeGameDialog();
    openFormModal({
      fields: [
        {
          defaultValue: currentSave.player.ludusName,
          id: 'ludusName',
          labelKey: 'newGame.ludusName',
          required: true,
        },
      ],
      kind: 'form',
      onSubmit: (values) => {
        void saveCurrentGameAs({ ludusName: values.ludusName });
      },
      submitLabelKey: 'gameMenu.saveAs',
      titleKey: 'gameMenu.saveAsTitle',
    });
  };

  const quitToMainMenu = () => {
    closeGameDialog();
    navigate('mainMenu');
  };

  const requestQuit = () => {
    if (!hasUnsavedChanges || currentSave.metadata?.isDemo) {
      quitToMainMenu();
      return;
    }

    closeGameDialog();
    openConfirmModal({
      confirmLabelKey: 'gameMenu.quit',
      kind: 'confirm',
      messageKey: 'gameMenu.quitUnsavedMessage',
      onConfirm: quitToMainMenu,
      testId: 'quit-unsaved-confirmation',
      titleKey: 'gameMenu.quitUnsavedTitle',
      tone: 'danger',
    });
  };

  return (
    <section className="game-shell">
      <TopHud
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving || isLoading}
        lastSavedAt={lastSavedAt}
        save={currentSave}
        onOpenMenu={() => setActiveDialog('menu')}
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
        onOpenArenaCombat={openArenaCombat}
        onPurchaseBuilding={purchaseBuilding}
        onPurchaseBuildingImprovement={purchaseBuildingImprovement}
        onPurchaseDormitoryBed={purchaseDormitoryBed}
        onResolveEventChoice={resolveGameEventChoice}
        onScoutOpponent={scoutOpponent}
        onSelectBuildingPolicy={selectBuildingPolicy}
        onUpdateGladiatorRoutine={updateGladiatorRoutine}
        onUpgradeBuilding={upgradeBuilding}
      />
      {activeCombatId ? (
        <CombatScreen
          combatId={activeCombatId}
          save={currentSave}
          onClose={() => setActiveCombatId(undefined)}
          onOpenMenu={() => setActiveDialog('menu')}
          onSpeedChange={setGameSpeed}
        />
      ) : null}
      <BottomGladiatorRoster
        save={currentSave}
        selectedGladiatorId={selectedGladiatorId ?? undefined}
        onSelectGladiator={selectGladiator}
      />
      <ToastAndAlertLayer errorKey={errorKey} save={currentSave} saveNoticeKey={saveNoticeKey} />
      {activeDialog === 'menu' ? (
        <GameMenuModal
          hasUnsavedChanges={hasUnsavedChanges}
          isDemoSave={Boolean(currentSave.metadata?.isDemo)}
          isSaving={isSaving || isLoading}
          onClose={closeGameDialog}
          onOpenLoadGame={() => setActiveDialog('loadGame')}
          onOpenOptions={() => setActiveDialog('options')}
          onQuit={requestQuit}
          onSave={saveGameFromMenu}
          onSaveAs={openSaveAsDialog}
        />
      ) : null}
      {activeDialog === 'loadGame' ? <LoadGameModal onClose={closeGameDialog} /> : null}
      {activeDialog === 'options' ? <OptionsModal onClose={closeGameDialog} /> : null}
    </section>
  );
}
