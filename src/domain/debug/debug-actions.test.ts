import { describe, expect, it } from 'vitest';
import { GLADIATOR_PROGRESSION_CONFIG } from '../../game-data/gladiators/progression';
import type { GameEvent } from '../events/types';
import {
  getAvailableSkillPoints,
  getGladiatorLevel,
  getGladiatorLevelFromExperience,
} from '../gladiators/progression';
import type { Gladiator } from '../gladiators/types';
import { getDailyPlanBucketBudget, synchronizePlanning } from '../planning/planning-actions';
import { createInitialSave } from '../saves/create-initial-save';
import type { GameSave } from '../saves/types';
import type { DayOfWeek } from '../time/types';
import {
  adjustDebugTreasury,
  advanceDebugToDay,
  createDebugInjuryAlert,
  getDebugDayAdvanceDistance,
  levelUpDebugGladiator,
} from './debug-actions';

function createGladiator(overrides: Partial<Gladiator> = {}): Gladiator {
  return {
    id: 'gladiator-test',
    name: 'Aulus',
    age: 20,
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

function createPendingEvent(save: GameSave): GameEvent {
  return {
    id: 'event-test',
    definitionId: 'debug-test-event',
    titleKey: 'events.test.title',
    descriptionKey: 'events.test.description',
    status: 'pending',
    createdAtYear: save.time.year,
    createdAtWeek: save.time.week,
    createdAtDay: save.time.dayOfWeek,
    choices: [],
  };
}

function createTestSave(overrides: Partial<GameSave> = {}): GameSave {
  const save = createInitialSave({
    ludusName: 'Ludus Magnus',
    saveId: 'save-test',
    createdAt: '2026-04-25T12:00:00.000Z',
  });
  const { pendingActionTrigger, ...time } = save.time;

  void pendingActionTrigger;

  return {
    ...save,
    time,
    gladiators: [createGladiator()],
    ...overrides,
  };
}

function withCompleteWeeklyPlanning(save: GameSave): GameSave {
  const plannedDays: DayOfWeek[] = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  const days = { ...save.planning.days };

  for (const dayOfWeek of plannedDays) {
    days[dayOfWeek] = {
      ...days[dayOfWeek],
      gladiatorTimePoints: {
        ...days[dayOfWeek].gladiatorTimePoints,
        training: getDailyPlanBucketBudget(save, 'gladiatorTimePoints'),
        meals: 0,
        sleep: 0,
      },
    };
  }

  return synchronizePlanning({
    ...save,
    planning: {
      ...save.planning,
      days,
    },
  });
}

describe('debug actions', () => {
  it('allows debug treasury adjustments to push the ludus below zero', () => {
    const save = createTestSave();
    const result = adjustDebugTreasury(save, -600);

    expect(result.ludus.treasury).toBe(-100);
    expect(result.economy.ledgerEntries[0]).toMatchObject({
      kind: 'expense',
      category: 'other',
      amount: 600,
      labelKey: 'finance.ledger.debugTreasuryAdjustment',
    });
  });

  it('levels a gladiator up to the exact next threshold', () => {
    const save = createTestSave({
      gladiators: [createGladiator({ experience: 99 })],
    });

    const result = levelUpDebugGladiator(save, 'gladiator-test');
    const gladiator = result.gladiators[0];

    expect(gladiator.experience).toBe(GLADIATOR_PROGRESSION_CONFIG.experienceByLevel[1]);
    expect(getGladiatorLevel(gladiator)).toBe(2);
    expect(getAvailableSkillPoints(gladiator)).toBe(1);
    expect(result.planning.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionKind: 'allocateGladiatorSkillPoint',
          gladiatorId: 'gladiator-test',
        }),
      ]),
    );
  });

  it('does not change a gladiator already at max level', () => {
    const maxLevelExperience = GLADIATOR_PROGRESSION_CONFIG.experienceByLevel.at(-1)!;
    const save = createTestSave({
      gladiators: [createGladiator({ experience: maxLevelExperience })],
    });

    expect(getGladiatorLevelFromExperience(maxLevelExperience)).toBe(
      GLADIATOR_PROGRESSION_CONFIG.maxLevel,
    );
    expect(levelUpDebugGladiator(save, 'gladiator-test')).toBe(save);
  });

  it('creates an injury gladiator trait and planning alert for the selected gladiator', () => {
    const save = createTestSave();

    const result = createDebugInjuryAlert(save, 'gladiator-test');

    expect(result.gladiators[0].traits).toEqual([
      expect.objectContaining({
        traitId: 'injury',
      }),
    ]);
    expect(result.planning.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: 'warning',
          titleKey: 'traits.injury.name',
          gladiatorId: 'gladiator-test',
          traitId: 'injury',
        }),
      ]),
    );
  });

  it('advances to a future day when no interruption blocks the path', () => {
    const save = withCompleteWeeklyPlanning(createTestSave());

    const result = advanceDebugToDay(save, 'thursday', () => 1);

    expect(result.time).toMatchObject({ dayOfWeek: 'thursday', phase: 'planning' });
  });

  it('treats an already-passed day as the next occurrence', () => {
    const save = withCompleteWeeklyPlanning(
      createTestSave({
        time: {
          ...createTestSave().time,
          dayOfWeek: 'tuesday',
        },
      }),
    );

    const result = advanceDebugToDay(save, 'monday', () => 1);

    expect(getDebugDayAdvanceDistance('tuesday', 'monday')).toBe(6);
    expect(result.time).toMatchObject({
      dayOfWeek: 'sunday',
      phase: 'arena',
      pendingActionTrigger: 'enterArena',
    });
    expect(result.arena.arenaDay).toBeUndefined();
  });

  it('advances even when weekly planning is incomplete', () => {
    const save = createTestSave();

    expect(advanceDebugToDay(save, 'tuesday', () => 1).time).toMatchObject({
      dayOfWeek: 'tuesday',
      phase: 'planning',
    });
  });

  it('stops before advancing when an event is pending', () => {
    const baseSave = withCompleteWeeklyPlanning(createTestSave());
    const save = {
      ...baseSave,
      events: {
        ...baseSave.events,
        pendingEvents: [createPendingEvent(baseSave)],
      },
    };

    expect(advanceDebugToDay(save, 'tuesday', () => 1)).toBe(save);
  });

  it('stops before advancing when Sunday arena is active', () => {
    const save = withCompleteWeeklyPlanning(
      createTestSave({
        time: {
          ...createTestSave().time,
          dayOfWeek: 'sunday',
          phase: 'arena',
        },
        arena: {
          resolvedCombats: [],
          isArenaDayActive: true,
          arenaDay: {
            year: 1,
            week: 1,
            phase: 'summary',
            presentedCombatIds: [],
          },
        },
      }),
    );

    expect(advanceDebugToDay(save, 'monday', () => 1)).toBe(save);
  });
});
