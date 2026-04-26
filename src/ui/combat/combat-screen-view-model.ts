import type { CombatState, CombatTurn, GameSave, Gladiator } from '../../domain/types';
import {
  getGladiatorCombatSpriteFrames,
  getGladiatorPortraitAssetPath,
  getGladiatorVisualIdentity,
} from '../../game-data/gladiator-visuals';
import { VISUAL_ASSET_MANIFEST } from '../../game-data/visual-assets';

export type CombatantSide = 'player' | 'opponent';

export interface CombatantViewModel {
  armorKey: string;
  attackFrames: string[];
  energy: number;
  health: number;
  id: string;
  idleFrames: string[];
  morale: number;
  name: string;
  portraitPath: string;
  side: CombatantSide;
}

export interface CombatConsequenceViewModel {
  healthChange: number;
  energyChange: number;
  moraleChange: number;
  playerReward: number;
  reputationChange: number;
  resultKey: string;
  winnerName: string;
}

export interface CombatScreenViewModel {
  combat: CombatState;
  combatBackgroundPath: string;
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

function findCombat(save: GameSave, combatId?: string) {
  const combats = [...save.arena.pendingCombats, ...save.arena.resolvedCombats];

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

function getArmorKey(gladiator: Pick<Gladiator, 'id' | 'visualIdentity'>) {
  const visualIdentity = getGladiatorVisualIdentity(gladiator.id, gladiator.visualIdentity);

  return `combatScreen.armor.${visualIdentity.armorStyle ?? 'unknown'}`;
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
    armorKey: getArmorKey(gladiator),
    attackFrames: getGladiatorCombatSpriteFrames(gladiator, 'attack').slice(0, 2),
    energy: clampPercent(energy),
    health: clampPercent(health),
    id: gladiator.id,
    idleFrames: getGladiatorCombatSpriteFrames(gladiator, 'idle').slice(0, 2),
    morale: clampPercent(morale),
    name: gladiator.name,
    portraitPath: getGladiatorPortraitAssetPath(visualIdentity),
    side,
  };
}

export function getCombatScreenCombat(save: GameSave, combatId?: string) {
  return findCombat(save, combatId);
}

export function getCombatScreenViewModel(
  combat: CombatState,
  visibleTurnCount: number,
): CombatScreenViewModel {
  const boundedVisibleTurnCount = Math.min(Math.max(0, visibleTurnCount), combat.turns.length);
  const visibleTurns = combat.turns.slice(0, boundedVisibleTurnCount);
  const isComplete = boundedVisibleTurnCount >= combat.turns.length;
  const healthState = getTurnHealthState(combat, visibleTurns);
  const winnerName =
    combat.winnerId === combat.gladiator.id ? combat.gladiator.name : combat.opponent.name;

  return {
    combat,
    combatBackgroundPath: VISUAL_ASSET_MANIFEST.locations.arena.combatBackground,
    consequence: {
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
      isComplete ? combat.consequence.finalEnergy : combat.gladiator.energy,
      isComplete ? combat.consequence.finalMorale : combat.gladiator.morale,
    ),
    totalTurnCount: combat.turns.length,
    visibleTurns,
  };
}
