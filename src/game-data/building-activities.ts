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
    securityPerPoint?: number;
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
  createActivity(
    'guardBarracks.nightWatch',
    'guardBarracks',
    'guardBarracks.night-watch',
    'security',
    { securityPerPoint: 1.5 },
  ),
  createActivity(
    'guardBarracks.rebellionProtocol',
    'guardBarracks',
    'guardBarracks.rebellion-protocol',
    'security',
    { securityPerPoint: 1, rebellionPerPoint: -0.8 },
  ),
  createActivity('farm.marketSurplus', 'farm', 'farm.market-surplus', 'production', {
    treasuryPerPoint: 5,
  }),
  createActivity('farm.exportContracts', 'farm', 'farm.export-contracts', 'production', {
    treasuryPerPoint: 8,
    reputationPerPoint: 0.05,
  }),
  createActivity(
    'forgeWorkshop.weaponContracts',
    'forgeWorkshop',
    'forgeWorkshop.weapon-contracts',
    'production',
    { treasuryPerPoint: 9 },
  ),
  createActivity(
    'forgeWorkshop.legionContract',
    'forgeWorkshop',
    'forgeWorkshop.legion-contract',
    'production',
    { treasuryPerPoint: 13, reputationPerPoint: 0.1 },
  ),
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
