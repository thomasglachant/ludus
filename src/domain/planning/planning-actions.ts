import { GAME_BALANCE } from '../../game-data/balance';
import {
  PLANNING_ACTIVITY_DEFINITIONS,
  type PlanningActivityDefinition,
} from '../../game-data/planning';
import { DAYS_OF_WEEK } from '../../game-data/time';
import type { BuildingActivityId } from '../buildings/types';
import { getSelectableBuildingActivities } from '../buildings/building-activities';
import { sumActiveBuildingEffectValues } from '../buildings/building-effects';
import { getActivityEligibleGladiators } from '../gladiator-traits/gladiator-trait-actions';
import type { GameSave } from '../saves/types';
import type { DayOfWeek, GameDate } from '../time/types';
import type { DailyPlan, DailyPlanActivity, DailyPlanBucket, DailyPlanPoints } from './types';

export type { DailyPlanBucket } from './types';

export interface DailyPlanActivityConstraint {
  activity: DailyPlanActivity;
  maximum?: number;
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
  effectiveUsed: number;
  ignored: number;
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
const dailyPlanActivities: DailyPlanActivity[] = ['training', 'meals', 'sleep', 'production'];

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
    training: 0,
    meals: 0,
    sleep: 0,
    production: 0,
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

function getPlanDate(save: GameSave, dayOfWeek: DayOfWeek): GameDate {
  return {
    year: save.planning.year,
    week: save.planning.week,
    dayOfWeek,
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

export function synchronizePlanning(save: GameSave): GameSave {
  const defaultWeeklyPlan = createDefaultWeeklyPlan(save.time.year, save.time.week);
  const hasCurrentPlanningWeek =
    save.planning.year === save.time.year && save.planning.week === save.time.week;
  return {
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
}

export function getDailyPlanBucketBudget(
  save: GameSave,
  bucket: DailyPlanBucket,
  date: GameDate = getPlanDate(save, save.time.dayOfWeek),
) {
  if (bucket === 'gladiatorTimePoints') {
    return (
      (DAILY_PLAN_BUCKET_BUDGETS.gladiatorTimePoints +
        Math.round(
          sumActiveBuildingEffectValues(save, {
            target: 'ludus',
            type: 'increaseDailyGladiatorPoints',
          }),
        )) *
      getActivityEligibleGladiators(save, date).length
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
  return (
    getDailyPlanBucketBudget(save, bucket, getPlanDate(save, plan.dayOfWeek)) -
    getDailyPlanBucketTotal(plan[bucket])
  );
}

function scaleDailyPlanPoints(points: DailyPlanPoints, budget: number): DailyPlanPoints {
  const total = getDailyPlanBucketTotal(points);

  if (total <= budget) {
    return points;
  }

  if (budget <= 0) {
    return createEmptyPoints();
  }

  const scaledEntries = dailyPlanActivities.map((activity, index) => {
    const exact = (points[activity] * budget) / total;

    return {
      activity,
      floor: Math.floor(exact),
      index,
      remainder: exact - Math.floor(exact),
    };
  });
  const scaledPoints = Object.fromEntries(
    scaledEntries.map((entry) => [entry.activity, entry.floor]),
  ) as DailyPlanPoints;
  const remainingPoints =
    budget - scaledEntries.reduce((totalFloor, entry) => totalFloor + entry.floor, 0);
  const recipients = [...scaledEntries].sort(
    (left, right) => right.remainder - left.remainder || left.index - right.index,
  );

  for (const recipient of recipients.slice(0, remainingPoints)) {
    scaledPoints[recipient.activity] += 1;
  }

  return scaledPoints;
}

export function getEffectiveDailyPlan(save: GameSave, plan: DailyPlan): DailyPlan {
  const date = getPlanDate(save, plan.dayOfWeek);

  return {
    ...plan,
    gladiatorTimePoints: scaleDailyPlanPoints(
      plan.gladiatorTimePoints,
      getDailyPlanBucketBudget(save, 'gladiatorTimePoints', date),
    ),
    laborPoints: scaleDailyPlanPoints(
      plan.laborPoints,
      getDailyPlanBucketBudget(save, 'laborPoints', date),
    ),
    adminPoints: scaleDailyPlanPoints(
      plan.adminPoints,
      getDailyPlanBucketBudget(save, 'adminPoints', date),
    ),
  };
}

function applyPlanningExecutionRules(
  save: GameSave,
  rawPlan: DailyPlan,
  effectivePlan: DailyPlan,
): DailyPlan {
  return getAvailablePlanningActivityDefinitions(save).reduce<DailyPlan>((nextPlan, task) => {
    const rawPoints = rawPlan[task.bucket][task.activity];
    const effectivePoints = nextPlan[task.bucket][task.activity];
    const executablePoints = getExecutablePlanningActivityPoints(task, rawPoints, effectivePoints);

    if (executablePoints === effectivePoints) {
      return nextPlan;
    }

    return {
      ...nextPlan,
      [task.bucket]: {
        ...nextPlan[task.bucket],
        [task.activity]: executablePoints,
      },
    };
  }, effectivePlan);
}

export function getExecutableDailyPlan(save: GameSave, plan: DailyPlan): DailyPlan {
  return applyPlanningExecutionRules(save, plan, getEffectiveDailyPlan(save, plan));
}

export function getExecutablePlanningActivityPoints(
  task: Pick<PlanningActivityDefinition, 'execution'>,
  rawPoints: number,
  effectivePoints: number,
) {
  return rawPoints > 0 && canPlanningActivityExecute(task, effectivePoints) ? effectivePoints : 0;
}

export function canPlanningActivityExecute(
  task: Pick<PlanningActivityDefinition, 'execution'>,
  effectivePoints: number,
) {
  if (task.execution.kind === 'threshold') {
    return effectivePoints >= task.execution.requiredPoints;
  }

  return effectivePoints > 0;
}

export function getPlanningActivityExecutionConstraint(
  task: Pick<PlanningActivityDefinition, 'activity' | 'execution'>,
): DailyPlanActivityConstraint | null {
  if (task.execution.kind !== 'threshold') {
    return null;
  }

  return {
    activity: task.activity,
    minimum: task.execution.requiredPoints,
  };
}

export function getPlanningActivityConstraintStatus(
  task: Pick<PlanningActivityDefinition, 'activity' | 'execution'>,
  effectivePoints: number,
): DailyPlanConstraintStatus | null {
  const constraint = getPlanningActivityExecutionConstraint(task);

  return constraint
    ? {
        ...constraint,
        isSatisfied: canPlanningActivityExecute(task, effectivePoints),
        points: effectivePoints,
      }
    : null;
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
  const task = getAvailablePlanningActivityDefinitions(save).find(
    (definition) => definition.bucket === bucket && definition.activity === activity,
  );

  return task ? getPlanningActivityExecutionConstraint(task) : null;
}

export function validateDailyPlan(save: GameSave, plan: DailyPlan): DailyPlanValidation {
  const isPast = isPastPlanningDay(save, plan.dayOfWeek);
  const effectivePlan = getEffectiveDailyPlan(save, plan);
  const buckets = dailyPlanBuckets.map<DailyPlanBucketValidation>((bucket) => {
    const budget = getDailyPlanBucketBudget(save, bucket, getPlanDate(save, plan.dayOfWeek));
    const used = getDailyPlanBucketTotal(plan[bucket]);
    const effectiveUsed = getDailyPlanBucketTotal(effectivePlan[bucket]);
    const constraints = Object.entries(plan[bucket]).flatMap<DailyPlanConstraintStatus>(
      ([activity, rawPoints]) => {
        const dailyPlanActivity = activity as DailyPlanActivity;
        const task = getAvailablePlanningActivityDefinitions(save).find(
          (definition) => definition.bucket === bucket && definition.activity === dailyPlanActivity,
        );

        if (!task || rawPoints <= 0) {
          return [];
        }

        const constraint = getPlanningActivityConstraintStatus(
          task,
          effectivePlan[bucket][dailyPlanActivity],
        );

        return constraint ? [constraint] : [];
      },
    );
    const ignored = Math.max(0, used - effectiveUsed);
    const remaining = Math.max(0, budget - effectiveUsed);

    return {
      bucket,
      budget,
      constraints,
      effectiveUsed,
      ignored,
      isComplete: remaining === 0 && constraints.every((constraint) => constraint.isSatisfied),
      remaining,
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
        total + day.buckets.reduce((bucketTotal, bucket) => bucketTotal + bucket.remaining, 0),
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
  const availablePoints = Math.max(
    0,
    getDailyPlanBucketBudget(save, bucket, getPlanDate(save, plan.dayOfWeek)) - otherPoints,
  );

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
