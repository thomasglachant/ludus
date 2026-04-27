import type { ArenaRank, CombatStrategy } from '../domain/combat/types';
import { GAME_BALANCE } from './balance';

export const COMBAT_STRATEGIES = GAME_BALANCE.combat.strategies satisfies readonly CombatStrategy[];

export const ARENA_REWARDS: Record<ArenaRank, number> = GAME_BALANCE.arena.rewards;

export const ARENA_REWARD_SPLIT = {
  winner: GAME_BALANCE.arena.rewardSplit.winner,
  loser: GAME_BALANCE.arena.rewardSplit.loser,
} as const;

export const BETTING_CONFIG = {
  firstOddsDay: GAME_BALANCE.betting.firstOddsDay,
  lockDay: GAME_BALANCE.betting.lockDay,
  scoutingCost: GAME_BALANCE.betting.scoutingCost,
  houseEdge: GAME_BALANCE.betting.houseEdge,
  minimumDecimalOdds: GAME_BALANCE.betting.minimumDecimalOdds,
} as const;

export const ARENA_RANK_THRESHOLDS = GAME_BALANCE.arena.rankThresholds;

export const COMBAT_CONFIG = {
  maxTurns: GAME_BALANCE.combat.maxTurns,
  baseHitChance: GAME_BALANCE.combat.baseHitChance,
  attackerAgilityHitMultiplier: GAME_BALANCE.combat.attackerAgilityHitMultiplier,
  defenderAgilityDodgeMultiplier: GAME_BALANCE.combat.defenderAgilityDodgeMultiplier,
  minHitChance: GAME_BALANCE.combat.minHitChance,
  maxHitChance: GAME_BALANCE.combat.maxHitChance,
  baseDamage: GAME_BALANCE.combat.baseDamage,
  strengthDamageMultiplier: GAME_BALANCE.combat.strengthDamageMultiplier,
  defenseReductionMultiplier: GAME_BALANCE.combat.defenseReductionMultiplier,
  minDamage: GAME_BALANCE.combat.minDamage,
  maxDamage: GAME_BALANCE.combat.maxDamage,
  winnerHealthRecoveryRatio: GAME_BALANCE.combat.winnerHealthRecoveryRatio,
  loserMinimumHealth: GAME_BALANCE.combat.loserMinimumHealth,
  baseEnergyCost: GAME_BALANCE.combat.baseEnergyCost,
  energyCostPerTurn: GAME_BALANCE.combat.energyCostPerTurn,
  minEnergyCost: GAME_BALANCE.combat.minEnergyCost,
  maxEnergyCost: GAME_BALANCE.combat.maxEnergyCost,
  winnerMoraleChange: GAME_BALANCE.combat.winnerMoraleChange,
  loserMoraleChange: GAME_BALANCE.combat.loserMoraleChange,
  winReputationValue: GAME_BALANCE.combat.winReputationValue,
  lossReputationPenalty: GAME_BALANCE.combat.lossReputationPenalty,
} as const;

export const COMBAT_STRATEGY_MODIFIERS: Record<
  CombatStrategy,
  {
    hitChanceBonus: number;
    damageMultiplier: number;
    defenseMultiplier: number;
    energyCostMultiplier: number;
  }
> = GAME_BALANCE.combat.strategyModifiers;

export const ARENA_OPPONENT_CONFIG: Record<
  ArenaRank,
  {
    statMultiplier: number;
    reputation: number;
  }
> = GAME_BALANCE.combat.opponentByRank;
