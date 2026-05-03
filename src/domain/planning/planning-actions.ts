import { GAME_BALANCE } from '../../game-data/balance';
import {
  PLANNING_ACTIVITY_DEFINITIONS,
  type PlanningActivityDefinition,
} from '../../game-data/planning';
import { DAYS_OF_WEEK } from '../../game-data/time';
import type { BuildingActivityId } from '../buildings/types';
import { getSelectableBuildingActivities } from '../buildings/building-activities';
import { sumActiveBuildingEffectValues } from '../buildings/building-effects';
import { hasActiveWeeklyInjury } from '../gladiators/injuries';
import type { GameSave } from '../saves/types';
import type { DayOfWeek } from '../time/types';
import type {
  DailyPlan,
  DailyPlanActivity,
  DailyPlanBucket,
  DailyPlanPoints,
  GameAlert,
} from './types';

export type { DailyPlanBucket } from './types';

export interface DailyPlanActivityConstraint {
  activity: DailyPlanActivity;
  maximum: number;
  minimum: number;
}

export interface DailyPlanConstraintStatus extends DailyPlanActivityConstraint {
  isSatisfied: boolean;
  points: number;
}

export interface DailyPlanBucketValidation {
  bucket: DailyPlanBucket;
  budget: number;
  constraints: DailyPlanConstraintStatus[];
  isComplete: boolean;
  remaining: number;
  used: number;
}

export interface DailyPlanValidation {
  dayOfWeek: DayOfWeek;
  buckets: DailyPlanBucketValidation[];
  isComplete: boolean;
  isEditable: boolean;
  isPast: boolean;
}

export interface WeeklyPlanningValidation {
  days: DailyPlanValidation[];
  incompleteDayCount: number;
  isComplete: boolean;
  missingPoints: number;
  remainingDays: DayOfWeek[];
}

const dailyPlanBuckets: DailyPlanBucket[] = ['gladiatorTimePoints'];

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

function createEmptyPoints(): DailyPlanPoints {
  return {
    strengthTraining: 0,
    agilityTraining: 0,
    defenseTraining: 0,
    lifeTraining: 0,
    meals: 0,
    sleep: 0,
    leisure: 0,
    care: 0,
    production: 0,
    security: 0,
  };
}

export function createDefaultDailyPlan(dayOfWeek: DayOfWeek): DailyPlan {
  return {
    dayOfWeek,
    gladiatorTimePoints: createEmptyPoints(),
    laborPoints: createEmptyPoints(),
    adminPoints: createEmptyPoints(),
    buildingActivitySelections: {},
  };
}

function sanitizeDailyPlan(plan: DailyPlan): DailyPlan {
  return {
    ...plan,
    laborPoints: createEmptyPoints(),
    adminPoints: createEmptyPoints(),
  };
}

export function isPlanningActivityUnlocked(save: GameSave, task: PlanningActivityDefinition) {
  const building = save.buildings[task.buildingId];

  if (!building?.isPurchased) {
    return false;
  }

  if (task.requiredBuildingLevel !== undefined && building.level < task.requiredBuildingLevel) {
    return false;
  }

  return !task.requiredSkillId || building.purchasedSkillIds.includes(task.requiredSkillId);
}

export function getAvailablePlanningActivityDefinitions(save: GameSave) {
  return PLANNING_ACTIVITY_DEFINITIONS.filter((task) => isPlanningActivityUnlocked(save, task));
}

export function createDefaultWeeklyPlan(year: number, week: number) {
  return {
    year,
    week,
    days: Object.fromEntries(
      DAYS_OF_WEEK.map((dayOfWeek) => [dayOfWeek, createDefaultDailyPlan(dayOfWeek)]),
    ) as Record<DayOfWeek, DailyPlan>,
    reports: [],
    alerts: [],
  };
}

function createInjuryAlert(gladiatorId: string, createdAt: string): GameAlert {
  return {
    id: `alert-${gladiatorId}-injury`,
    severity: 'warning',
    titleKey: 'alerts.injury.title',
    descriptionKey: 'alerts.injury.description',
    gladiatorId,
    buildingId: 'infirmary',
    createdAt,
  };
}

export function generatePlanningAlerts(save: GameSave, createdAt = save.updatedAt): GameAlert[] {
  const alerts: GameAlert[] = [];

  for (const gladiator of save.gladiators) {
    if (hasActiveWeeklyInjury(gladiator, save.time.year, save.time.week)) {
      alerts.push(createInjuryAlert(gladiator.id, createdAt));
    }
  }

  return alerts;
}

export function synchronizePlanning(save: GameSave, createdAt = save.updatedAt): GameSave {
  const defaultWeeklyPlan = createDefaultWeeklyPlan(save.time.year, save.time.week);
  const hasCurrentPlanningWeek =
    save.planning.year === save.time.year && save.planning.week === save.time.week;
  const saveWithPlanning = {
    ...save,
    planning: {
      year: save.time.year,
      week: save.time.week,
      days: hasCurrentPlanningWeek
        ? (Object.fromEntries(
            Object.entries(save.planning.days ?? defaultWeeklyPlan.days).map(
              ([dayOfWeek, plan]) => [dayOfWeek, sanitizeDailyPlan(plan)],
            ),
          ) as Record<DayOfWeek, DailyPlan>)
        : defaultWeeklyPlan.days,
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

export function getDailyPlanBucketBudget(save: GameSave, bucket: DailyPlanBucket) {
  if (bucket === 'gladiatorTimePoints') {
    return (
      (DAILY_PLAN_BUCKET_BUDGETS.gladiatorTimePoints +
        Math.round(
          sumActiveBuildingEffectValues(save, {
            target: 'ludus',
            type: 'increaseDailyGladiatorPoints',
          }),
        )) *
      save.gladiators.length
    );
  }

  return DAILY_PLAN_BUCKET_BUDGETS[bucket];
}

export function getDailyPlanBucketTotal(points: DailyPlanPoints) {
  return Object.values(points).reduce((total, value) => total + value, 0);
}

export function getDailyPlanBucketRemaining(
  save: GameSave,
  plan: DailyPlan,
  bucket: DailyPlanBucket,
) {
  return getDailyPlanBucketBudget(save, bucket) - getDailyPlanBucketTotal(plan[bucket]);
}

export function isPastPlanningDay(save: GameSave, dayOfWeek: DayOfWeek) {
  return DAYS_OF_WEEK.indexOf(dayOfWeek) < DAYS_OF_WEEK.indexOf(save.time.dayOfWeek);
}

export function getRemainingPlanningDays(save: GameSave): DayOfWeek[] {
  return DAYS_OF_WEEK.filter(
    (dayOfWeek) =>
      dayOfWeek !== GAME_BALANCE.arena.dayOfWeek && !isPastPlanningDay(save, dayOfWeek),
  );
}

export function getDailyPlanActivityConstraint(
  save: GameSave,
  bucket: DailyPlanBucket,
  activity: DailyPlanActivity,
): DailyPlanActivityConstraint | null {
  void activity;

  if (bucket !== 'gladiatorTimePoints' || save.gladiators.length === 0) {
    return null;
  }

  return null;
}

export function validateDailyPlan(save: GameSave, plan: DailyPlan): DailyPlanValidation {
  const isPast = isPastPlanningDay(save, plan.dayOfWeek);
  const buckets = dailyPlanBuckets.map<DailyPlanBucketValidation>((bucket) => {
    const budget = getDailyPlanBucketBudget(save, bucket);
    const used = getDailyPlanBucketTotal(plan[bucket]);
    const constraints = Object.entries(plan[bucket]).flatMap<DailyPlanConstraintStatus>(
      ([activity, points]) => {
        const constraint = getDailyPlanActivityConstraint(
          save,
          bucket,
          activity as DailyPlanActivity,
        );

        if (!constraint) {
          return [];
        }

        return [
          {
            ...constraint,
            isSatisfied: points >= constraint.minimum && points <= constraint.maximum,
            points,
          },
        ];
      },
    );

    return {
      bucket,
      budget,
      constraints,
      isComplete:
        budget === 0 ||
        (used === budget && constraints.every((constraint) => constraint.isSatisfied)),
      remaining: budget - used,
      used,
    };
  });

  return {
    dayOfWeek: plan.dayOfWeek,
    buckets,
    isComplete: buckets.every((bucket) => bucket.isComplete),
    isEditable: plan.dayOfWeek !== GAME_BALANCE.arena.dayOfWeek && !isPast,
    isPast,
  };
}

export function validateWeeklyPlanning(save: GameSave): WeeklyPlanningValidation {
  if (save.gladiators.length === 0) {
    return {
      days: [],
      incompleteDayCount: 0,
      isComplete: true,
      missingPoints: 0,
      remainingDays: [],
    };
  }

  const remainingDays = getRemainingPlanningDays(save);
  const days = remainingDays.map((dayOfWeek) =>
    validateDailyPlan(save, save.planning.days[dayOfWeek]),
  );
  const incompleteDays = days.filter((day) => !day.isComplete);

  return {
    days,
    incompleteDayCount: incompleteDays.length,
    isComplete: incompleteDays.length === 0,
    missingPoints: days.reduce(
      (total, day) =>
        total +
        day.buckets.reduce((bucketTotal, bucket) => bucketTotal + Math.abs(bucket.remaining), 0),
      0,
    ),
    remainingDays,
  };
}

export function isWeeklyPlanningComplete(save: GameSave) {
  return validateWeeklyPlanning(save).isComplete;
}

function clampDailyPlanBucketPoints(
  save: GameSave,
  plan: DailyPlan,
  bucket: DailyPlanBucket,
  activity: DailyPlanActivity,
  points: number,
) {
  const roundedPoints = Math.max(0, Math.round(Number.isFinite(points) ? points : 0));
  const currentPoints = plan[bucket][activity];
  const otherPoints = getDailyPlanBucketTotal(plan[bucket]) - currentPoints;
  const availablePoints = Math.max(0, getDailyPlanBucketBudget(save, bucket) - otherPoints);

  return Math.min(roundedPoints, availablePoints);
}

export function updateDailyPlan(save: GameSave, update: DailyPlanUpdate): GameSave {
  const dayPlan = save.planning.days[update.dayOfWeek];
  const task = getAvailablePlanningActivityDefinitions(save).find(
    (definition) => definition.activity === update.activity && definition.bucket === update.bucket,
  );

  if (
    !dayPlan ||
    !task ||
    !dailyPlanBuckets.includes(update.bucket) ||
    isPastPlanningDay(save, update.dayOfWeek)
  ) {
    return save;
  }

  const clampedPoints = clampDailyPlanBucketPoints(
    save,
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

  if (!dayPlan || isPastPlanningDay(save, update.dayOfWeek)) {
    return save;
  }

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
