import type { ArenaRank } from '../../domain/combat/types';

export const COMBAT_RULES = {
  // Maximum turns before combat is force-resolved by remaining health.
  maxTurns: 40,
  // Base chance to hit before agility modifiers.
  baseHitChance: 0.65,
  // Hit chance gained per attacker agility point.
  attackerAgilityHitMultiplier: 0.003,
  // Hit chance removed per defender agility point.
  defenderAgilityDodgeMultiplier: 0.002,
  // Lower clamp for hit chance.
  minHitChance: 0.1,
  // Upper clamp for hit chance.
  maxHitChance: 0.95,
  // Base damage before strength modifiers.
  baseDamage: 5,
  // Damage added per attacker strength point.
  strengthDamageMultiplier: 0.4,
  // Damage removed per defender defense point.
  defenseReductionMultiplier: 0.2,
  // Lower clamp for resolved damage.
  minDamage: 1,
  // Upper clamp for resolved damage.
  maxDamage: 40,
  // Base combat health before life aptitude scaling.
  baseHealth: 40,
  // Combat health added per life aptitude point.
  lifeHealthMultiplier: 4,
  // Base combat energy before aptitude scaling.
  baseEnergy: 35,
  // Combat energy added per strength aptitude point.
  strengthEnergyMultiplier: 1.2,
  // Combat energy added per agility aptitude point.
  agilityEnergyMultiplier: 1.6,
  // Combat energy added per life aptitude point.
  lifeEnergyMultiplier: 0.8,
  // Baseline morale used only during combat resolution.
  baseMorale: 70,
  // Reputation value of each win.
  winReputationValue: 10,
  // Reputation penalty of each loss.
  lossReputationPenalty: 3,
} as const;

export const ARENA_OPPONENT_CONFIG = {
  bronze3: { reputation: 0 },
  bronze2: { reputation: 25 },
  bronze1: { reputation: 50 },
  silver3: { reputation: 100 },
  silver2: { reputation: 150 },
  silver1: { reputation: 225 },
  gold3: { reputation: 325 },
  gold2: { reputation: 450 },
  gold1: { reputation: 600 },
} as const satisfies Record<ArenaRank, { reputation: number }>;

export const OPPONENT_GENERATION_CONFIG = {
  // Minimum generated arena opponent age.
  minAge: 18,
  // Maximum generated arena opponent age.
  maxAge: 34,
} as const;

export const PARTICIPANT_RATING_CONFIG = {
  // Strength multiplier used by projected win chance.
  strengthWeight: 1.15,
  // Combat health multiplier used by projected win chance.
  healthWeight: 0.24,
  // Combat energy multiplier used by projected win chance.
  energyWeight: 0.18,
  // Combat morale multiplier used by projected win chance.
  moraleWeight: 0.08,
} as const;

export const PROJECTED_WIN_CHANCE_CONFIG = {
  // Lower clamp for projected player win chance used by arena odds.
  minimum: 0.15,
  // Upper clamp for projected player win chance used by arena odds.
  maximum: 0.85,
} as const;
