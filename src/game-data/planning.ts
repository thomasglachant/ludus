import type { BuildingId } from '../domain/buildings/types';
import type { DailyPlanActivity, DailyPlanBucket } from '../domain/planning/types';
import { GAME_BALANCE } from './balance';

export type PlanningActivityCategory = DailyPlanBucket;
type DefinedPlanningActivity = keyof typeof GAME_BALANCE.planning.taskDefaultPoints;

export interface PlanningActivityImpactDefinition {
  amount: number;
  kind:
    | 'agility'
    | 'defense'
    | 'energy'
    | 'health'
    | 'morale'
    | 'reputation'
    | 'strength'
    | 'treasury'
    | 'warning'
    | 'xp';
  labelKey: string;
}

export type PlanningActivityExecution =
  | { kind: 'proportional' }
  | { kind: 'threshold'; requiredPoints: number };

export interface PlanningActivityDefinition {
  activity: DailyPlanActivity;
  buildingId: BuildingId;
  bucket: DailyPlanBucket;
  category: PlanningActivityCategory;
  color: string;
  defaultPoints: number;
  execution: PlanningActivityExecution;
  impacts: PlanningActivityImpactDefinition[];
  requiredBuildingLevel?: number;
  requiredSkillId?: string;
  subcategoryKey: string;
}

type BuildingPlanningActivityDefinition = Omit<PlanningActivityDefinition, 'buildingId'>;

function createGladiatorTask(
  activity: DefinedPlanningActivity,
  color: string,
  impacts: PlanningActivityImpactDefinition[],
  execution: PlanningActivityExecution,
  options: Pick<PlanningActivityDefinition, 'requiredBuildingLevel' | 'requiredSkillId'> = {},
): BuildingPlanningActivityDefinition {
  return {
    activity,
    bucket: 'gladiatorTimePoints',
    category: 'gladiatorTimePoints',
    color,
    defaultPoints: GAME_BALANCE.planning.taskDefaultPoints[activity],
    execution,
    impacts,
    subcategoryKey: `weeklyPlan.taskSubcategories.${activity}`,
    ...options,
  };
}

export const BUILDING_PLANNING_ACTIVITY_DEFINITIONS = {
  trainingGround: [
    createGladiatorTask(
      'training',
      '#b75f45',
      [
        { amount: 1, kind: 'xp', labelKey: 'weeklyPlan.taskImpacts.experience' },
        { amount: -1, kind: 'warning', labelKey: 'weeklyPlan.taskImpacts.injuryRisk' },
      ],
      { kind: 'proportional' },
    ),
  ],
} as const satisfies Partial<Record<BuildingId, readonly BuildingPlanningActivityDefinition[]>>;

export const PLANNING_ACTIVITY_DEFINITIONS = Object.entries(
  BUILDING_PLANNING_ACTIVITY_DEFINITIONS,
).flatMap(([buildingId, tasks]) =>
  tasks.map((task) => ({ ...task, buildingId: buildingId as BuildingId })),
) as PlanningActivityDefinition[];

export function getBuildingPlanningActivityDefinitions(buildingId: BuildingId) {
  return PLANNING_ACTIVITY_DEFINITIONS.filter((task) => task.buildingId === buildingId);
}
