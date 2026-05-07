export const GLADIATOR_GAUGE_CONFIG = {
  // Minimum value for temporary combat gauges.
  minimum: 0,
  // Maximum value for temporary combat gauges.
  maximum: 100,
  // Minimum health used when a combat participant must remain alive.
  minimumAliveHealth: 1,
} as const;

export const GLADIATOR_TRAINING_CONFIG = {
  // Experience gained by each effective training point before bonuses.
  experiencePerPoint: 8,
} as const;

export const GLADIATOR_COMBAT_EXPERIENCE_CONFIG = {
  // Training-point equivalent used as the base combat XP reward at equal level.
  dailyTrainingEquivalentPoints: 4,
  // Multiplier used when the player's gladiator wins.
  winMultiplier: 1,
  // Multiplier used when the player's gladiator loses.
  lossMultiplier: 0.4,
  // XP multiplier delta per opponent level above or below the gladiator.
  levelDifferenceMultiplier: 0.08,
  // Lower clamp for level-difference XP scaling.
  minimumLevelMultiplier: 0.6,
  // Upper clamp for level-difference XP scaling.
  maximumLevelMultiplier: 1.6,
} as const;

export const GLADIATOR_MARKET_DEFAULTS = {
  // Reputation assigned to newly generated market gladiators.
  reputation: 0,
  // Wins assigned to newly generated market gladiators.
  wins: 0,
  // Losses assigned to newly generated market gladiators.
  losses: 0,
} as const;

export const GLADIATOR_OPPONENT_DEFAULTS = {
  // Wins assigned to generated arena opponents.
  wins: 0,
  // Losses assigned to generated arena opponents.
  losses: 0,
} as const;
