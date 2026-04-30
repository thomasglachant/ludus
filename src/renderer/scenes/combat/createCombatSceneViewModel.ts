import type {
  CombatantViewModel,
  CombatScreenViewModel,
} from '../../../ui/combat/combat-screen-view-model';
import type { GladiatorCombatAnimationId } from '../../../game-data/gladiator-animations';
import { getProductionGladiatorCombatAnimationAsset } from '../../../game-data/gladiator-visuals';
import type { CombatSceneViewModel } from './CombatSceneViewModel';

function getCurrentActionId(viewModel: CombatScreenViewModel) {
  if (viewModel.isComplete) {
    return `complete:${viewModel.combat.winnerId ?? 'draw'}`;
  }

  return viewModel.latestTurn
    ? `turn:${viewModel.latestTurn.turnNumber}:${viewModel.latestTurn.logKey}`
    : 'ready';
}

function getCombatantAnimationId(
  viewModel: CombatScreenViewModel,
  combatantId: string,
): GladiatorCombatAnimationId {
  if (viewModel.isComplete && viewModel.combat.winnerId) {
    return viewModel.combat.winnerId === combatantId ? 'victory' : 'defeat';
  }

  const latestTurn = viewModel.latestTurn;

  if (!latestTurn) {
    return 'idle';
  }

  if (latestTurn.attackerId === combatantId) {
    return 'attack';
  }

  if (latestTurn.defenderId === combatantId) {
    return latestTurn.didHit ? 'hit' : 'block';
  }

  return 'idle';
}

function createCombatSceneCombatant(
  viewModel: CombatScreenViewModel,
  combatant: CombatantViewModel,
  side: 'left' | 'right',
) {
  const animationId = getCombatantAnimationId(viewModel, combatant.id);
  const animationAsset = getProductionGladiatorCombatAnimationAsset(
    combatant.visualIdentity,
    animationId,
  );

  return {
    id: combatant.id,
    name: combatant.name,
    side,
    health: combatant.health,
    healthRatio: combatant.health / 100,
    animation: animationAsset.definition,
    animationId,
    animationRevision: getCurrentActionId(viewModel),
    fallbackFramePaths: animationAsset.fallbackFramePaths,
    frameNames: animationAsset.frameNames,
    spritesheetAtlasPath: animationAsset.atlasPath,
  };
}

function getCombatantSide(
  viewModel: CombatScreenViewModel,
  combatantId: string,
): 'left' | 'right' | undefined {
  if (viewModel.player.id === combatantId) {
    return 'left';
  }

  if (viewModel.opponent.id === combatantId) {
    return 'right';
  }

  return undefined;
}

interface CombatSceneViewModelOptions {
  dodgeLabel?: string;
  reducedMotion?: boolean;
}

function createTurnEffect(viewModel: CombatScreenViewModel, options: CombatSceneViewModelOptions) {
  const latestTurn = viewModel.latestTurn;

  if (!latestTurn) {
    return undefined;
  }

  const attackerSide = getCombatantSide(viewModel, latestTurn.attackerId);
  const defenderSide = getCombatantSide(viewModel, latestTurn.defenderId);

  if (!attackerSide || !defenderSide) {
    return undefined;
  }

  return {
    id: `turn:${latestTurn.turnNumber}:${latestTurn.logKey}`,
    attackerSide,
    defenderSide,
    didHit: latestTurn.didHit,
    dodgeLabel: latestTurn.didHit ? undefined : options.dodgeLabel,
    healthDelta: latestTurn.didHit ? -latestTurn.damage : 0,
  };
}

export function createCombatSceneViewModel(
  viewModel: CombatScreenViewModel,
  options: CombatSceneViewModelOptions = {},
): CombatSceneViewModel {
  return {
    backgroundPath: viewModel.combatBackgroundPath,
    crowdPath: viewModel.combatCrowdPath,
    currentActionId: getCurrentActionId(viewModel),
    effect: createTurnEffect(viewModel, options),
    reducedMotion: options.reducedMotion ?? false,
    left: createCombatSceneCombatant(viewModel, viewModel.player, 'left'),
    right: createCombatSceneCombatant(viewModel, viewModel.opponent, 'right'),
  };
}
