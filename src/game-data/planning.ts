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
    | 'warning';
  labelKey: string;
}

export interface PlanningActivityDefinition {
  activity: DailyPlanActivity;
  buildingId: BuildingId;
  bucket: DailyPlanBucket;
  category: PlanningActivityCategory;
  color: string;
  defaultPoints: number;
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
  options: Pick<PlanningActivityDefinition, 'requiredBuildingLevel' | 'requiredSkillId'> = {},
): BuildingPlanningActivityDefinition {
  return {
    activity,
    bucket: 'gladiatorTimePoints',
    category: 'gladiatorTimePoints',
    color,
    defaultPoints: GAME_BALANCE.planning.taskDefaultPoints[activity],
    impacts,
    subcategoryKey: `weeklyPlan.taskSubcategories.${activity}`,
    ...options,
  };
}

export const BUILDING_PLANNING_ACTIVITY_DEFINITIONS = {
  trainingGround: [
    createGladiatorTask('strengthTraining', '#b75f45', [
      { amount: 1, kind: 'strength', labelKey: 'weeklyPlan.taskImpacts.strength' },
      { amount: -1, kind: 'warning', labelKey: 'weeklyPlan.taskImpacts.injuryRisk' },
    ]),
    createGladiatorTask('agilityTraining', '#7fb85b', [
      { amount: 1, kind: 'agility', labelKey: 'weeklyPlan.taskImpacts.agility' },
      { amount: -1, kind: 'warning', labelKey: 'weeklyPlan.taskImpacts.injuryRisk' },
    ]),
    createGladiatorTask('defenseTraining', '#8d7458', [
      { amount: 1, kind: 'defense', labelKey: 'weeklyPlan.taskImpacts.defense' },
      { amount: -1, kind: 'warning', labelKey: 'weeklyPlan.taskImpacts.injuryRisk' },
    ]),
  ],
  canteen: [
    createGladiatorTask('lifeTraining', '#c6934a', [
      { amount: 1, kind: 'health', labelKey: 'weeklyPlan.taskImpacts.life' },
      { amount: -1, kind: 'warning', labelKey: 'weeklyPlan.taskImpacts.injuryRisk' },
    ]),
  ],
  infirmary: [
    createGladiatorTask('care', '#4e9f76', [
      { amount: 1, kind: 'health', labelKey: 'weeklyPlan.taskImpacts.care' },
      { amount: 1, kind: 'warning', labelKey: 'weeklyPlan.taskImpacts.injuryRiskReduction' },
    ]),
  ],
  pleasureHall: [
    createGladiatorTask('leisure', '#c16f9b', [
      { amount: 1, kind: 'morale', labelKey: 'weeklyPlan.taskImpacts.happiness' },
      { amount: -1, kind: 'warning', labelKey: 'weeklyPlan.taskImpacts.rebellionPressure' },
    ]),
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
