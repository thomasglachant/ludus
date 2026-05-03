import type { BuildingActivityId, BuildingId } from '../buildings/types';
import type { DayOfWeek } from '../time/types';

export interface WeeklyPlanningState {
  week: number;
  year: number;
  days: Record<DayOfWeek, DailyPlan>;
  reports: WeeklyReport[];
  alerts: GameAlert[];
}

export type DailyPlanActivity =
  | 'strengthTraining'
  | 'agilityTraining'
  | 'defenseTraining'
  | 'lifeTraining'
  | 'meals'
  | 'sleep'
  | 'production';

export type DailyPlanPoints = Record<DailyPlanActivity, number>;

export type DailyPlanBucket = 'gladiatorTimePoints' | 'laborPoints' | 'adminPoints';

export type DailyPlanBuildingActivitySelections = Partial<
  Record<DailyPlanActivity, BuildingActivityId>
>;

export interface DailyPlan {
  dayOfWeek: DayOfWeek;
  gladiatorTimePoints: DailyPlanPoints;
  laborPoints: DailyPlanPoints;
  adminPoints: DailyPlanPoints;
  buildingActivitySelections: DailyPlanBuildingActivitySelections;
}

export interface DailySimulationSummary {
  dayOfWeek: DayOfWeek;
  treasuryDelta: number;
  reputationDelta: number;
  happinessDelta: number;
  rebellionDelta: number;
  injuredGladiatorIds: string[];
  eventIds: string[];
}

export interface WeeklyReport {
  id: string;
  year: number;
  week: number;
  days: DailySimulationSummary[];
  treasuryDelta: number;
  reputationDelta: number;
  happinessDelta: number;
  rebellionDelta: number;
  injuries: number;
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
