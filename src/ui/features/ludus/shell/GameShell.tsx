import './ludus-shell.css';
import { useCallback } from 'react';
import type { BuildingId } from '@/domain/types';
import { useGameStore } from '@/state/game-store-context';
import { useUiStore } from '@/state/ui-store-context';
import { GameStatusMessage } from '@/ui/shared/ludus/GameFeedback';
import { TopHud } from '@/ui/features/ludus/shell/TopHud';
import { ScenicScreen } from '@/ui/app-shell/ScenicScreen';
import { BottomNavigationBar } from '@/ui/features/ludus/shell/BottomNavigationBar';
import { PRIMARY_NAVIGATION_KINDS, type PrimaryNavigationKind } from './game-shell-types';
import type { GameActionDockAction } from './GameActionDock';
import { ToastAndAlertLayer } from './ToastAndAlertLayer';
import { SideMenu } from './SideMenu';
import { SurfaceHost } from '@/ui/features/ludus/surfaces/SurfaceHost';
import { GameOverModal } from './GameOverModal';

export function GameShell() {
  const {
    archiveNotification,
    currentSave,
    errorKey,
    gameClockLabel,
    isGamePaused,
    isTimeControlLocked,
    isLoading,
    resolvePendingGameAction,
    saveNoticeKey,
    toggleGamePause,
  } = useGameStore();
  const { activeSurface, navigate, openEntity, openModal, openSurface } = useUiStore();

  const activePanelKind = PRIMARY_NAVIGATION_KINDS.includes(
    activeSurface.kind as PrimaryNavigationKind,
  )
    ? (activeSurface.kind as PrimaryNavigationKind)
    : undefined;

  const openPanel = useCallback(
    (panelKind: PrimaryNavigationKind) => {
      openSurface({ kind: panelKind });
    },
    [openSurface],
  );

  const selectBuilding = useCallback(
    (buildingId: BuildingId) =>
      openEntity({ buildingId, kind: 'building' }, { presentation: 'surface', source: 'building' }),
    [openEntity],
  );

  const selectGladiator = useCallback(
    (gladiatorId: string) => {
      openEntity({ gladiatorId, kind: 'gladiator' }, { presentation: 'surface', source: 'alert' });
    },
    [openEntity],
  );

  if (!currentSave) {
    return (
      <ScenicScreen className="game-shell">
        <GameStatusMessage
          messageKey={errorKey ?? (isLoading ? 'common.loading' : 'loadGame.error')}
          surface="dark"
          tone={errorKey ? 'danger' : 'info'}
        />
      </ScenicScreen>
    );
  }

  const dockActions: GameActionDockAction[] =
    currentSave.time.pendingActionTrigger === 'startWeek'
      ? [
          {
            descriptionKey: 'gameActionDock.startWeekDescription',
            iconName: 'play',
            id: 'startWeek',
            labelKey: 'gameActionDock.startWeek',
            titleKey: 'gameActionDock.startWeekTitle',
            onTrigger: () => resolvePendingGameAction('startWeek'),
          },
        ]
      : currentSave.time.pendingActionTrigger === 'enterArena'
        ? [
            {
              descriptionKey: 'gameActionDock.enterArenaDescription',
              iconName: 'victory',
              id: 'enterArena',
              labelKey: 'gameActionDock.enterArena',
              titleKey: 'gameActionDock.enterArenaTitle',
              onTrigger: () => resolvePendingGameAction('enterArena'),
            },
          ]
        : [];

  return (
    <ScenicScreen className="game-shell">
      <TopHud
        clockLabel={gameClockLabel}
        isPaused={isGamePaused}
        isTimeControlLocked={isTimeControlLocked}
        save={currentSave}
        onOpenDomus={() => {
          openEntity(
            { buildingId: 'domus', kind: 'building' },
            { presentation: 'surface', source: 'building' },
          );
        }}
        onTogglePause={toggleGamePause}
        onOpenMenu={() => {
          openModal({ kind: 'gameMenu' });
        }}
        onOpenFinance={() => {
          openSurface({ kind: 'finance' });
        }}
      />
      <div className="game-shell__middle">
        <main className="game-shell__main-stage">
          <SurfaceHost />
        </main>
        <SideMenu
          actions={dockActions}
          save={currentSave}
          onArchiveNotification={archiveNotification}
          onOpenBuilding={selectBuilding}
          onOpenFinance={() => openSurface({ kind: 'finance' })}
          onOpenGladiator={selectGladiator}
          onOpenMarket={() => openSurface({ kind: 'market' })}
          onOpenNotifications={() => openSurface({ kind: 'notifications' })}
          onOpenWeeklyPlanning={() => openSurface({ kind: 'planning' })}
        />
      </div>
      <div className="game-shell__bottom">
        <BottomNavigationBar
          activePanelKind={activePanelKind}
          save={currentSave}
          onOpenPanel={openPanel}
        />
      </div>
      <ToastAndAlertLayer errorKey={errorKey} saveNoticeKey={saveNoticeKey} />
      {currentSave.ludus.gameStatus === 'lost' ? (
        <GameOverModal onNewGame={() => navigate('newGame')} />
      ) : null}
    </ScenicScreen>
  );
}
