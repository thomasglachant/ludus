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
    gloryPerPoint?: number;
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
  createActivity(
    'trainingGround.nobleTraining',
    'trainingGround',
    'trainingGround.noble-training',
    'contracts',
    { treasuryPerPoint: 8, reputationPerPoint: 0.1 },
  ),
  createActivity(
    'trainingGround.soldierTraining',
    'trainingGround',
    'trainingGround.soldier-training',
    'contracts',
    { treasuryPerPoint: 10, gloryPerPoint: 0.1 },
  ),
  createActivity(
    'trainingGround.publicDrill',
    'trainingGround',
    'trainingGround.public-drill',
    'events',
    { treasuryPerPoint: 4, gloryPerPoint: 0.2 },
  ),
  createActivity('canteen.supplyContracts', 'canteen', 'canteen.supply-contracts', 'production', {
    treasuryPerPoint: 5,
  }),
  createActivity('canteen.festivalCatering', 'canteen', 'canteen.festival-catering', 'events', {
    treasuryPerPoint: 7,
    reputationPerPoint: 0.1,
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
  createActivity(
    'pleasureHall.grandEntertainment',
    'pleasureHall',
    'pleasureHall.grand-entertainment',
    'events',
    { treasuryPerPoint: 4, happinessPerPoint: 1.2, reputationPerPoint: 0.1 },
  ),
  createActivity('domus.profitForecasting', 'domus', 'domus.profit-forecasting', 'maintenance', {
    treasuryPerPoint: 3,
  }),
  createActivity('domus.championshipBooking', 'domus', 'domus.championship-booking', 'contracts', {
    treasuryPerPoint: 6,
    gloryPerPoint: 0.1,
  }),
  createActivity('farm.marketSurplus', 'farm', 'farm.market-surplus', 'production', {
    treasuryPerPoint: 5,
  }),
  createActivity('farm.exportContracts', 'farm', 'farm.export-contracts', 'production', {
    treasuryPerPoint: 8,
    reputationPerPoint: 0.05,
  }),
  createActivity(
    'exhibitionGrounds.localExhibitions',
    'exhibitionGrounds',
    'exhibitionGrounds.local-exhibitions',
    'events',
    { treasuryPerPoint: 7, gloryPerPoint: 0.15 },
  ),
  createActivity(
    'exhibitionGrounds.grandSpectacle',
    'exhibitionGrounds',
    'exhibitionGrounds.grand-spectacle',
    'events',
    { treasuryPerPoint: 12, gloryPerPoint: 0.3, reputationPerPoint: 0.15 },
  ),
  createActivity(
    'bookmakerOffice.publicOdds',
    'bookmakerOffice',
    'bookmakerOffice.public-odds',
    'contracts',
    { treasuryPerPoint: 8 },
  ),
  createActivity(
    'bookmakerOffice.championshipBook',
    'bookmakerOffice',
    'bookmakerOffice.championship-book',
    'contracts',
    { treasuryPerPoint: 14, reputationPerPoint: -0.05 },
  ),
  createActivity('banquetHall.nobleDinner', 'banquetHall', 'banquetHall.noble-dinner', 'events', {
    treasuryPerPoint: 7,
    reputationPerPoint: 0.2,
    happinessPerPoint: 0.4,
  }),
  createActivity('banquetHall.grandFeast', 'banquetHall', 'banquetHall.grand-feast', 'events', {
    treasuryPerPoint: 10,
    reputationPerPoint: 0.25,
    happinessPerPoint: 0.8,
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
