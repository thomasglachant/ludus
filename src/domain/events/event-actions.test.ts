import { describe, expect, it } from 'vitest';
import type { Gladiator } from '../gladiators/types';
import { applyGladiatorTrait } from '../gladiators/trait-actions';
import { createInitialSave } from '../saves/create-initial-save';
import type { GameSave } from '../saves/types';
import { createDefaultDailyPlan } from '../weekly-simulation/weekly-simulation-actions';
import {
  resolveGameEventChoice,
  synchronizeMacroEvents,
  synchronizeReactiveEvents,
  validateGameEventChoice,
} from './event-actions';
import type { GameEvent } from './types';

function createGladiator(overrides: Partial<Gladiator> = {}): Gladiator {
  return {
    id: 'gladiator-test',
    name: 'Aulus',
    age: 24,
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

describe('event actions', () => {
  it('generates activity-gated daily events from the current plan', () => {
    const plan = createDefaultDailyPlan('monday');
    plan.gladiatorTimePoints.training = 1;

    const result = synchronizeMacroEvents(createTestSave(), plan, () => 0);

    expect(result.createdEventIds).toHaveLength(1);
    expect(result.save.events.pendingEvents[0]).toMatchObject({
      definitionId: 'trainingRefusal',
      status: 'pending',
    });
  });

  it('does not select unavailable gladiators for default targeted events', () => {
    const plan = createDefaultDailyPlan('monday');
    plan.gladiatorTimePoints.training = 1;
    const save = applyGladiatorTrait(createTestSave(), 'rest', 2, 'gladiator-test');

    const result = synchronizeMacroEvents(save, plan, () => 0);

    expect(result.createdEventIds).toEqual([]);
    expect(result.save.events.pendingEvents).toEqual([]);
  });

  it('resolves event choices and records resolved events', () => {
    const plan = createDefaultDailyPlan('monday');
    plan.gladiatorTimePoints.training = 1;
    const synchronized = synchronizeMacroEvents(createTestSave(), plan, () => 0).save;
    const event = synchronized.events.pendingEvents[0];
    const result = resolveGameEventChoice(synchronized, event.id, 'grantRest').save;

    expect(result.events.pendingEvents).toEqual([]);
    expect(result.events.resolvedEvents[0]).toMatchObject({
      id: event.id,
      selectedChoiceId: 'grantRest',
      status: 'resolved',
    });
    expect(result.gladiators[0].traits).toEqual([
      {
        traitId: 'rest',
        expiresAt: { dayOfWeek: 'wednesday', week: 1, year: 1 },
      },
    ]);
    expect(result.planning.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          gladiatorId: 'gladiator-test',
          traitId: 'rest',
        }),
      ]),
    );
  });

  it('starts Sunday arena after resolving the final Saturday interruption', () => {
    const save = createTestSave();
    const event: GameEvent = {
      id: 'event-saturday-test',
      definitionId: 'saturdayInterruptionTest',
      titleKey: 'events.trainingRefusal.title',
      descriptionKey: 'events.trainingRefusal.description',
      status: 'pending' as const,
      createdAtYear: save.time.year,
      createdAtWeek: save.time.week,
      createdAtDay: 'saturday' as const,
      choices: [
        {
          id: 'continue',
          labelKey: 'events.trainingRefusal.grantRest.label',
          consequenceKey: 'events.trainingRefusal.grantRest.consequence',
          consequences: [
            {
              kind: 'certain' as const,
              effects: [],
            },
          ],
        },
      ],
    };
    const result = resolveGameEventChoice(
      {
        ...save,
        events: {
          ...save.events,
          pendingEvents: [event],
        },
        time: {
          ...save.time,
          dayOfWeek: 'sunday',
          phase: 'event',
        },
      },
      event.id,
      'continue',
      () => 1,
    ).save;

    expect(result.events.pendingEvents).toEqual([]);
    expect(result.time).toMatchObject({
      dayOfWeek: 'sunday',
      phase: 'arena',
      pendingActionTrigger: 'enterArena',
    });
    expect(result.arena.arenaDay).toBeUndefined();
  });

  it('resolves strict drill as training experience and refreshes skill alerts', () => {
    const plan = createDefaultDailyPlan('monday');
    plan.gladiatorTimePoints.training = 1;
    const save = createTestSave({
      gladiators: [createGladiator({ experience: 90, strength: 3 })],
    });
    const synchronized = synchronizeMacroEvents(save, plan, () => 0).save;
    const event = synchronized.events.pendingEvents[0];
    const result = resolveGameEventChoice(synchronized, event.id, 'strictDrill').save;

    expect(result.gladiators[0].experience).toBeGreaterThan(save.gladiators[0].experience);
    expect(result.gladiators[0].strength).toBe(save.gladiators[0].strength);
    expect(result.planning.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionKind: 'allocateGladiatorSkillPoint',
          gladiatorId: 'gladiator-test',
        }),
      ]),
    );
    expect(result.notifications).toEqual([
      expect.objectContaining({
        titleKey: 'notifications.levelUp.title',
        descriptionKey: 'notifications.levelUp.description',
        params: { name: 'Aulus', level: 2 },
        target: { kind: 'gladiator', gladiatorId: 'gladiator-test' },
      }),
    ]);
  });

  it('applies gladiator traits from event consequences', () => {
    const save = createTestSave();
    const event: GameEvent = {
      id: 'event-trait-test',
      definitionId: 'traitTest',
      titleKey: 'events.trainingRefusal.title',
      descriptionKey: 'events.trainingRefusal.description',
      status: 'pending' as const,
      createdAtYear: save.time.year,
      createdAtWeek: save.time.week,
      createdAtDay: save.time.dayOfWeek,
      gladiatorId: 'gladiator-test',
      choices: [
        {
          id: 'applyInjury',
          labelKey: 'events.trainingRefusal.grantRest.label',
          consequenceKey: 'events.trainingRefusal.grantRest.consequence',
          consequences: [
            {
              kind: 'certain' as const,
              effects: [
                {
                  type: 'applyGladiatorTrait' as const,
                  gladiatorId: 'gladiator-test',
                  traitId: 'injury',
                  durationDays: 2,
                },
              ],
            },
          ],
        },
      ],
    };
    const result = resolveGameEventChoice(
      {
        ...save,
        events: {
          ...save.events,
          pendingEvents: [event],
        },
        time: {
          ...save.time,
          phase: 'event',
        },
      },
      event.id,
      'applyInjury',
    ).save;

    expect(result.gladiators[0].traits).toEqual([
      {
        traitId: 'injury',
        expiresAt: { dayOfWeek: 'wednesday', week: 1, year: 1 },
      },
    ]);
    expect(result.planning.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          gladiatorId: 'gladiator-test',
          traitId: 'injury',
        }),
      ]),
    );
    expect(result.notifications).toEqual([
      expect.objectContaining({
        titleKey: 'notifications.injury.title',
        params: { name: 'Aulus' },
        target: { kind: 'gladiator', gladiatorId: 'gladiator-test' },
      }),
    ]);
  });

  it('notifies when an event removes a gladiator from the ludus', () => {
    const save = createTestSave();
    const event = {
      id: 'event-remove-test',
      definitionId: 'removeTest',
      titleKey: 'events.trainingRefusal.title',
      descriptionKey: 'events.trainingRefusal.description',
      status: 'pending' as const,
      createdAtYear: save.time.year,
      createdAtWeek: save.time.week,
      createdAtDay: save.time.dayOfWeek,
      gladiatorId: 'gladiator-test',
      choices: [
        {
          id: 'remove',
          labelKey: 'events.trainingRefusal.grantRest.label',
          consequenceKey: 'events.trainingRefusal.grantRest.consequence',
          consequences: [
            {
              kind: 'certain' as const,
              effects: [{ type: 'removeGladiator' as const, gladiatorId: 'gladiator-test' }],
            },
          ],
        },
      ],
    };
    const result = resolveGameEventChoice(
      {
        ...save,
        events: {
          ...save.events,
          pendingEvents: [event],
        },
        time: {
          ...save.time,
          phase: 'event',
        },
      },
      event.id,
      'remove',
    ).save;

    expect(result.gladiators).toEqual([]);
    expect(result.notifications).toEqual([
      expect.objectContaining({
        titleKey: 'notifications.gladiatorLeft.title',
        params: { name: 'Aulus' },
        target: undefined,
      }),
    ]);
  });

  it('ignores targeted event effects for unavailable gladiators by default', () => {
    const save = applyGladiatorTrait(createTestSave(), 'rest', 2, 'gladiator-test');
    const event = {
      id: 'event-unavailable-target-test',
      definitionId: 'unavailableTargetTest',
      titleKey: 'events.trainingRefusal.title',
      descriptionKey: 'events.trainingRefusal.description',
      status: 'pending' as const,
      createdAtYear: save.time.year,
      createdAtWeek: save.time.week,
      createdAtDay: save.time.dayOfWeek,
      gladiatorId: 'gladiator-test',
      choices: [
        {
          id: 'reward',
          labelKey: 'events.trainingRefusal.grantRest.label',
          consequenceKey: 'events.trainingRefusal.grantRest.consequence',
          consequences: [
            {
              kind: 'certain' as const,
              effects: [
                {
                  type: 'changeGladiatorExperience' as const,
                  gladiatorId: 'gladiator-test',
                  amount: 100,
                },
                { type: 'removeGladiator' as const, gladiatorId: 'gladiator-test' },
              ],
            },
          ],
        },
      ],
    };
    const result = resolveGameEventChoice(
      {
        ...save,
        events: { ...save.events, pendingEvents: [event] },
        time: { ...save.time, phase: 'event' },
      },
      event.id,
      'reward',
    ).save;

    expect(result.gladiators[0].experience).toBe(save.gladiators[0].experience);
    expect(result.gladiators).toHaveLength(1);
  });

  it('allows targeted event effects to bypass activity eligibility explicitly', () => {
    const save = applyGladiatorTrait(createTestSave(), 'rest', 2, 'gladiator-test');
    const event = {
      id: 'event-unavailable-bypass-test',
      definitionId: 'unavailableBypassTest',
      titleKey: 'events.trainingRefusal.title',
      descriptionKey: 'events.trainingRefusal.description',
      status: 'pending' as const,
      createdAtYear: save.time.year,
      createdAtWeek: save.time.week,
      createdAtDay: save.time.dayOfWeek,
      gladiatorId: 'gladiator-test',
      choices: [
        {
          id: 'treat',
          labelKey: 'events.trainingRefusal.grantRest.label',
          consequenceKey: 'events.trainingRefusal.grantRest.consequence',
          consequences: [
            {
              kind: 'certain' as const,
              effects: [
                {
                  type: 'changeGladiatorExperience' as const,
                  gladiatorId: 'gladiator-test',
                  amount: 100,
                  bypassActivityEligibility: true,
                },
              ],
            },
          ],
        },
      ],
    };
    const result = resolveGameEventChoice(
      {
        ...save,
        events: { ...save.events, pendingEvents: [event] },
        time: { ...save.time, phase: 'event' },
      },
      event.id,
      'treat',
    ).save;

    expect(result.gladiators[0].experience).toBeGreaterThan(save.gladiators[0].experience);
  });

  it('creates one global notification when all gladiators are released', () => {
    const save = createTestSave({
      gladiators: [createGladiator(), createGladiator({ id: 'gladiator-second', name: 'Brutus' })],
    });
    const event = {
      id: 'event-release-test',
      definitionId: 'releaseTest',
      titleKey: 'events.rebellionCrisis.title',
      descriptionKey: 'events.rebellionCrisis.description',
      status: 'pending' as const,
      createdAtYear: save.time.year,
      createdAtWeek: save.time.week,
      createdAtDay: save.time.dayOfWeek,
      choices: [
        {
          id: 'release',
          labelKey: 'events.rebellionCrisis.freeGladiators.label',
          consequenceKey: 'events.rebellionCrisis.freeGladiators.consequence',
          consequences: [
            {
              kind: 'certain' as const,
              effects: [{ type: 'releaseAllGladiators' as const }],
            },
          ],
        },
      ],
    };
    const result = resolveGameEventChoice(
      {
        ...save,
        events: {
          ...save.events,
          pendingEvents: [event],
        },
        time: {
          ...save.time,
          phase: 'event',
        },
      },
      event.id,
      'release',
    ).save;

    expect(result.gladiators).toEqual([]);
    expect(result.notifications).toEqual([
      expect.objectContaining({
        titleKey: 'notifications.allGladiatorsReleased.title',
        params: { count: 2 },
      }),
    ]);
  });

  it('prioritizes rebellion crisis events when rebellion is critical', () => {
    const result = synchronizeMacroEvents(
      createTestSave({
        ludus: {
          ...createTestSave().ludus,
          rebellion: 85,
        },
      }),
      createDefaultDailyPlan('monday'),
      () => 0,
    ).save;

    expect(result.events.pendingEvents[0]).toMatchObject({
      definitionId: 'rebellionCrisis',
    });
  });

  it('creates a reactive debt crisis event when treasury drops below zero', () => {
    const save = createTestSave({
      ludus: {
        ...createTestSave().ludus,
        treasury: -1,
      },
    });
    const result = synchronizeReactiveEvents(save);

    expect(result.time.phase).toBe('event');
    expect(result.events.pendingEvents[0]).toMatchObject({
      definitionId: 'debtCrisis',
      source: 'reactive',
      status: 'pending',
    });
  });

  it('does not duplicate the reactive debt crisis event', () => {
    const save = synchronizeReactiveEvents(
      createTestSave({
        ludus: {
          ...createTestSave().ludus,
          treasury: -1,
        },
      }),
    );
    const result = synchronizeReactiveEvents(save);

    expect(
      result.events.pendingEvents.filter((event) => event.definitionId === 'debtCrisis'),
    ).toHaveLength(1);
  });

  it('keeps reactive events ahead of random daily events', () => {
    const save = synchronizeReactiveEvents(
      createTestSave({
        ludus: {
          ...createTestSave().ludus,
          rebellion: 85,
          treasury: -1,
        },
      }),
    );
    const result = synchronizeMacroEvents(save, createDefaultDailyPlan('monday'), () => 0);

    expect(result.createdEventIds).toEqual([]);
    expect(result.save.events.pendingEvents[0]).toMatchObject({
      definitionId: 'debtCrisis',
      source: 'reactive',
    });
  });

  it('marks the game lost when the player abandons the debt crisis', () => {
    const save = synchronizeReactiveEvents(
      createTestSave({
        ludus: {
          ...createTestSave().ludus,
          treasury: -1,
        },
      }),
    );
    const event = save.events.pendingEvents[0];
    const result = resolveGameEventChoice(save, event.id, 'abandon').save;

    expect(result.ludus.gameStatus).toBe('lost');
    expect(result.time.phase).toBe('gameOver');
  });

  it('starts a seven-day debt grace period from the current date', () => {
    const save = synchronizeReactiveEvents(
      createTestSave({
        ludus: {
          ...createTestSave().ludus,
          treasury: -1,
        },
        time: {
          ...createTestSave().time,
          dayOfWeek: 'saturday',
          phase: 'planning',
        },
      }),
    );
    const event = save.events.pendingEvents[0];
    const result = resolveGameEventChoice(save, event.id, 'recover').save;

    expect(result.economy.debtCrisis).toEqual({
      status: 'grace',
      startedAt: { dayOfWeek: 'saturday', week: 1, year: 1 },
      deadlineAt: { dayOfWeek: 'saturday', week: 2, year: 1 },
    });
    expect(result.ludus.gameStatus).toBe('active');
  });

  it('waits until the exact grace deadline before losing the game', () => {
    const save = synchronizeReactiveEvents(
      createTestSave({
        ludus: {
          ...createTestSave().ludus,
          treasury: -1,
        },
        time: {
          ...createTestSave().time,
          dayOfWeek: 'saturday',
          phase: 'planning',
        },
      }),
    );
    const graceSave = resolveGameEventChoice(save, save.events.pendingEvents[0].id, 'recover').save;
    const mondayResult = synchronizeReactiveEvents({
      ...graceSave,
      time: {
        ...graceSave.time,
        dayOfWeek: 'monday',
        week: 2,
        phase: 'planning',
      },
    });
    const saturdayResult = synchronizeReactiveEvents({
      ...graceSave,
      time: {
        ...graceSave.time,
        dayOfWeek: 'saturday',
        week: 2,
        phase: 'planning',
      },
    });

    expect(mondayResult.ludus.gameStatus).toBe('active');
    expect(mondayResult.time.phase).toBe('planning');
    expect(saturdayResult.ludus.gameStatus).toBe('lost');
    expect(saturdayResult.time.phase).toBe('gameOver');
  });

  it('clears the debt crisis when the treasury is positive again', () => {
    const save = synchronizeReactiveEvents(
      createTestSave({
        ludus: {
          ...createTestSave().ludus,
          treasury: -1,
        },
      }),
    );
    const graceSave = resolveGameEventChoice(save, save.events.pendingEvents[0].id, 'recover').save;
    const result = synchronizeReactiveEvents({
      ...graceSave,
      ludus: {
        ...graceSave.ludus,
        treasury: 0,
      },
    });

    expect(result.economy.debtCrisis).toBeUndefined();
    expect(result.events.pendingEvents.some((event) => event.definitionId === 'debtCrisis')).toBe(
      false,
    );
  });

  it('blocks pay-for-calm when the player cannot afford the event cost', () => {
    const save = synchronizeMacroEvents(
      createTestSave({
        ludus: {
          ...createTestSave().ludus,
          rebellion: 85,
          treasury: 100,
        },
      }),
      createDefaultDailyPlan('monday'),
      () => 0,
    ).save;
    const event = save.events.pendingEvents[0];
    const validation = validateGameEventChoice(save, event.id, 'payForCalm');
    const result = resolveGameEventChoice(save, event.id, 'payForCalm').save;

    expect(validation).toMatchObject({
      isAllowed: false,
      cost: 220,
      reason: 'insufficientTreasury',
    });
    expect(result.events.pendingEvents[0]).toBe(event);
    expect(result.ludus.treasury).toBe(100);
  });
});
