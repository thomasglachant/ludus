import { useCallback } from 'react';
import { featureFlags } from '../../config/features';
import type { PixiSceneContext } from '../../renderer/pixi/PixiScene';
import { PixiSceneViewport } from '../../renderer/pixi/PixiSceneViewport';
import { CombatScene } from '../../renderer/scenes/combat/CombatScene';
import { useUiStore } from '../../state/ui-store';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import type { CombatScreenViewModel } from './combat-screen-view-model';

interface PixiCombatArenaStageProps {
  viewModel: CombatScreenViewModel;
}

export function PixiCombatArenaStage({ viewModel }: PixiCombatArenaStageProps) {
  const { t } = useUiStore();
  const reducedMotion = usePrefersReducedMotion();
  const createScene = useCallback(
    (context: PixiSceneContext) => new CombatScene(context, { reducedMotion }),
    [reducedMotion],
  );

  return (
    <section className="combat-stage" data-testid="combat-stage">
      <PixiSceneViewport
        createScene={createScene}
        debugMode={featureFlags.enableDebugUi}
        sceneKey={reducedMotion ? 'combat-reduced-motion' : 'combat-motion'}
        sceneLabel={t('combatScreen.title')}
        snapshot={viewModel}
      />
    </section>
  );
}
