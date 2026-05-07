import type { BuildingActivityId, BuildingId } from '../buildings/types';
import type { DayOfWeek } from '../time/types';

export interface WeeklyPlanningState {
  week: number;
  year: number;
  days: Record<DayOfWeek, DailyPlan>;
  reports: WeeklyReport[];
  alerts: GameAlert[];
}

export const DAILY_PLAN_ACTIVITIES = ['training', 'meals', 'sleep', 'production'] as const;

export type DailyPlanActivity = (typeof DAILY_PLAN_ACTIVITIES)[number];

export type DailyPlanPoints = Record<DailyPlanActivity, number>;

export const DAILY_PLAN_BUCKETS = ['gladiatorTimePoints', 'laborPoints', 'adminPoints'] as const;

export type DailyPlanBucket = (typeof DAILY_PLAN_BUCKETS)[number];

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

export const ALERT_SEVERITIES = ['info', 'warning', 'critical'] as const;

export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];

export const GAME_ALERT_ACTION_KINDS = [
  'allocateGladiatorSkillPoint',
  'openFinance',
  'openWeeklyPlanning',
  'openMarket',
] as const;

export type GameAlertActionKind = (typeof GAME_ALERT_ACTION_KINDS)[number];

export interface GameAlert {
  id: string;
  severity: AlertSeverity;
  titleKey: string;
  descriptionKey: string;
  actionKind?: GameAlertActionKind;
  gladiatorId?: string;
  buildingId?: BuildingId;
  traitId?: string;
  createdAt: string;
}
