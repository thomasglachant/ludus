import { useState } from 'react';
import type { MapLocationDefinition, MapLocationId } from '../../game-data/map-layout';
import { useGameStore } from '../../state/game-store';
import { useUiStore } from '../../state/ui-store';
import { TopHud } from '../hud/TopHud';
import { LudusMap } from '../map/LudusMap';
import { BottomGladiatorRoster } from '../roster/BottomGladiatorRoster';
import type { ContextPanelKind } from './game-shell-types';
import { LeftNavigationRail } from './LeftNavigationRail';
import { ToastAndAlertLayer } from './ToastAndAlertLayer';

export function GameShell() {
  const {
    currentSave,
    errorKey,
    hasUnsavedChanges,
    isLoading,
    isSaving,
    lastSavedAt,
    resetActiveDemo,
    saveCurrentGame,
    saveNoticeKey,
    setGameSpeed,
  } = useGameStore();
  const { activeModal, openModal } = useUiStore();
  const [selectedLocationId, setSelectedLocationId] = useState<MapLocationId | null>(null);
  const [selectedGladiatorId, setSelectedGladiatorId] = useState<string | null>(null);
  const [focusGladiatorId, setFocusGladiatorId] = useState<string | undefined>();

  if (!currentSave) {
    return null;
  }

  const activePanelKind: ContextPanelKind | null =
    activeModal?.kind === 'building' ||
    activeModal?.kind === 'gladiator' ||
    activeModal?.kind === 'weeklyPlanning' ||
    activeModal?.kind === 'contracts' ||
    activeModal?.kind === 'events' ||
    activeModal?.kind === 'market' ||
    activeModal?.kind === 'arena'
      ? activeModal.kind
      : null;

  const openPanel = (panelKind: ContextPanelKind) => {
    if (panelKind === 'building' || panelKind === 'gladiator') {
      return;
    }

    openModal({ kind: panelKind });
  };

  const selectLocation = (location: MapLocationDefinition) => {
    setSelectedLocationId(location.id);

    if (location.kind === 'building') {
      openModal({ buildingId: location.id, kind: 'building' });
      return;
    }

    openModal({ kind: location.id === 'market' ? 'market' : 'arena' });
  };

  const selectGladiator = (gladiatorId: string) => {
    setSelectedGladiatorId(gladiatorId);
    setFocusGladiatorId(gladiatorId);
    openModal({ gladiatorId, kind: 'gladiator' });
  };

  return (
    <section className="game-shell">
      <TopHud
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving || isLoading}
        lastSavedAt={lastSavedAt}
        save={currentSave}
        onOpenMenu={() => openModal({ kind: 'gameMenu' })}
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
      <BottomGladiatorRoster
        save={currentSave}
        selectedGladiatorId={selectedGladiatorId ?? undefined}
        onSelectGladiator={selectGladiator}
      />
      <ToastAndAlertLayer errorKey={errorKey} save={currentSave} saveNoticeKey={saveNoticeKey} />
    </section>
  );
}
