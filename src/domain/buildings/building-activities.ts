import {
  BUILDING_ACTIVITY_DEFINITIONS,
  type BuildingActivityDefinition,
} from '../../game-data/buildings/activities';
import type { DailyPlan, DailyPlanActivity } from '../planning/types';
import type { GameSave } from '../saves/types';
import type { BuildingActivityId, BuildingId } from './types';

export interface BuildingActivityImpact {
  treasuryDelta: number;
  reputationDelta: number;
  happinessDelta: number;
  rebellionDelta: number;
  injuryRiskReductionPercent: number;
}

export interface BuildingActivityContribution extends BuildingActivityImpact {
  activity: DailyPlanActivity;
  activityId: BuildingActivityId;
  buildingId: BuildingId;
  plannedPoints: number;
}

const emptyImpact: BuildingActivityImpact = {
  treasuryDelta: 0,
  reputationDelta: 0,
  happinessDelta: 0,
  rebellionDelta: 0,
  injuryRiskReductionPercent: 0,
};

function getPoints(plan: DailyPlan, activity: DailyPlanActivity) {
  return plan.gladiatorTimePoints[activity] + plan.laborPoints[activity];
}

function isActivityUnlocked(save: GameSave, definition: BuildingActivityDefinition) {
  const building = save.buildings[definition.buildingId];

  return building.isPurchased && building.purchasedSkillIds.includes(definition.requiredSkillId);
}

function getSelectedActivityIds(plan: DailyPlan): BuildingActivityId[] {
  return Array.from(new Set(Object.values(plan.buildingActivitySelections ?? {})));
}

export function getUnlockedBuildingActivities(
  save: GameSave,
  buildingId?: BuildingId,
): BuildingActivityDefinition[] {
  return BUILDING_ACTIVITY_DEFINITIONS.filter(
    (definition) =>
      (!buildingId || definition.buildingId === buildingId) && isActivityUnlocked(save, definition),
  );
}

export function isBuildingActivityUnlocked(save: GameSave, activityId: BuildingActivityId) {
  const definition = BUILDING_ACTIVITY_DEFINITIONS.find((activity) => activity.id === activityId);

  return definition ? isActivityUnlocked(save, definition) : false;
}

export function getSelectableBuildingActivities(
  save: GameSave,
  activity?: DailyPlanActivity,
): BuildingActivityDefinition[] {
  return getUnlockedBuildingActivities(save).filter(
    (definition) => !activity || definition.activity === activity,
  );
}

export function getSelectedBuildingActivities(
  save: GameSave,
  plan: DailyPlan,
): BuildingActivityDefinition[] {
  const selectedActivityIds = getSelectedActivityIds(plan);

  return selectedActivityIds
    .map((activityId) =>
      BUILDING_ACTIVITY_DEFINITIONS.find((definition) => definition.id === activityId),
    )
    .filter((definition): definition is BuildingActivityDefinition => Boolean(definition))
    .filter((definition) => isActivityUnlocked(save, definition));
}

export function calculateBuildingActivityImpact(
  save: GameSave,
  plan: DailyPlan,
): BuildingActivityImpact {
  return getBuildingActivityContributions(save, plan).reduce<BuildingActivityImpact>(
    (impact, contribution) => ({
      treasuryDelta: impact.treasuryDelta + contribution.treasuryDelta,
      reputationDelta: impact.reputationDelta + contribution.reputationDelta,
      happinessDelta: impact.happinessDelta + contribution.happinessDelta,
      rebellionDelta: impact.rebellionDelta + contribution.rebellionDelta,
      injuryRiskReductionPercent:
        impact.injuryRiskReductionPercent + contribution.injuryRiskReductionPercent,
    }),
    emptyImpact,
  );
}

export function getBuildingActivityContributions(
  save: GameSave,
  plan: DailyPlan,
): BuildingActivityContribution[] {
  return getSelectedBuildingActivities(save, plan)
    .map((activity) => {
      const plannedPoints = getPoints(plan, activity.activity);

      if (plannedPoints <= 0) {
        return null;
      }

      return {
        activity: activity.activity,
        activityId: activity.id,
        buildingId: activity.buildingId,
        plannedPoints,
        treasuryDelta: plannedPoints * (activity.effects.treasuryPerPoint ?? 0),
        reputationDelta: plannedPoints * (activity.effects.reputationPerPoint ?? 0),
        happinessDelta: plannedPoints * (activity.effects.happinessPerPoint ?? 0),
        rebellionDelta: plannedPoints * (activity.effects.rebellionPerPoint ?? 0),
        injuryRiskReductionPercent:
          plannedPoints * (activity.effects.injuryRiskReductionPercent ?? 0),
      };
    })
    .filter((contribution): contribution is BuildingActivityContribution => contribution !== null);
}
