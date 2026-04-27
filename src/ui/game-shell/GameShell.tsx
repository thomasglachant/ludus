import { lazy, Suspense, useState } from 'react';
import type { MapLocationDefinition } from '../../game-data/map-layout';
import { useGameStore } from '../../state/game-store';
import { useUiStore } from '../../state/ui-store';
import { TopHud } from '../hud/TopHud';
import { BottomGladiatorRoster } from '../roster/BottomGladiatorRoster';
import type { ContextPanelKind } from './game-shell-types';
import { LeftNavigationRail } from './LeftNavigationRail';
import { ToastAndAlertLayer } from './ToastAndAlertLayer';

const PixiLudusMap = lazy(() =>
  import('../map/PixiLudusMap').then((module) => ({
    default: module.PixiLudusMap,
  })),
);

export function GameShell() {
  const {
    currentSave,
    errorKey,
    isLoading,
    isSaving,
    saveCurrentGame,
    saveNoticeKey,
    setGameSpeed,
  } = useGameStore();
  const { activeModal, openModal, t } = useUiStore();
  const [selectedGladiatorId, setSelectedGladiatorId] = useState<string | null>(null);
  const [areAlertsOpen, setAreAlertsOpen] = useState(false);

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

    setAreAlertsOpen(false);
    openModal({ kind: panelKind });
  };

  const selectLocation = (location: MapLocationDefinition) => {
    setAreAlertsOpen(false);

    if (location.kind === 'building') {
      openModal({ buildingId: location.id, kind: 'building' });
      return;
    }

    openModal({ kind: location.id === 'market' ? 'market' : 'arena' });
  };

  const selectGladiator = (gladiatorId: string) => {
    setAreAlertsOpen(false);
    setSelectedGladiatorId(gladiatorId);
    openModal({ gladiatorId, kind: 'gladiator' });
  };

  return (
    <section className="game-shell">
      <TopHud
        alertCount={currentSave.planning.alerts.length}
        areAlertsOpen={areAlertsOpen}
        isSaving={isSaving || isLoading}
        save={currentSave}
        onAlertsToggle={() => setAreAlertsOpen((isOpen) => !isOpen)}
        onOpenMenu={() => {
          setAreAlertsOpen(false);
          openModal({ kind: 'gameMenu' });
        }}
        onSave={() => void saveCurrentGame()}
        onSpeedChange={setGameSpeed}
      />
      <LeftNavigationRail activePanelKind={activePanelKind} onOpenPanel={openPanel} />
      <main className="game-shell__map-stage">
        <Suspense fallback={<p className="empty-state">{t('common.loading')}</p>}>
          <PixiLudusMap save={currentSave} onLocationSelect={selectLocation} />
        </Suspense>
      </main>
      <BottomGladiatorRoster
        save={currentSave}
        selectedGladiatorId={selectedGladiatorId ?? undefined}
        onSelectGladiator={selectGladiator}
      />
      <ToastAndAlertLayer
        errorKey={errorKey}
        save={currentSave}
        saveNoticeKey={saveNoticeKey}
        showAlerts={areAlertsOpen}
        onGladiatorSelect={selectGladiator}
      />
    </section>
  );
}
