import { lazy, Suspense, useCallback, useState } from 'react';
import type { MapLocationDefinition } from '../../game-data/map-layout';
import { useGameStore } from '../../state/game-store-context';
import { useUiStore } from '../../state/ui-store-context';
import { TopHud } from '../hud/TopHud';
import { BottomGladiatorRoster } from '../roster/BottomGladiatorRoster';
import { pixiUiChromeStyle } from '../pixi-ui-chrome';
import type { ContextPanelKind } from './game-shell-types';
import { LeftNavigationRail } from './LeftNavigationRail';
import { ToastAndAlertLayer } from './ToastAndAlertLayer';

const PixiLudusMap = lazy(() =>
  import('../map/PixiLudusMap').then((module) => ({
    default: module.PixiLudusMap,
  })),
);

export function GameShell() {
  const { currentSave, errorKey, saveNoticeKey, setGameSpeed } = useGameStore();
  const { activeModal, openModal, t } = useUiStore();
  const [selectedGladiatorId, setSelectedGladiatorId] = useState<string | null>(null);

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

  const openPanel = useCallback(
    (panelKind: ContextPanelKind) => {
      if (panelKind === 'building' || panelKind === 'gladiator') {
        return;
      }

      openModal({ kind: panelKind });
    },
    [openModal],
  );

  const selectLocation = useCallback(
    (location: MapLocationDefinition) => {
      if (location.kind === 'building') {
        openModal({ buildingId: location.id, kind: 'building' });
        return;
      }

      openModal({ kind: location.id === 'market' ? 'market' : 'arena' });
    },
    [openModal],
  );

  const selectGladiator = useCallback(
    (gladiatorId: string) => {
      setSelectedGladiatorId(gladiatorId);
      openModal({ gladiatorId, kind: 'gladiator' });
    },
    [openModal],
  );

  if (!currentSave) {
    return null;
  }

  return (
    <section className="game-shell" style={pixiUiChromeStyle}>
      <TopHud
        save={currentSave}
        onOpenMenu={() => {
          openModal({ kind: 'gameMenu' });
        }}
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
        showAlerts={false}
        onGladiatorSelect={selectGladiator}
      />
    </section>
  );
}
