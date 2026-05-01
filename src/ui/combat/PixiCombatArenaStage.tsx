import { useCallback } from 'react';
import type { PixiSceneContext } from '../../renderer/pixi/PixiScene';
import { PixiSceneViewport } from '../../renderer/pixi/PixiSceneViewport';
import { CombatScene } from '../../renderer/scenes/combat/CombatScene';
import { useUiStore } from '../../state/ui-store-context';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import type { CombatReplayViewModel } from './combat-replay-view-model';

interface PixiCombatArenaStageProps {
  viewModel: CombatReplayViewModel;
}

export function PixiCombatArenaStage({ viewModel }: PixiCombatArenaStageProps) {
  const { isPixiDebugEnabled, t } = useUiStore();
  const reducedMotion = usePrefersReducedMotion();
  const dodgeLabel = t('combatScreen.logImpact.dodged');
  const createScene = useCallback(
    (context: PixiSceneContext) =>
      new CombatScene(context, {
        dodgeLabel,
        fighterScale: 1.55,
        reducedMotion,
        showBackdrop: false,
      }),
    [dodgeLabel, reducedMotion],
  );

  return (
    <section className="combat-stage" data-testid="combat-stage">
      <PixiSceneViewport
        createScene={createScene}
        debugMode={isPixiDebugEnabled}
        sceneKey={`${reducedMotion ? 'combat-reduced-motion' : 'combat-motion'}:${dodgeLabel}`}
        sceneLabel={t('combatScreen.title')}
        snapshot={viewModel}
      />
    </section>
  );
}
