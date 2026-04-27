import type { CombatScreenViewModel } from '../../../ui/combat/combat-screen-view-model';
import type { CombatSceneViewModel } from './CombatSceneViewModel';

export function createCombatSceneViewModel(
  viewModel: CombatScreenViewModel,
  options: { reducedMotion?: boolean } = {},
): CombatSceneViewModel {
  return {
    backgroundPath: viewModel.combatBackgroundPath,
    currentActionId: viewModel.latestTurn?.logKey,
    latestAttackerId: viewModel.latestTurn?.attackerId,
    reducedMotion: options.reducedMotion ?? false,
    left: {
      id: viewModel.player.id,
      name: viewModel.player.name,
      side: 'left',
      health: viewModel.player.health,
      healthRatio: viewModel.player.health / 100,
      idleFrames: viewModel.player.idleFrames,
      attackFrames: viewModel.player.attackFrames,
    },
    right: {
      id: viewModel.opponent.id,
      name: viewModel.opponent.name,
      side: 'right',
      health: viewModel.opponent.health,
      healthRatio: viewModel.opponent.health / 100,
      idleFrames: viewModel.opponent.idleFrames,
      attackFrames: viewModel.opponent.attackFrames,
    },
  };
}
