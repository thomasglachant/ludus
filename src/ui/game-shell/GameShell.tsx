import { useCallback } from 'react';
import type { BuildingId } from '../../domain/types';
import { useGameStore } from '../../state/game-store-context';
import { useUiStore } from '../../state/ui-store-context';
import { BuildingsOverview } from '../buildings/BuildingsOverview';
import { TopHud } from '../hud/TopHud';
import { ScenicScreen } from '../layout/ScenicScreen';
import { BottomNavigationBar } from '../navigation/BottomNavigationBar';
import { RightAlertsMenu } from '../alerts/RightAlertsMenu';
import type { ContextPanelKind } from './game-shell-types';
import { ToastAndAlertLayer } from './ToastAndAlertLayer';
import { DebugOverlay } from '../debug/DebugOverlay';

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

  const selectBuilding = useCallback(
    (buildingId: BuildingId) => openModal({ buildingId, kind: 'building' }),
    [openModal],
  );

  const selectGladiator = useCallback(
    (gladiatorId: string) => {
      openModal({ gladiatorId, kind: 'gladiator' });
    },
    [openModal],
  );

  if (!currentSave) {
    return (
      <ScenicScreen className="game-shell">
        <p className={errorKey ? 'form-error' : 'empty-state'}>
          {t(errorKey ?? (isLoading ? 'common.loading' : 'loadGame.error'))}
        </p>
      </ScenicScreen>
    );
  }

  return (
    <ScenicScreen className="game-shell">
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
      <main className="game-shell__main-stage">
        <BuildingsOverview save={currentSave} onOpenBuilding={selectBuilding} />
      </main>
      <RightAlertsMenu
        save={currentSave}
        onOpenBuilding={selectBuilding}
        onOpenGladiator={selectGladiator}
        onOpenMarket={() => openModal({ kind: 'market' })}
        onOpenWeeklyPlanning={() => openModal({ kind: 'weeklyPlanning' })}
      />
      <BottomNavigationBar
        activePanelKind={activePanelKind}
        save={currentSave}
        onOpenPanel={openPanel}
      />
      <ToastAndAlertLayer errorKey={errorKey} saveNoticeKey={saveNoticeKey} />
      <DebugOverlay />
    </ScenicScreen>
  );
}
