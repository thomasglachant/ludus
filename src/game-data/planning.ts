import { GAME_BALANCE } from './balance';

export const PLANNING_THRESHOLDS = {
  criticalHealth: GAME_BALANCE.planning.thresholds.criticalHealth,
  lowHealth: GAME_BALANCE.planning.thresholds.lowHealth,
  criticalEnergy: GAME_BALANCE.planning.thresholds.criticalEnergy,
  lowEnergy: GAME_BALANCE.planning.thresholds.lowEnergy,
  criticalMorale: GAME_BALANCE.planning.thresholds.criticalMorale,
  lowMorale: GAME_BALANCE.planning.thresholds.lowMorale,
  primaryNeedReassignment: GAME_BALANCE.planning.thresholds.primaryNeedReassignment,
} as const;
