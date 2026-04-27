import { useMemo } from 'react';
import { PixiSceneViewport } from '../../renderer/pixi/PixiSceneViewport';
import { CombatScene } from '../../renderer/scenes/combat/CombatScene';
import { createCombatSceneViewModel } from '../../renderer/scenes/combat/createCombatSceneViewModel';
import { useUiStore } from '../../state/ui-store';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import type { CombatScreenViewModel } from './combat-screen-view-model';

interface PixiCombatArenaStageProps {
  viewModel: CombatScreenViewModel;
}

export function PixiCombatArenaStage({ viewModel }: PixiCombatArenaStageProps) {
  const { t } = useUiStore();
  const reducedMotion = usePrefersReducedMotion();
  const sceneViewModel = useMemo(
    () => createCombatSceneViewModel(viewModel, { reducedMotion }),
    [reducedMotion, viewModel],
  );

  return (
    <section className="combat-stage" data-testid="combat-stage">
      <PixiSceneViewport sceneLabel={t('combatScreen.title')}>
        <CombatScene viewModel={sceneViewModel} />
      </PixiSceneViewport>
    </section>
  );
}
