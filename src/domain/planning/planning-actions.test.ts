import { describe, expect, it } from 'vitest';
import type { BuildingId, GameSave, Gladiator } from '../types';
import { createInitialSave } from '../saves/create-initial-save';
import {
  applyPlanningRecommendations,
  getDailyPlanBucketRemaining,
  getGladiatorPlanningStatuses,
  getPlanningRecommendation,
  synchronizePlanning,
  updateDailyPlan,
  updateDailyPlanBuildingActivitySelection,
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
    strength: 7,
    agility: 6,
    defense: 7,
    life: 85,
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

function withPurchasedBuildings(save: GameSave, buildingIds: BuildingId[]): GameSave {
  return {
    ...save,
    buildings: {
      ...save.buildings,
      ...Object.fromEntries(
        buildingIds.map((buildingId) => [
          buildingId,
          {
            ...save.buildings[buildingId],
            isPurchased: true,
            level: Math.max(1, save.buildings[buildingId].level),
          },
        ]),
      ),
    },
  };
}

describe('planning actions', () => {
  it('synchronizes macro planning alerts for owned gladiators', () => {
    const save = synchronizePlanning(withGladiators(createTestSave(), [createGladiator()]));

    expect(save.planning.alerts).toEqual([]);
    expect(save.planning.year).toBe(save.time.year);
    expect(save.planning.week).toBe(save.time.week);
  });

  it('generates alerts and planning statuses for owned gladiators', () => {
    const save = synchronizePlanning(
      withGladiators(createTestSave(), [
        createGladiator({
          weeklyInjury: { reason: 'training', week: 1, year: 1 },
        }),
      ]),
    );
    const statuses = getGladiatorPlanningStatuses(save);

    expect(statuses).toHaveLength(1);
    expect(statuses[0]).toMatchObject({
      gladiator: expect.objectContaining({ id: 'gladiator-test' }),
      recommendation: expect.objectContaining({ buildingId: 'infirmary' }),
    });
    expect(save.planning.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: 'warning',
          titleKey: 'alerts.injury.title',
          buildingId: 'infirmary',
        }),
      ]),
    );
  });

  it('ignores stale weekly injuries when generating alerts and recommendations', () => {
    const save = synchronizePlanning(
      withGladiators(createTestSave(), [
        createGladiator({
          weeklyInjury: { reason: 'training', week: 8, year: 0 },
        }),
      ]),
    );

    expect(save.planning.alerts).toEqual([]);
    expect(getPlanningRecommendation(save, save.gladiators[0])).toMatchObject({
      buildingId: 'trainingGround',
    });
  });

  it('recommends the right building without assigning per-character routine tasks', () => {
    const save = synchronizePlanning(
      withPurchasedBuildings(
        withGladiators(createTestSave(), [
          createGladiator({
            weeklyInjury: { reason: 'training', week: 1, year: 1 },
          }),
        ]),
        ['infirmary'],
      ),
    );
    const result = applyPlanningRecommendations(save);

    expect(getPlanningRecommendation(save, save.gladiators[0])).toMatchObject({
      buildingId: 'infirmary',
      isAvailable: true,
    });
    expect(result.gladiators[0]).toEqual(save.gladiators[0]);
  });

  it('marks recommendations unavailable when the building is not purchased', () => {
    const save = synchronizePlanning(
      withGladiators(
        {
          ...createTestSave(),
          buildings: {
            ...createTestSave().buildings,
            infirmary: {
              ...createTestSave().buildings.infirmary,
              isPurchased: false,
            },
          },
        },
        [
          createGladiator({
            weeklyInjury: { reason: 'training', week: 1, year: 1 },
          }),
        ],
      ),
    );

    expect(getPlanningRecommendation(save, save.gladiators[0])).toMatchObject({
      buildingId: 'infirmary',
      isAvailable: false,
    });
  });

  it('uses macro needs before default training recommendations', () => {
    const save = synchronizePlanning(
      withPurchasedBuildings(withGladiators(createTestSave(), [createGladiator({})]), [
        'dormitory',
        'pleasureHall',
        'trainingGround',
      ]),
    );

    expect(getPlanningRecommendation(save, save.gladiators[0])).toMatchObject({
      buildingId: 'trainingGround',
      reasonKey: 'weeklyPlan.recommendations.balanced',
    });
  });

  it('updates daily macro plan points by activity bucket', () => {
    const save = synchronizePlanning(withGladiators(createTestSave(), [createGladiator()]));
    const result = updateDailyPlan(save, {
      activity: 'leisure',
      bucket: 'gladiatorTimePoints',
      dayOfWeek: 'monday',
      points: 0.4,
    });

    expect(result.planning.days.monday.gladiatorTimePoints.leisure).toBe(0);
  });

  it('caps daily macro plan updates to the bucket budget', () => {
    const save = synchronizePlanning(withGladiators(createTestSave(), [createGladiator()]));
    const result = updateDailyPlan(save, {
      activity: 'training',
      bucket: 'gladiatorTimePoints',
      dayOfWeek: 'monday',
      points: 20,
    });

    expect(result.planning.days.monday.gladiatorTimePoints.training).toBe(3);
    expect(getDailyPlanBucketRemaining(result.planning.days.monday, 'gladiatorTimePoints')).toBe(0);
  });

  it('selects an unlocked building activity for a daily activity', () => {
    const save = {
      ...createTestSave(),
      buildings: {
        ...createTestSave().buildings,
        farm: {
          ...createTestSave().buildings.farm,
          isPurchased: true,
          purchasedSkillIds: ['farm.market-surplus'],
        },
      },
    };
    const result = updateDailyPlanBuildingActivitySelection(save, {
      activity: 'production',
      activityId: 'farm.marketSurplus',
      dayOfWeek: 'monday',
    });

    expect(result.planning.days.monday.buildingActivitySelections.production).toBe(
      'farm.marketSurplus',
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
              production: 'farm.marketSurplus' as const,
            },
          },
        },
      },
    };
    const invalidResult = updateDailyPlanBuildingActivitySelection(save, {
      activity: 'production',
      activityId: 'farm.exportContracts',
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
