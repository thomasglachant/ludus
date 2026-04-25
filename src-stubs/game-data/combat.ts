export const COMBAT_CONFIG = {
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
} as const;

export const ARENA_REWARDS = {
  bronze3: 80,
  bronze2: 120,
  bronze1: 180,
  silver3: 260,
  silver2: 380,
  silver1: 540,
  gold3: 760,
  gold2: 1050,
  gold1: 1400,
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
