import { lazy, Suspense, useCallback } from 'react';
import type { MapLocationDefinition } from '../../game-data/map-layout';
import { useGameStore } from '../../state/game-store-context';
import { useUiStore } from '../../state/ui-store-context';
import { TopHud } from '../hud/TopHud';
import { BottomNavigationBar } from '../navigation/BottomNavigationBar';
import type { ContextPanelKind } from './game-shell-types';
import { ToastAndAlertLayer } from './ToastAndAlertLayer';
import { DebugOverlay } from '../debug/DebugOverlay';

const PixiLudusMap = lazy(() =>
  import('../map/PixiLudusMap').then((module) => ({
    default: module.PixiLudusMap,
  })),
);

export function GameShell() {
  const {
    currentSave,
    errorKey,
    gameClockLabel,
    isGamePaused,
    isLoading,
    saveNoticeKey,
    toggleGamePause,
  } = useGameStore();
  const { activeModal, navigate, openModal, t } = useUiStore();

  const activePanelKind: ContextPanelKind | null =
    activeModal?.kind === 'building' ||
    activeModal?.kind === 'gladiator' ||
    activeModal?.kind === 'weeklyPlanning' ||
    activeModal?.kind === 'buildingsList' ||
    activeModal?.kind === 'gladiatorsList' ||
    activeModal?.kind === 'finance' ||
    activeModal?.kind === 'events' ||
    activeModal?.kind === 'market' ||
    activeModal?.kind === 'arena'
      ? activeModal.kind
      : null;

  const openPanel = useCallback(
    (panelKind: ContextPanelKind) => {
      if (panelKind === 'building' || panelKind === 'gladiator') {
        return;
      }

      if (panelKind === 'arena' && currentSave?.arena.arenaDay) {
        navigate('arena', { gameId: currentSave.gameId });
        return;
      }

      openModal({ kind: panelKind });
    },
    [currentSave, navigate, openModal],
  );

  const selectLocation = useCallback(
    (location: MapLocationDefinition) => {
      if (!currentSave) {
        return;
      }

      if (location.kind === 'building') {
        openModal({ buildingId: location.id, kind: 'building' });
        return;
      }

      if (location.id === 'arena' && currentSave.arena.arenaDay) {
        navigate('arena', { gameId: currentSave.gameId });
        return;
      }

      openModal({ kind: location.id === 'market' ? 'market' : 'arena' });
    },
    [currentSave, navigate, openModal],
  );

  const selectGladiator = useCallback(
    (gladiatorId: string) => {
      openModal({ gladiatorId, kind: 'gladiator' });
    },
    [openModal],
  );

  if (!currentSave) {
    return (
      <section className="game-shell">
        <p className={errorKey ? 'form-error' : 'empty-state'}>
          {t(errorKey ?? (isLoading ? 'common.loading' : 'loadGame.error'))}
        </p>
      </section>
    );
  }

  return (
    <section className="game-shell">
      <TopHud
        clockLabel={gameClockLabel}
        isPaused={isGamePaused}
        save={currentSave}
        onOpenDomus={() => {
          openModal({ buildingId: 'domus', kind: 'building' });
        }}
        onTogglePause={toggleGamePause}
        onOpenMenu={() => {
          openModal({ kind: 'gameMenu' });
        }}
        onOpenFinance={() => {
          openModal({ kind: 'finance' });
        }}
      />
      <main className="game-shell__map-stage">
        <Suspense fallback={<p className="empty-state">{t('common.loading')}</p>}>
          <PixiLudusMap save={currentSave} onLocationSelect={selectLocation} />
        </Suspense>
      </main>
      <BottomNavigationBar
        activePanelKind={activePanelKind}
        save={currentSave}
        onOpenPanel={openPanel}
      />
      <ToastAndAlertLayer
        errorKey={errorKey}
        save={currentSave}
        saveNoticeKey={saveNoticeKey}
        showAlerts={false}
        onGladiatorSelect={selectGladiator}
      />
      <DebugOverlay />
    </section>
  );
}
