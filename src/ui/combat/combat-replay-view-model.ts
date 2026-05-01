import type { CombatState, CombatTurn, GameSave, Gladiator } from '../../domain/types';
import type { GladiatorVisualIdentity } from '../../domain/gladiators/types';
import {
  getGladiatorPortraitAssetPath,
  getGladiatorVisualIdentity,
} from '../../game-data/gladiator-visuals';
import { PRODUCTION_VISUAL_ASSET_MANIFEST } from '../../game-data/visual-assets';

export type CombatantSide = 'player' | 'opponent';

export interface CombatantViewModel {
  energy: number;
  health: number;
  id: string;
  morale: number;
  name: string;
  portraitPath: string;
  side: CombatantSide;
  visualIdentity: GladiatorVisualIdentity;
}

export interface CombatConsequenceViewModel {
  didPlayerWin: boolean;
  healthChange: number;
  energyChange: number;
  moraleChange: number;
  playerReward: number;
  reputationChange: number;
  resultKey: string;
  winnerName: string;
}

export interface CombatReplayViewModel {
  combat: CombatState;
  combatBackgroundPath: string;
  combatCrowdPath: string;
  consequence: CombatConsequenceViewModel;
  currentTurnNumber: number;
  isComplete: boolean;
  latestTurn?: CombatTurn;
  opponent: CombatantViewModel;
  player: CombatantViewModel;
  totalTurnCount: number;
  visibleTurns: CombatTurn[];
}

interface CombatantHealthState {
  opponent: number;
  player: number;
}

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function getProgressiveStatValue(startValue: number, endValue: number, progressRatio: number) {
  return startValue + (endValue - startValue) * progressRatio;
}

function findCombat(save: GameSave, combatId?: string) {
  const combats = save.arena.resolvedCombats;

  if (combatId) {
    return combats.find((combat) => combat.id === combatId);
  }

  return combats.find((combat) => combat.id === save.arena.currentCombatId) ?? combats[0];
}

function getTurnHealthState(combat: CombatState, visibleTurns: CombatTurn[]): CombatantHealthState {
  const latestTurn = visibleTurns.at(-1);

  if (!latestTurn) {
    return {
      player: combat.gladiator.health,
      opponent: combat.opponent.health,
    };
  }

  if (latestTurn.attackerId === combat.gladiator.id) {
    return {
      player: latestTurn.attackerHealthAfterTurn,
      opponent: latestTurn.defenderHealthAfterTurn,
    };
  }

  return {
    player: latestTurn.defenderHealthAfterTurn,
    opponent: latestTurn.attackerHealthAfterTurn,
  };
}

function createCombatantViewModel(
  gladiator: Pick<Gladiator, 'id' | 'name' | 'visualIdentity'>,
  side: CombatantSide,
  health: number,
  energy: number,
  morale: number,
): CombatantViewModel {
  const visualIdentity = getGladiatorVisualIdentity(gladiator.id, gladiator.visualIdentity);

  return {
    energy: clampPercent(energy),
    health: clampPercent(health),
    id: gladiator.id,
    morale: clampPercent(morale),
    name: gladiator.name,
    portraitPath: getGladiatorPortraitAssetPath(visualIdentity),
    side,
    visualIdentity,
  };
}

export function getCombatReplayCombat(save: GameSave, combatId?: string) {
  return findCombat(save, combatId);
}

export function getCombatReplayViewModel(
  combat: CombatState,
  visibleTurnCount: number,
): CombatReplayViewModel {
  const boundedVisibleTurnCount = Math.min(Math.max(0, visibleTurnCount), combat.turns.length);
  const visibleTurns = combat.turns.slice(0, boundedVisibleTurnCount);
  const isComplete = boundedVisibleTurnCount >= combat.turns.length;
  const progressRatio = combat.turns.length > 0 ? boundedVisibleTurnCount / combat.turns.length : 1;
  const healthState = getTurnHealthState(combat, visibleTurns);
  const winnerName =
    combat.winnerId === combat.gladiator.id ? combat.gladiator.name : combat.opponent.name;
  const playerEnergy = getProgressiveStatValue(
    combat.gladiator.energy,
    combat.consequence.finalEnergy,
    progressRatio,
  );
  const playerMorale = getProgressiveStatValue(
    combat.gladiator.morale,
    combat.consequence.finalMorale,
    progressRatio,
  );

  return {
    combat,
    combatBackgroundPath: PRODUCTION_VISUAL_ASSET_MANIFEST.locations.arena.combatBackground,
    combatCrowdPath: PRODUCTION_VISUAL_ASSET_MANIFEST.locations.arena.crowd,
    consequence: {
      didPlayerWin: combat.consequence.didPlayerWin,
      healthChange: combat.consequence.healthChange,
      energyChange: combat.consequence.energyChange,
      moraleChange: combat.consequence.moraleChange,
      playerReward: combat.consequence.playerReward,
      reputationChange: combat.consequence.reputationChange,
      resultKey: combat.consequence.didPlayerWin ? 'arena.result.win' : 'arena.result.loss',
      winnerName,
    },
    currentTurnNumber: Math.min(boundedVisibleTurnCount + 1, Math.max(1, combat.turns.length)),
    isComplete,
    latestTurn: visibleTurns.at(-1),
    opponent: createCombatantViewModel(
      combat.opponent,
      'opponent',
      healthState.opponent,
      combat.opponent.energy,
      combat.opponent.morale,
    ),
    player: createCombatantViewModel(
      combat.gladiator,
      'player',
      healthState.player,
      playerEnergy,
      playerMorale,
    ),
    totalTurnCount: combat.turns.length,
    visibleTurns,
  };
}
