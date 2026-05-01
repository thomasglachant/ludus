import { GAME_BALANCE } from '../../game-data/balance';
import { PLANNING_THRESHOLDS } from '../../game-data/planning';
import type { BuildingActivityId, BuildingId } from '../buildings/types';
import { getSelectableBuildingActivities } from '../buildings/building-activities';
import type { Gladiator } from '../gladiators/types';
import type { GameSave } from '../saves/types';
import { createDefaultWeeklyPlan } from '../weekly-simulation/weekly-simulation-actions';
import type { DailyPlan, DailyPlanActivity, DailyPlanPoints, GameAlert } from './types';

export interface PlanningRecommendation {
  buildingId?: BuildingId;
  reasonKey: string;
  isAvailable: boolean;
}

export interface GladiatorPlanningStatus {
  gladiator: Gladiator;
  alerts: GameAlert[];
  recommendation: PlanningRecommendation;
}

export type DailyPlanBucket = 'gladiatorTimePoints' | 'laborPoints' | 'adminPoints';

export const DAILY_PLAN_BUCKET_BUDGETS = {
  gladiatorTimePoints: GAME_BALANCE.macroSimulation.baseDailyGladiatorPoints,
  laborPoints: GAME_BALANCE.macroSimulation.baseDailyLaborPoints,
  adminPoints: GAME_BALANCE.macroSimulation.baseDailyAdminPoints,
} as const satisfies Record<DailyPlanBucket, number>;

export interface DailyPlanUpdate {
  activity: DailyPlanActivity;
  bucket: DailyPlanBucket;
  dayOfWeek: GameSave['time']['dayOfWeek'];
  points: number;
}

export interface DailyPlanBuildingActivitySelectionUpdate {
  activity: DailyPlanActivity;
  activityId?: BuildingActivityId;
  dayOfWeek: GameSave['time']['dayOfWeek'];
}

type GaugeAlertKind =
  | 'criticalHealth'
  | 'lowHealth'
  | 'criticalEnergy'
  | 'lowEnergy'
  | 'criticalMorale'
  | 'lowMorale';

const alertBuildingTargets: Partial<Record<GaugeAlertKind, BuildingId>> = {
  criticalHealth: 'infirmary',
  lowHealth: 'infirmary',
  criticalEnergy: 'dormitory',
  lowEnergy: 'dormitory',
  criticalMorale: 'pleasureHall',
  lowMorale: 'pleasureHall',
};

function createGaugeAlert(
  gladiatorId: string,
  kind: GaugeAlertKind,
  severity: GameAlert['severity'],
  createdAt: string,
): GameAlert {
  return {
    id: `alert-${gladiatorId}-${kind}`,
    severity,
    titleKey: `alerts.${kind}.title`,
    descriptionKey: `alerts.${kind}.description`,
    gladiatorId,
    buildingId: alertBuildingTargets[kind],
    createdAt,
  };
}

function addGaugeAlert(
  alerts: GameAlert[],
  gladiator: Gladiator,
  value: number,
  lowThreshold: number,
  criticalThreshold: number,
  lowKind: GaugeAlertKind,
  criticalKind: GaugeAlertKind,
  createdAt: string,
) {
  if (value <= criticalThreshold) {
    alerts.push(createGaugeAlert(gladiator.id, criticalKind, 'critical', createdAt));
    return;
  }

  if (value <= lowThreshold) {
    alerts.push(createGaugeAlert(gladiator.id, lowKind, 'warning', createdAt));
  }
}

function getAvailableRecommendation(save: GameSave, buildingId: BuildingId, reasonKey: string) {
  return {
    buildingId,
    reasonKey,
    isAvailable: save.buildings[buildingId].isPurchased,
  };
}

export function generatePlanningAlerts(save: GameSave, createdAt = save.updatedAt): GameAlert[] {
  const alerts: GameAlert[] = [];

  for (const gladiator of save.gladiators) {
    addGaugeAlert(
      alerts,
      gladiator,
      gladiator.health,
      PLANNING_THRESHOLDS.lowHealth,
      PLANNING_THRESHOLDS.criticalHealth,
      'lowHealth',
      'criticalHealth',
      createdAt,
    );
    addGaugeAlert(
      alerts,
      gladiator,
      gladiator.energy,
      PLANNING_THRESHOLDS.lowEnergy,
      PLANNING_THRESHOLDS.criticalEnergy,
      'lowEnergy',
      'criticalEnergy',
      createdAt,
    );
    addGaugeAlert(
      alerts,
      gladiator,
      gladiator.morale,
      PLANNING_THRESHOLDS.lowMorale,
      PLANNING_THRESHOLDS.criticalMorale,
      'lowMorale',
      'criticalMorale',
      createdAt,
    );
  }

  return alerts;
}

export function getPlanningRecommendation(
  save: GameSave,
  gladiator: Gladiator,
): PlanningRecommendation {
  if (gladiator.health <= PLANNING_THRESHOLDS.lowHealth) {
    return getAvailableRecommendation(save, 'infirmary', 'weeklyPlan.recommendations.health');
  }

  if (gladiator.energy <= PLANNING_THRESHOLDS.primaryNeedReassignment) {
    return getAvailableRecommendation(save, 'dormitory', 'weeklyPlan.recommendations.energy');
  }

  if (gladiator.morale <= PLANNING_THRESHOLDS.primaryNeedReassignment) {
    return getAvailableRecommendation(save, 'pleasureHall', 'weeklyPlan.recommendations.morale');
  }

  return getAvailableRecommendation(save, 'trainingGround', 'weeklyPlan.recommendations.balanced');
}

export function getGladiatorPlanningStatuses(save: GameSave): GladiatorPlanningStatus[] {
  return save.gladiators.map((gladiator) => {
    const alerts = save.planning.alerts.filter((alert) => alert.gladiatorId === gladiator.id);

    return {
      gladiator,
      alerts,
      recommendation: getPlanningRecommendation(save, gladiator),
    };
  });
}

export function synchronizePlanning(save: GameSave, createdAt = save.updatedAt): GameSave {
  const defaultWeeklyPlan = createDefaultWeeklyPlan(save.time.year, save.time.week);
  const saveWithPlanning = {
    ...save,
    planning: {
      year: save.time.year,
      week: save.time.week,
      days: save.planning.days ?? defaultWeeklyPlan.days,
      reports: save.planning.reports ?? [],
      alerts: save.planning.alerts ?? [],
    },
  };

  return {
    ...saveWithPlanning,
    planning: {
      ...saveWithPlanning.planning,
      alerts: generatePlanningAlerts(saveWithPlanning, createdAt),
    },
  };
}

export function applyPlanningRecommendations(save: GameSave): GameSave {
  return synchronizePlanning(save);
}

export function getDailyPlanBucketBudget(bucket: DailyPlanBucket) {
  return DAILY_PLAN_BUCKET_BUDGETS[bucket];
}

export function getDailyPlanBucketTotal(points: DailyPlanPoints) {
  return Object.values(points).reduce((total, value) => total + value, 0);
}

export function getDailyPlanBucketRemaining(plan: DailyPlan, bucket: DailyPlanBucket) {
  return getDailyPlanBucketBudget(bucket) - getDailyPlanBucketTotal(plan[bucket]);
}

function clampDailyPlanBucketPoints(
  plan: DailyPlan,
  bucket: DailyPlanBucket,
  activity: DailyPlanActivity,
  points: number,
) {
  const roundedPoints = Math.max(0, Math.round(Number.isFinite(points) ? points : 0));
  const currentPoints = plan[bucket][activity];
  const otherPoints = getDailyPlanBucketTotal(plan[bucket]) - currentPoints;
  const availablePoints = Math.max(0, getDailyPlanBucketBudget(bucket) - otherPoints);

  return Math.min(roundedPoints, availablePoints);
}

export function updateDailyPlan(save: GameSave, update: DailyPlanUpdate): GameSave {
  const dayPlan = save.planning.days[update.dayOfWeek];
  const clampedPoints = clampDailyPlanBucketPoints(
    dayPlan,
    update.bucket,
    update.activity,
    update.points,
  );

  return {
    ...save,
    planning: {
      ...save.planning,
      days: {
        ...save.planning.days,
        [update.dayOfWeek]: {
          ...dayPlan,
          [update.bucket]: {
            ...dayPlan[update.bucket],
            [update.activity]: clampedPoints,
          },
        },
      },
    },
  };
}

export function updateDailyPlanBuildingActivitySelection(
  save: GameSave,
  update: DailyPlanBuildingActivitySelectionUpdate,
): GameSave {
  const dayPlan = save.planning.days[update.dayOfWeek];
  const selectedActivity = update.activityId
    ? getSelectableBuildingActivities(save, update.activity).find(
        (activity) => activity.id === update.activityId,
      )
    : undefined;
  const buildingActivitySelections = {
    ...(dayPlan.buildingActivitySelections ?? {}),
  };

  if (selectedActivity) {
    buildingActivitySelections[update.activity] = selectedActivity.id;
  } else {
    delete buildingActivitySelections[update.activity];
  }

  return {
    ...save,
    planning: {
      ...save.planning,
      days: {
        ...save.planning.days,
        [update.dayOfWeek]: {
          ...dayPlan,
          buildingActivitySelections,
        },
      },
    },
  };
}
