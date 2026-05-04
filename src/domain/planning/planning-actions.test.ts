import { describe, expect, it } from 'vitest';
import type { GameSave, Gladiator } from '../types';
import { createInitialSave } from '../saves/create-initial-save';
import {
  getDailyPlanBucketRemaining,
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

describe('planning actions', () => {
  it('synchronizes macro planning alerts for owned gladiators', () => {
    const save = synchronizePlanning(withGladiators(createTestSave(), [createGladiator()]));

    expect(save.planning.alerts).toEqual([]);
    expect(save.planning.year).toBe(save.time.year);
    expect(save.planning.week).toBe(save.time.week);
  });

  it('generates alerts for injured owned gladiators', () => {
    const save = synchronizePlanning(
      withGladiators(createTestSave(), [
        createGladiator({
          weeklyInjury: { reason: 'training', week: 1, year: 1 },
        }),
      ]),
    );

    expect(save.planning.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: 'warning',
          titleKey: 'alerts.injury.title',
          gladiatorId: expect.any(String),
        }),
      ]),
    );
  });

  it('ignores stale weekly injuries when generating alerts', () => {
    const save = synchronizePlanning(
      withGladiators(createTestSave(), [
        createGladiator({
          weeklyInjury: { reason: 'training', week: 8, year: 0 },
        }),
      ]),
    );

    expect(save.planning.alerts).toEqual([]);
  });

  it('updates daily macro plan points by activity bucket', () => {
    const save = synchronizePlanning(withGladiators(createTestSave(), [createGladiator()]));
    const result = updateDailyPlan(save, {
      activity: 'lifeTraining',
      bucket: 'gladiatorTimePoints',
      dayOfWeek: 'monday',
      points: 0.4,
    });

    expect(result.planning.days.monday.gladiatorTimePoints.lifeTraining).toBe(0);
  });

  it('caps daily macro plan updates to the bucket budget', () => {
    const save = synchronizePlanning(withGladiators(createTestSave(), [createGladiator()]));
    const result = updateDailyPlan(save, {
      activity: 'strengthTraining',
      bucket: 'gladiatorTimePoints',
      dayOfWeek: 'monday',
      points: 20,
    });

    expect(result.planning.days.monday.gladiatorTimePoints.strengthTraining).toBe(8);
    expect(
      getDailyPlanBucketRemaining(result, result.planning.days.monday, 'gladiatorTimePoints'),
    ).toBe(0);
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
