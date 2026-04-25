import type { BuildingId } from '../buildings/types';
import type { CombatStrategy } from '../combat/types';

export type GladiatorWeeklyObjective =
  | 'balanced'
  | 'fightPreparation'
  | 'trainStrength'
  | 'trainAgility'
  | 'trainDefense'
  | 'recovery'
  | 'moraleBoost'
  | 'protectChampion'
  | 'prepareForSale';

export type TrainingIntensity = 'light' | 'normal' | 'hard' | 'brutal';

export interface GladiatorRoutine {
  gladiatorId: string;
  objective: GladiatorWeeklyObjective;
  intensity: TrainingIntensity;
  allowAutomaticAssignment: boolean;
  lockedBuildingId?: BuildingId;
  combatStrategy?: CombatStrategy;
}

export interface WeeklyPlanningState {
  week: number;
  year: number;
  routines: GladiatorRoutine[];
  alerts: GameAlert[];
}

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface GameAlert {
  id: string;
  severity: AlertSeverity;
  titleKey: string;
  descriptionKey: string;
  gladiatorId?: string;
  buildingId?: BuildingId;
  createdAt: string;
}
