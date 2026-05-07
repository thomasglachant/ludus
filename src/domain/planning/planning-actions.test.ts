import { describe, expect, it } from 'vitest';
import type { PlanningActivityDefinition } from '../../game-data/planning';
import type { GameSave, Gladiator } from '../types';
import { createInitialSave } from '../saves/create-initial-save';
import { applyGladiatorTraitAtDate } from '../gladiators/trait-actions';
import {
  canPlanningActivityExecute,
  getDailyPlanBucketBudget,
  getEffectiveDailyPlan,
  getDailyPlanBucketRemaining,
  getExecutablePlanningActivityPoints,
  getPlanningActivityConstraintStatus,
  synchronizePlanning,
  updateDailyPlan,
  updateDailyPlanBuildingActivitySelection,
  validateDailyPlan,
  validateWeeklyPlanning,
} from './planning-actions';

function createTestSave() {
  return createInitialSave({
    ludusName: 'Ludus Magnus',
    saveId: 'save-test',
    createdAt: '2026-04-25T12:00:00.000Z',
  });
}

function createGladiator(overrides: Partial<Gladiator> = {}): Gladiator {
  return {
    id: 'gladiator-test',
    name: 'Aulus',
    age: 18,
    experience: 0,
    strength: 3,
    agility: 3,
    defense: 2,
    life: 2,
    reputation: 0,
    wins: 0,
    losses: 0,
    traits: [],
    ...overrides,
  };
}

function withGladiators(save: GameSave, gladiators: Gladiator[]): GameSave {
  return {
    ...save,
    gladiators,
  };
}

describe('planning actions', () => {
  it('synchronizes the weekly planning state without regenerating alerts', () => {
    const staleAlert = {
      id: 'alert-stale',
      severity: 'info' as const,
      titleKey: 'alerts.test.title',
      descriptionKey: 'alerts.test.description',
      createdAt: '2026-04-25T12:00:00.000Z',
    };
    const save = synchronizePlanning({
      ...withGladiators(createTestSave(), [createGladiator()]),
      planning: {
        ...createTestSave().planning,
        alerts: [staleAlert],
      },
    });

    expect(save.planning.alerts).toEqual([staleAlert]);
    expect(save.planning.year).toBe(save.time.year);
    expect(save.planning.week).toBe(save.time.week);
  });

  it('updates daily macro plan points by activity bucket', () => {
    const save = synchronizePlanning(withGladiators(createTestSave(), [createGladiator()]));
    const result = updateDailyPlan(save, {
      activity: 'training',
      bucket: 'gladiatorTimePoints',
      dayOfWeek: 'monday',
      points: 0.4,
    });

    expect(result.planning.days.monday.gladiatorTimePoints.training).toBe(0);
  });

  it('caps daily macro plan updates to the bucket budget', () => {
    const save = synchronizePlanning(withGladiators(createTestSave(), [createGladiator()]));
    const result = updateDailyPlan(save, {
      activity: 'training',
      bucket: 'gladiatorTimePoints',
      dayOfWeek: 'monday',
      points: 20,
    });

    expect(result.planning.days.monday.gladiatorTimePoints.training).toBe(8);
    expect(
      getDailyPlanBucketRemaining(result, result.planning.days.monday, 'gladiatorTimePoints'),
    ).toBe(0);
  });

  it('uses only activity-eligible gladiators for dated gladiator point budgets', () => {
    const restedSave = applyGladiatorTraitAtDate(
      synchronizePlanning(
        withGladiators(createTestSave(), [
          createGladiator({ id: 'gladiator-ready' }),
          createGladiator({ id: 'gladiator-resting' }),
        ]),
      ),
      'rest',
      2,
      'gladiator-resting',
      { dayOfWeek: 'monday', week: 1, year: 1 },
    );

    expect(
      getDailyPlanBucketBudget(restedSave, 'gladiatorTimePoints', {
        dayOfWeek: 'tuesday',
        week: 1,
        year: 1,
      }),
    ).toBe(8);
    expect(
      getDailyPlanBucketBudget(restedSave, 'gladiatorTimePoints', {
        dayOfWeek: 'wednesday',
        week: 1,
        year: 1,
      }),
    ).toBe(16);
  });

  it('keeps raw plans while proportionally capping effective over-budget points', () => {
    const save = applyGladiatorTraitAtDate(
      synchronizePlanning(
        withGladiators(createTestSave(), [
          createGladiator({ id: 'gladiator-ready' }),
          createGladiator({ id: 'gladiator-resting' }),
        ]),
      ),
      'rest',
      1,
      'gladiator-resting',
      { dayOfWeek: 'monday', week: 1, year: 1 },
    );
    const plan = {
      ...save.planning.days.monday,
      gladiatorTimePoints: {
        ...save.planning.days.monday.gladiatorTimePoints,
        training: 10,
        meals: 5,
        sleep: 1,
      },
    };
    const effectivePlan = getEffectiveDailyPlan(save, plan);

    expect(plan.gladiatorTimePoints).toMatchObject({ meals: 5, sleep: 1, training: 10 });
    expect(effectivePlan.gladiatorTimePoints).toMatchObject({
      meals: 3,
      production: 0,
      sleep: 0,
      training: 5,
    });
  });

  it('marks over-budget raw plans complete when effective points fill the available budget', () => {
    const plannedSave = synchronizePlanning(
      withGladiators(createTestSave(), [
        createGladiator({ id: 'gladiator-ready' }),
        createGladiator({ id: 'gladiator-resting' }),
      ]),
    );
    const fullBudget = getDailyPlanBucketBudget(plannedSave, 'gladiatorTimePoints', {
      dayOfWeek: 'monday',
      week: 1,
      year: 1,
    });
    const saveWithRawFullPlan: GameSave = {
      ...plannedSave,
      planning: {
        ...plannedSave.planning,
        days: {
          ...plannedSave.planning.days,
          monday: {
            ...plannedSave.planning.days.monday,
            gladiatorTimePoints: {
              ...plannedSave.planning.days.monday.gladiatorTimePoints,
              training: fullBudget,
            },
          },
        },
      },
    };
    const restedSave = applyGladiatorTraitAtDate(
      saveWithRawFullPlan,
      'rest',
      1,
      'gladiator-resting',
      { dayOfWeek: 'monday', week: 1, year: 1 },
    );
    const validation = validateDailyPlan(restedSave, restedSave.planning.days.monday);
    const bucket = validation.buckets[0];

    expect(bucket.used).toBe(16);
    expect(bucket.effectiveUsed).toBe(8);
    expect(bucket.ignored).toBe(8);
    expect(bucket.remaining).toBe(0);
    expect(bucket.isComplete).toBe(true);
    expect(validation.isComplete).toBe(true);
  });

  it('does not count ignored surplus as missing weekly points', () => {
    const plannedSave = synchronizePlanning(
      withGladiators(createTestSave(), [
        createGladiator({ id: 'gladiator-ready' }),
        createGladiator({ id: 'gladiator-resting' }),
      ]),
    );
    const fullBudget = getDailyPlanBucketBudget(plannedSave, 'gladiatorTimePoints', {
      dayOfWeek: 'monday',
      week: 1,
      year: 1,
    });
    const days = { ...plannedSave.planning.days };

    for (const dayOfWeek of [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ] as const) {
      days[dayOfWeek] = {
        ...days[dayOfWeek],
        gladiatorTimePoints: {
          ...days[dayOfWeek].gladiatorTimePoints,
          training: dayOfWeek === 'tuesday' ? fullBudget - 6 : fullBudget,
        },
      };
    }

    const restedSave = applyGladiatorTraitAtDate(
      {
        ...plannedSave,
        planning: {
          ...plannedSave.planning,
          days,
        },
      },
      'rest',
      1,
      'gladiator-resting',
      { dayOfWeek: 'monday', week: 1, year: 1 },
    );
    const validation = validateWeeklyPlanning(restedSave);

    expect(validation.isComplete).toBe(false);
    expect(validation.incompleteDayCount).toBe(1);
    expect(validation.missingPoints).toBe(6);
    expect(validation.days.find((day) => day.dayOfWeek === 'monday')?.buckets[0].ignored).toBe(8);
  });

  it('keeps threshold activities non-executable until effective points reach the threshold', () => {
    const thresholdActivity: PlanningActivityDefinition = {
      activity: 'training',
      buildingId: 'trainingGround',
      bucket: 'gladiatorTimePoints',
      category: 'gladiatorTimePoints',
      color: '#b75f45',
      defaultPoints: 8,
      execution: { kind: 'threshold', requiredPoints: 8 },
      impacts: [],
      subcategoryKey: 'weeklyPlan.taskSubcategories.training',
    };
    const rawPoints = 8;
    const effectivePoints = 6;
    const status = getPlanningActivityConstraintStatus(thresholdActivity, effectivePoints);

    expect(status).toMatchObject({
      activity: 'training',
      isSatisfied: false,
      minimum: 8,
      points: effectivePoints,
    });
    expect(getExecutablePlanningActivityPoints(thresholdActivity, rawPoints, effectivePoints)).toBe(
      0,
    );
    expect(canPlanningActivityExecute(thresholdActivity, effectivePoints)).toBe(false);
    expect(canPlanningActivityExecute(thresholdActivity, 8)).toBe(true);
  });

  it('ignores unavailable labor planning updates', () => {
    const save = synchronizePlanning(withGladiators(createTestSave(), [createGladiator()]));
    const result = updateDailyPlan(save, {
      activity: 'production',
      bucket: 'laborPoints',
      dayOfWeek: 'monday',
      points: 2,
    });

    expect(result).toBe(save);
  });

  it('clears stale labor and admin planning points when synchronizing', () => {
    const baseSave = createTestSave();
    const save = synchronizePlanning({
      ...baseSave,
      planning: {
        ...baseSave.planning,
        days: {
          ...baseSave.planning.days,
          monday: {
            ...baseSave.planning.days.monday,
            adminPoints: {
              ...baseSave.planning.days.monday.adminPoints,
              production: 3,
            },
            laborPoints: {
              ...baseSave.planning.days.monday.laborPoints,
              production: 4,
            },
          },
        },
      },
    });

    expect(save.planning.days.monday.laborPoints.production).toBe(0);
    expect(save.planning.days.monday.adminPoints.production).toBe(0);
  });

  it('selects an unlocked building activity for a daily activity', () => {
    const save = {
      ...createTestSave(),
      buildings: {
        ...createTestSave().buildings,
        canteen: {
          ...createTestSave().buildings.canteen,
          isPurchased: true,
          purchasedSkillIds: ['canteen.supply-contracts'],
        },
      },
    };
    const result = updateDailyPlanBuildingActivitySelection(save, {
      activity: 'production',
      activityId: 'canteen.supplyContracts',
      dayOfWeek: 'monday',
    });

    expect(result.planning.days.monday.buildingActivitySelections.production).toBe(
      'canteen.supplyContracts',
    );
  });

  it('clears or ignores invalid building activity selections', () => {
    const save = {
      ...createTestSave(),
      planning: {
        ...createTestSave().planning,
        days: {
          ...createTestSave().planning.days,
          monday: {
            ...createTestSave().planning.days.monday,
            buildingActivitySelections: {
              production: 'canteen.supplyContracts' as const,
            },
          },
        },
      },
    };
    const invalidResult = updateDailyPlanBuildingActivitySelection(save, {
      activity: 'production',
      activityId: undefined,
      dayOfWeek: 'monday',
    });
    const clearedResult = updateDailyPlanBuildingActivitySelection(save, {
      activity: 'production',
      dayOfWeek: 'monday',
    });

    expect(
      invalidResult.planning.days.monday.buildingActivitySelections.production,
    ).toBeUndefined();
    expect(
      clearedResult.planning.days.monday.buildingActivitySelections.production,
    ).toBeUndefined();
  });
});
