import type { BuildingActivityId, BuildingId } from '../domain/buildings/types';
import type { DailyPlanActivity } from '../domain/planning/types';

export interface BuildingActivityDefinition {
  id: BuildingActivityId;
  buildingId: BuildingId;
  requiredSkillId: string;
  activity: DailyPlanActivity;
  nameKey: string;
  descriptionKey: string;
  effects: {
    treasuryPerPoint?: number;
    reputationPerPoint?: number;
    happinessPerPoint?: number;
    rebellionPerPoint?: number;
    injuryRiskReductionPercent?: number;
  };
}

function createActivity(
  id: BuildingActivityId,
  buildingId: BuildingId,
  requiredSkillId: string,
  activity: DailyPlanActivity,
  effects: BuildingActivityDefinition['effects'],
): BuildingActivityDefinition {
  return {
    id,
    buildingId,
    requiredSkillId,
    activity,
    nameKey: `buildingActivities.${id}.name`,
    descriptionKey: `buildingActivities.${id}.description`,
    effects,
  };
}

export const BUILDING_ACTIVITY_DEFINITIONS: BuildingActivityDefinition[] = [
  createActivity('canteen.supplyContracts', 'canteen', 'canteen.supply-contracts', 'production', {
    treasuryPerPoint: 5,
  }),
];

export function getBuildingActivityIdsBySkill(skillId: string): BuildingActivityId[] {
  return BUILDING_ACTIVITY_DEFINITIONS.filter(
    (activity) => activity.requiredSkillId === skillId,
  ).map((activity) => activity.id);
}

export function getBuildingActivityDefinitions(buildingId?: BuildingId) {
  return buildingId
    ? BUILDING_ACTIVITY_DEFINITIONS.filter((activity) => activity.buildingId === buildingId)
    : BUILDING_ACTIVITY_DEFINITIONS;
}
