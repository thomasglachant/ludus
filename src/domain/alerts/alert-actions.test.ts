import { describe, expect, it } from 'vitest';
import type { GameSave, Gladiator } from '../types';
import { getDailyPlanBucketBudget } from '../planning/planning-actions';
import { createInitialSave } from '../saves/create-initial-save';
import {
  applyGladiatorTrait,
  applyGladiatorTraitAtDate,
} from '../gladiator-traits/gladiator-trait-actions';
import { generateGameAlerts, refreshGameAlerts } from './alert-actions';

function createTestSave(overrides: Partial<GameSave> = {}): GameSave {
  const save = createInitialSave({
    ludusName: 'Ludus Magnus',
    saveId: 'save-test',
    createdAt: '2026-04-25T12:00:00.000Z',
  });

  return {
    ...save,
    ...overrides,
  };
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

function withoutAlerts(save: GameSave): GameSave {
  return {
    ...save,
    planning: {
      ...save.planning,
      alerts: [],
    },
  };
}

function withGladiators(save: GameSave, gladiators: Gladiator[]): GameSave {
  return {
    ...save,
    gladiators,
  };
}

function withCompleteRemainingPlanning(save: GameSave): GameSave {
  const budget = getDailyPlanBucketBudget(save, 'gladiatorTimePoints');

  return {
    ...save,
    planning: {
      ...save.planning,
      days: Object.fromEntries(
        Object.entries(save.planning.days).map(([dayOfWeek, plan]) => [
          dayOfWeek,
          {
            ...plan,
            gladiatorTimePoints: {
              ...plan.gladiatorTimePoints,
              training: dayOfWeek === 'sunday' ? 0 : budget,
            },
          },
        ]),
      ) as GameSave['planning']['days'],
    },
  };
}

describe('alert actions', () => {
  it('generates a critical Ludus alert when the remaining weekly planning is empty', () => {
    const save = refreshGameAlerts(
      withoutAlerts(withGladiators(createTestSave(), [createGladiator()])),
    );

    expect(save.planning.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'alert-weekly-planning-empty',
          severity: 'critical',
          titleKey: 'alerts.emptyPlanning.title',
          actionKind: 'openWeeklyPlanning',
        }),
      ]),
    );
    expect(
      save.planning.alerts.some((alert) => alert.id === 'alert-weekly-planning-incomplete'),
    ).toBe(false);
  });

  it('generates a warning Ludus alert when the remaining weekly planning has started but is incomplete', () => {
    const baseSave = withoutAlerts(withGladiators(createTestSave(), [createGladiator()]));
    const save = refreshGameAlerts({
      ...baseSave,
      planning: {
        ...baseSave.planning,
        days: {
          ...baseSave.planning.days,
          monday: {
            ...baseSave.planning.days.monday,
            gladiatorTimePoints: {
              ...baseSave.planning.days.monday.gladiatorTimePoints,
              training: 1,
            },
          },
        },
      },
    });

    expect(save.planning.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'alert-weekly-planning-incomplete',
          severity: 'warning',
          titleKey: 'alerts.incompletePlanning.title',
          actionKind: 'openWeeklyPlanning',
        }),
      ]),
    );
    expect(save.planning.alerts.some((alert) => alert.id === 'alert-weekly-planning-empty')).toBe(
      false,
    );
  });

  it('does not generate planning alerts when planning is complete or no gladiator is owned', () => {
    const completeSave = refreshGameAlerts(
      withCompleteRemainingPlanning(
        withoutAlerts(withGladiators(createTestSave(), [createGladiator()])),
      ),
    );
    const emptyRosterSave = refreshGameAlerts(withoutAlerts(createTestSave()));

    for (const save of [completeSave, emptyRosterSave]) {
      expect(save.planning.alerts.some((alert) => alert.actionKind === 'openWeeklyPlanning')).toBe(
        false,
      );
    }
  });

  it('generates a Dormitory building alert when a recruitable market gladiator can be hired', () => {
    const save = refreshGameAlerts(withoutAlerts(createTestSave()));

    expect(save.planning.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'alert-dormitory-open-register',
          severity: 'warning',
          titleKey: 'alerts.openRegister.title',
          actionKind: 'openMarket',
          buildingId: 'dormitory',
        }),
      ]),
    );
  });

  it('uses info severity for the Dormitory alert when the roster is not empty', () => {
    const baseSave = withoutAlerts(withGladiators(createTestSave(), [createGladiator()]));
    const save = refreshGameAlerts({
      ...baseSave,
      buildings: {
        ...baseSave.buildings,
        dormitory: {
          ...baseSave.buildings.dormitory,
          purchasedImprovementIds: ['dormitoryExtraBunk1'],
        },
      },
    });

    expect(save.planning.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'alert-dormitory-open-register',
          severity: 'info',
        }),
      ]),
    );
  });

  it('does not generate a Dormitory alert without place, market stock or treasury', () => {
    const fullSave = refreshGameAlerts(
      withoutAlerts(withGladiators(createTestSave(), [createGladiator()])),
    );
    const emptyMarketSave = refreshGameAlerts(
      withoutAlerts({
        ...createTestSave(),
        market: {
          ...createTestSave().market,
          availableGladiators: [],
        },
      }),
    );
    const lowTreasurySave = refreshGameAlerts(
      withoutAlerts({
        ...createTestSave(),
        ludus: {
          ...createTestSave().ludus,
          treasury: 0,
        },
      }),
    );

    for (const save of [fullSave, emptyMarketSave, lowTreasurySave]) {
      expect(save.planning.alerts.some((alert) => alert.actionKind === 'openMarket')).toBe(false);
    }
  });

  it('generates gladiator alerts for visible gladiator traits and unassigned skill points', () => {
    const save = refreshGameAlerts(
      withCompleteRemainingPlanning(
        withoutAlerts(
          applyGladiatorTrait(
            withGladiators(createTestSave(), [createGladiator({ experience: 100 })]),
            'injury',
            2,
            'gladiator-test',
          ),
        ),
      ),
    );

    expect(save.planning.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: 'warning',
          titleKey: 'traits.injury.name',
          gladiatorId: 'gladiator-test',
          traitId: 'injury',
        }),
        expect.objectContaining({
          severity: 'info',
          titleKey: 'alerts.unassignedSkillPoints.title',
          actionKind: 'allocateGladiatorSkillPoint',
          gladiatorId: 'gladiator-test',
        }),
      ]),
    );
  });

  it('does not duplicate skill alerts when a gladiator has temporary traits', () => {
    const save = refreshGameAlerts(
      withCompleteRemainingPlanning(
        withoutAlerts(
          applyGladiatorTrait(
            applyGladiatorTrait(
              withGladiators(createTestSave(), [createGladiator({ experience: 100 })]),
              'victoryAura',
              3,
              'gladiator-test',
            ),
            'injury',
            2,
            'gladiator-test',
          ),
        ),
      ),
    );

    expect(
      save.planning.alerts.filter((alert) => alert.id === 'alert-gladiator-test-skill-point'),
    ).toHaveLength(1);
  });

  it('ignores silent or expired gladiator traits when generating gladiator alerts', () => {
    const permanentSave = refreshGameAlerts(
      withCompleteRemainingPlanning(
        withoutAlerts(
          withGladiators(createTestSave(), [createGladiator({ traits: [{ traitId: 'fragile' }] })]),
        ),
      ),
    );
    const silentSave = refreshGameAlerts(
      withCompleteRemainingPlanning(
        withoutAlerts(
          applyGladiatorTrait(
            withGladiators(createTestSave(), [createGladiator()]),
            'victoryAura',
            3,
            'gladiator-test',
          ),
        ),
      ),
    );
    const expiredSave = refreshGameAlerts(
      withCompleteRemainingPlanning(
        withoutAlerts(
          applyGladiatorTraitAtDate(
            withGladiators(createTestSave(), [createGladiator()]),
            'injury',
            1,
            'gladiator-test',
            { dayOfWeek: 'monday', week: 8, year: 0 },
          ),
        ),
      ),
    );

    for (const save of [permanentSave, silentSave, expiredSave]) {
      expect(save.planning.alerts.some((alert) => alert.traitId)).toBe(false);
    }
  });

  it('removes inactive alerts and preserves createdAt for alerts that remain active', () => {
    const existingCreatedAt = '2026-04-20T12:00:00.000Z';
    const save = withoutAlerts(withGladiators(createTestSave(), [createGladiator()]));
    const alerts = generateGameAlerts(save, [
      {
        id: 'alert-weekly-planning-empty',
        severity: 'critical',
        titleKey: 'alerts.emptyPlanning.title',
        descriptionKey: 'alerts.emptyPlanning.description',
        actionKind: 'openWeeklyPlanning',
        createdAt: existingCreatedAt,
      },
      {
        id: 'alert-stale',
        severity: 'info',
        titleKey: 'alerts.stale.title',
        descriptionKey: 'alerts.stale.description',
        createdAt: existingCreatedAt,
      },
    ]);

    expect(alerts.find((alert) => alert.id === 'alert-weekly-planning-empty')?.createdAt).toBe(
      existingCreatedAt,
    );
    expect(alerts.some((alert) => alert.id === 'alert-stale')).toBe(false);
  });

  it('returns the same save object when active alerts did not change', () => {
    const save = refreshGameAlerts(
      withoutAlerts(withGladiators(createTestSave(), [createGladiator()])),
    );

    expect(refreshGameAlerts(save)).toBe(save);
  });
});
