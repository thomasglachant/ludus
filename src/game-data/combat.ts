import type { ArenaRank, CombatStrategy } from '../domain/combat/types';

export const COMBAT_STRATEGIES = [
  'balanced',
  'aggressive',
  'defensive',
  'evasive',
  'exhaustOpponent',
  'protectInjury',
] as const satisfies CombatStrategy[];

export const ARENA_REWARDS: Record<ArenaRank, number> = {
  bronze3: 80,
  bronze2: 120,
  bronze1: 180,
  silver3: 260,
  silver2: 380,
  silver1: 540,
  gold3: 760,
  gold2: 1050,
  gold1: 1400,
};

export const ARENA_REWARD_SPLIT = {
  winner: 0.75,
  loser: 0.25,
} as const;

export const BETTING_CONFIG = {
  firstOddsDay: 'thursday',
  lockDay: 'saturday',
  scoutingCost: 25,
  houseEdge: 0.08,
} as const;

export const ARENA_RANK_THRESHOLDS = [
  { rank: 'bronze3', minimumReputation: 0 },
  { rank: 'bronze2', minimumReputation: 25 },
  { rank: 'bronze1', minimumReputation: 50 },
  { rank: 'silver3', minimumReputation: 100 },
  { rank: 'silver2', minimumReputation: 150 },
  { rank: 'silver1', minimumReputation: 225 },
  { rank: 'gold3', minimumReputation: 325 },
  { rank: 'gold2', minimumReputation: 450 },
  { rank: 'gold1', minimumReputation: 600 },
] as const;

export const COMBAT_CONFIG = {
  maxTurns: 40,
  baseHitChance: 0.65,
  attackerAgilityHitMultiplier: 0.003,
  defenderAgilityDodgeMultiplier: 0.002,
  minHitChance: 0.1,
  maxHitChance: 0.95,
  baseDamage: 5,
  strengthDamageMultiplier: 0.4,
  defenseReductionMultiplier: 0.2,
  minDamage: 1,
  maxDamage: 40,
  winnerHealthRecoveryRatio: 0.25,
  loserMinimumHealth: 1,
  baseEnergyCost: 12,
  energyCostPerTurn: 0.45,
  minEnergyCost: 8,
  maxEnergyCost: 34,
  winnerMoraleChange: 15,
  loserMoraleChange: -8,
  winReputationValue: 10,
  lossReputationPenalty: 3,
} as const;

export const COMBAT_STRATEGY_MODIFIERS: Record<
  CombatStrategy,
  {
    hitChanceBonus: number;
    damageMultiplier: number;
    defenseMultiplier: number;
    energyCostMultiplier: number;
  }
> = {
  balanced: {
    hitChanceBonus: 0,
    damageMultiplier: 1,
    defenseMultiplier: 1,
    energyCostMultiplier: 1,
  },
  aggressive: {
    hitChanceBonus: 0.05,
    damageMultiplier: 1.18,
    defenseMultiplier: 0.85,
    energyCostMultiplier: 1.15,
  },
  defensive: {
    hitChanceBonus: -0.03,
    damageMultiplier: 0.9,
    defenseMultiplier: 1.25,
    energyCostMultiplier: 0.9,
  },
  evasive: {
    hitChanceBonus: 0.02,
    damageMultiplier: 0.85,
    defenseMultiplier: 1.1,
    energyCostMultiplier: 1.05,
  },
  exhaustOpponent: {
    hitChanceBonus: -0.01,
    damageMultiplier: 0.95,
    defenseMultiplier: 1.05,
    energyCostMultiplier: 1,
  },
  protectInjury: {
    hitChanceBonus: -0.05,
    damageMultiplier: 0.8,
    defenseMultiplier: 1.35,
    energyCostMultiplier: 0.8,
  },
};

export const ARENA_OPPONENT_CONFIG: Record<
  ArenaRank,
  {
    statMultiplier: number;
    reputation: number;
  }
> = {
  bronze3: {
    statMultiplier: 0.9,
    reputation: 0,
  },
  bronze2: {
    statMultiplier: 0.96,
    reputation: 25,
  },
  bronze1: {
    statMultiplier: 1.03,
    reputation: 50,
  },
  silver3: {
    statMultiplier: 1.08,
    reputation: 100,
  },
  silver2: {
    statMultiplier: 1.14,
    reputation: 150,
  },
  silver1: {
    statMultiplier: 1.2,
    reputation: 225,
  },
  gold3: {
    statMultiplier: 1.27,
    reputation: 325,
  },
  gold2: {
    statMultiplier: 1.34,
    reputation: 450,
  },
  gold1: {
    statMultiplier: 1.42,
    reputation: 600,
  },
};
