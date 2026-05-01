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
  | 'training'
  | 'meals'
  | 'sleep'
  | 'leisure'
  | 'care'
  | 'contracts'
  | 'production'
  | 'security'
  | 'maintenance'
  | 'events';

export type DailyPlanPoints = Record<DailyPlanActivity, number>;

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
  gloryDelta: number;
  happinessDelta: number;
  securityDelta: number;
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
  gloryDelta: number;
  happinessDelta: number;
  securityDelta: number;
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
