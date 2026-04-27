import { GAME_BALANCE } from './balance';

export const WEEKLY_OBJECTIVES = GAME_BALANCE.planning.weeklyObjectives;

export const TRAINING_INTENSITIES = GAME_BALANCE.planning.trainingIntensities;

export const PLANNING_THRESHOLDS = {
  criticalHealth: GAME_BALANCE.planning.thresholds.criticalHealth,
  lowHealth: GAME_BALANCE.planning.thresholds.lowHealth,
  criticalEnergy: GAME_BALANCE.planning.thresholds.criticalEnergy,
  lowEnergy: GAME_BALANCE.planning.thresholds.lowEnergy,
  criticalSatiety: GAME_BALANCE.planning.thresholds.criticalSatiety,
  lowSatiety: GAME_BALANCE.planning.thresholds.lowSatiety,
  criticalMorale: GAME_BALANCE.planning.thresholds.criticalMorale,
  lowMorale: GAME_BALANCE.planning.thresholds.lowMorale,
} as const;

export const READINESS_WEIGHTS = {
  health: GAME_BALANCE.planning.readinessWeights.health,
  energy: GAME_BALANCE.planning.readinessWeights.energy,
  morale: GAME_BALANCE.planning.readinessWeights.morale,
  satiety: GAME_BALANCE.planning.readinessWeights.satiety,
  reputationStability: GAME_BALANCE.planning.readinessWeights.reputationStability,
} as const;

export const DEFAULT_ROUTINE_CONFIG = GAME_BALANCE.planning.defaultRoutine;

export const READINESS_CONFIG = GAME_BALANCE.planning.readiness;
