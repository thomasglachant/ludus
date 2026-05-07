import type { BuildingId } from '../domain/buildings/types';
import type { DailyPlanActivity, DailyPlanBucket } from '../domain/planning/types';

export type PlanningActivityCategory = DailyPlanBucket;

export const PLANNING_TASK_DEFAULT_POINTS = {
  training: 3,
} as const;

type DefinedPlanningActivity = keyof typeof PLANNING_TASK_DEFAULT_POINTS;

export const PLANNING_ACTIVITY_IMPACT_KINDS = [
  'agility',
  'defense',
  'energy',
  'health',
  'morale',
  'reputation',
  'strength',
  'treasury',
  'warning',
  'xp',
] as const;

export type PlanningActivityImpactKind = (typeof PLANNING_ACTIVITY_IMPACT_KINDS)[number];

export interface PlanningActivityImpactDefinition {
  amount: number;
  kind: PlanningActivityImpactKind;
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
    defaultPoints: PLANNING_TASK_DEFAULT_POINTS[activity],
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
