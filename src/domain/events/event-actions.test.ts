import { describe, expect, it } from 'vitest';
import { DAILY_EVENT_DEFINITIONS, EVENT_CONFIG } from '../../game-data/events';
import type { DailyPlanActivity } from '../planning/types';
import { createInitialSave } from '../saves/create-initial-save';
import type { DayOfWeek, GameEvent, GameSave, Gladiator } from '../types';
import { createDefaultDailyPlan } from '../weekly-simulation/weekly-simulation-actions';
import {
  resolveGameEventChoice,
  synchronizeMacroEvents,
  triggerDebugDailyEvent,
} from './event-actions';

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
    age: 24,
    strength: 20,
    agility: 18,
    defense: 18,
    energy: 70,
    health: 100,
    morale: 60,
    reputation: 0,
    wins: 0,
    losses: 0,
    traits: [],
    ...overrides,
  };
}

function withTime(save: GameSave, year: number, week: number, dayOfWeek: DayOfWeek): GameSave {
  return {
    ...save,
    time: {
      ...save.time,
      year,
      week,
      dayOfWeek,
    },
  };
}

function createLaunchedEventRecord(
  definitionId: string,
  year: number,
  week: number,
  day: DayOfWeek,
) {
  return {
    eventId: `event-${year}-${week}-${day}-${definitionId}`,
    definitionId,
    launchedAtYear: year,
    launchedAtWeek: week,
    launchedAtDay: day,
  };
}

function createSequenceRandom(values: number[]) {
  let index = 0;

  return () => values[index++] ?? values[values.length - 1] ?? 0;
}

const dailyPlanActivities: DailyPlanActivity[] = [
  'training',
  'meals',
  'sleep',
  'leisure',
  'care',
  'contracts',
  'production',
  'security',
  'maintenance',
  'events',
];

function clearPlanPoints(plan: ReturnType<typeof createDefaultDailyPlan>) {
  for (const activity of dailyPlanActivities) {
    plan.gladiatorTimePoints[activity] = 0;
    plan.laborPoints[activity] = 0;
    plan.adminPoints[activity] = 0;
  }
}

function assignMacroActivityPoint(
  plan: ReturnType<typeof createDefaultDailyPlan>,
  activity: DailyPlanActivity,
) {
  if (activity === 'contracts' || activity === 'events') {
    plan.adminPoints[activity] = 1;
    return;
  }

  plan.laborPoints[activity] = 1;
}

function createRecordedEvent(save: GameSave, day: DayOfWeek, index = 0): GameEvent {
  return {
    id: `event-${save.time.year}-${save.time.week}-${day}-recorded-${index}`,
    definitionId: 'recordedEvent',
    titleKey: 'events.test.title',
    descriptionKey: 'events.test.description',
    status: 'resolved',
    createdAtYear: save.time.year,
    createdAtWeek: save.time.week,
    createdAtDay: day,
    choices: [],
    selectedChoiceId: 'choice-test',
  };
}

describe('event actions', () => {
  it('keeps exclusive event outcome groups complete and identifiable', () => {
    for (const definition of DAILY_EVENT_DEFINITIONS) {
      expect(
        definition.selectionWeightPercent ?? EVENT_CONFIG.defaultSelectionWeightPercent,
      ).toBeGreaterThanOrEqual(0);
      expect(definition.cooldownWeeks ?? EVENT_CONFIG.defaultCooldownWeeks).toBeGreaterThanOrEqual(
        0,
      );

      for (const choice of definition.choices) {
        for (const consequence of choice.consequences) {
          if (consequence.kind !== 'oneOf') {
            continue;
          }

          const totalChance = consequence.outcomes.reduce(
            (total, outcome) => total + outcome.chancePercent,
            0,
          );
          const outcomeIds = consequence.outcomes.map((outcome) => outcome.id);

          expect(totalChance).toBe(100);
          expect(new Set(outcomeIds).size).toBe(outcomeIds.length);
        }
      }
    }
  });

  it('defines activity-gated events with at least one trigger activity', () => {
    expect(
      DAILY_EVENT_DEFINITIONS.some(
        (definition) =>
          definition.triggerActivities?.length || definition.triggerBuildingActivities?.length,
      ),
    ).toBe(true);
  });

  it('defines delegated macro events with building and ludus gates', () => {
    const delegatedMacroEventIds = [
      'creditorPressure',
      'rivalPatronPoach',
      'cellblockConspiracy',
      'masterworkCommission',
      'arenaPatronFeud',
    ];
    const definitionsById = new Map(
      DAILY_EVENT_DEFINITIONS.map((definition) => [definition.id, definition]),
    );

    for (const id of delegatedMacroEventIds) {
      const definition = definitionsById.get(id);

      expect(definition, id).toBeDefined();
      expect(definition?.triggerActivities?.length ?? 0).toBeGreaterThan(0);
      expect(definition?.triggerBuildingActivities?.length ?? 0).toBeGreaterThan(0);
    }

    expect(definitionsById.get('creditorPressure')?.requiredLudus).toEqual({
      happinessAtMost: 60,
    });
    expect(definitionsById.get('cellblockConspiracy')?.requiredLudus).toEqual({
      rebellionAtLeast: 40,
      securityAtMost: 70,
    });
  });

  it('does not generate daily events without gladiators', () => {
    const synchronized = synchronizeMacroEvents(
      createTestSave(),
      createDefaultDailyPlan('monday'),
      () => 0,
    ).save;

    expect(synchronized.events.pendingEvents).toHaveLength(0);
    expect(synchronized.events.resolvedEvents).toHaveLength(0);
  });

  it('generates one daily event and resolves a choice', () => {
    const save: GameSave = {
      ...createTestSave(),
      gladiators: [createGladiator()],
    };
    const synchronized = synchronizeMacroEvents(
      save,
      createDefaultDailyPlan('monday'),
      () => 0,
    ).save;
    const event = synchronized.events.pendingEvents[0];

    expect(synchronized.events.pendingEvents).toHaveLength(1);
    expect(event.status).toBe('pending');

    const resolved = resolveGameEventChoice(synchronized, event.id, event.choices[0].id).save;

    expect(resolved.events.pendingEvents).toEqual([]);
    expect(resolved.events.resolvedEvents[0]).toMatchObject({
      id: event.id,
      status: 'resolved',
      selectedChoiceId: event.choices[0].id,
    });
    expect(resolved.gladiators[0].morale).toBeGreaterThan(save.gladiators[0].morale);
  });

  it('generates macro events only from activities that received plan points', () => {
    const save: GameSave = {
      ...createTestSave(),
      gladiators: [createGladiator()],
      events: {
        pendingEvents: [],
        resolvedEvents: [],
        launchedEvents: DAILY_EVENT_DEFINITIONS.filter(
          (definition) => !definition.triggerActivities?.length,
        ).map((definition) =>
          createLaunchedEventRecord(definition.id, createTestSave().time.year, 0, 'sunday'),
        ),
      },
    };
    const plan = createDefaultDailyPlan('monday');
    plan.gladiatorTimePoints.training = 0;
    plan.gladiatorTimePoints.meals = 0;
    plan.gladiatorTimePoints.sleep = 0;
    plan.gladiatorTimePoints.leisure = 0;
    plan.gladiatorTimePoints.care = 0;
    plan.adminPoints.contracts = 0;
    plan.adminPoints.events = 0;
    plan.laborPoints.production = 2;
    plan.laborPoints.security = 0;
    plan.laborPoints.maintenance = 0;
    const result = synchronizeMacroEvents(save, plan, () => 0);

    expect(result.createdEventIds).toHaveLength(1);
    expect(result.save.events.pendingEvents[0].definitionId).toBe('toolTheft');
  });

  it('requires selected building activities for building-specific macro events', () => {
    const save: GameSave = {
      ...createTestSave(),
      gladiators: [createGladiator()],
      events: {
        pendingEvents: [],
        resolvedEvents: [],
        launchedEvents: DAILY_EVENT_DEFINITIONS.filter(
          (definition) => definition.id !== 'armyTrainingRequest',
        ).map((definition) =>
          createLaunchedEventRecord(definition.id, createTestSave().time.year, 0, 'sunday'),
        ),
      },
    };
    const plan = createDefaultDailyPlan('monday');
    clearPlanPoints(plan);
    plan.adminPoints.contracts = 1;

    expect(synchronizeMacroEvents(save, plan, () => 0).createdEventIds).toEqual([]);

    plan.buildingActivitySelections.contracts = 'trainingGround.soldierTraining';

    const result = synchronizeMacroEvents(save, plan, () => 0);

    expect(result.createdEventIds).toHaveLength(1);
    expect(result.save.events.pendingEvents[0].definitionId).toBe('armyTrainingRequest');
  });

  it('keeps current macro activity events gated by their planned activity', () => {
    const macroActivities: DailyPlanActivity[] = [
      'events',
      'contracts',
      'production',
      'security',
      'maintenance',
    ];

    for (const activity of macroActivities) {
      const save: GameSave = {
        ...createTestSave(),
        gladiators: [createGladiator()],
        events: {
          pendingEvents: [],
          resolvedEvents: [],
          launchedEvents: DAILY_EVENT_DEFINITIONS.filter(
            (definition) => !definition.triggerActivities?.includes(activity),
          ).map((definition) =>
            createLaunchedEventRecord(definition.id, createTestSave().time.year, 0, 'sunday'),
          ),
        },
      };
      const plan = createDefaultDailyPlan('monday');
      clearPlanPoints(plan);
      assignMacroActivityPoint(plan, activity);

      const result = synchronizeMacroEvents(save, plan, () => 0);
      const createdDefinition = DAILY_EVENT_DEFINITIONS.find(
        (definition) => definition.id === result.save.events.pendingEvents[0]?.definitionId,
      );

      expect(result.createdEventIds).toHaveLength(1);
      expect(createdDefinition?.triggerActivities).toContain(activity);
    }
  });

  it('does not generate macro events when all eligible activity definitions are blocked', () => {
    const save: GameSave = {
      ...createTestSave(),
      gladiators: [createGladiator()],
      events: {
        pendingEvents: [],
        resolvedEvents: [],
        launchedEvents: DAILY_EVENT_DEFINITIONS.map((definition) =>
          createLaunchedEventRecord(definition.id, createTestSave().time.year, 0, 'sunday'),
        ),
      },
    };
    const result = synchronizeMacroEvents(save, createDefaultDailyPlan('monday'), () => 0);

    expect(result.createdEventIds).toEqual([]);
    expect(result.save.events.pendingEvents).toEqual([]);
  });

  it('prioritizes rebellion crisis events when rebellion is critical', () => {
    const save: GameSave = {
      ...createTestSave(),
      ludus: {
        ...createTestSave().ludus,
        rebellion: 85,
      },
      gladiators: [createGladiator()],
    };
    const result = synchronizeMacroEvents(save, createDefaultDailyPlan('monday'), () => 0);

    expect(result.save.events.pendingEvents[0]).toMatchObject({
      definitionId: 'rebellionCrisis',
    });
  });

  it('can resolve rebellion by freeing every gladiator', () => {
    const save: GameSave = {
      ...createTestSave(),
      ludus: {
        ...createTestSave().ludus,
        rebellion: 85,
      },
      gladiators: [createGladiator(), createGladiator({ id: 'gladiator-second' })],
    };
    const synchronized = synchronizeMacroEvents(
      save,
      createDefaultDailyPlan('monday'),
      () => 0,
    ).save;
    const event = synchronized.events.pendingEvents[0];
    const result = resolveGameEventChoice(synchronized, event.id, 'freeGladiators').save;

    expect(result.gladiators).toEqual([]);
    expect(result.ludus.rebellion).toBe(5);
    expect(result.ludus.happiness).toBe(90);
  });

  it('records treasury event outcomes in the financial ledger', () => {
    const save = createTestSave();
    const synchronized = triggerDebugDailyEvent(save, 'surplusHarvest', () => 0);
    const event = synchronized.events.pendingEvents[0];
    const result = resolveGameEventChoice(synchronized, event.id, 'sellSurplus').save;

    expect(result.ludus.treasury).toBe(save.ludus.treasury + 80);
    expect(result.economy.ledgerEntries[0]).toMatchObject({
      amount: 80,
      category: 'event',
      kind: 'income',
      labelKey: 'events.surplusHarvest.title',
    });
    expect(result.economy.currentWeekSummary.incomeByCategory.event).toBe(80);
  });

  it('marks the game lost when an event choice pushes treasury past the defeat threshold', () => {
    const save: GameSave = {
      ...createTestSave(),
      ludus: {
        ...createTestSave().ludus,
        rebellion: 85,
        treasury: -900,
      },
    };
    const synchronized = triggerDebugDailyEvent(save, 'rebellionCrisis', () => 0);
    const event = synchronized.events.pendingEvents[0];
    const result = resolveGameEventChoice(synchronized, event.id, 'payForCalm').save;

    expect(result.ludus.treasury).toBe(-1120);
    expect(result.ludus.gameStatus).toBe('lost');
    expect(result.time.phase).toBe('gameOver');
  });

  it('can trigger a specific daily event for debug', () => {
    const save: GameSave = {
      ...createTestSave(),
      gladiators: [createGladiator()],
    };
    const synchronized = triggerDebugDailyEvent(save, 'rivalRumors', () => 0);

    expect(synchronized.events.pendingEvents).toHaveLength(1);
    expect(synchronized.events.pendingEvents[0]).toMatchObject({
      titleKey: 'events.rivalRumors.title',
      status: 'pending',
    });
  });

  it('uses event selection weight when choosing a daily event', () => {
    const save: GameSave = {
      ...createTestSave(),
      gladiators: [createGladiator()],
    };
    const synchronized = synchronizeMacroEvents(
      save,
      createDefaultDailyPlan('monday'),
      createSequenceRandom([0, 0.06, 0]),
    ).save;

    expect(synchronized.events.pendingEvents[0].definitionId).toBe('trainingRefusal');
  });

  it('skips events that are still on cooldown', () => {
    const save: GameSave = {
      ...withTime(createTestSave(), 1, 2, 'monday'),
      gladiators: [createGladiator()],
      events: {
        pendingEvents: [],
        resolvedEvents: [],
        launchedEvents: [createLaunchedEventRecord('departureThreat', 1, 1, 'monday')],
      },
    };
    const synchronized = synchronizeMacroEvents(
      save,
      createDefaultDailyPlan('monday'),
      createSequenceRandom([0, 0, 0]),
    ).save;

    expect(synchronized.events.pendingEvents[0].definitionId).toBe('trainingRefusal');
  });

  it('allows events again after their cooldown has elapsed', () => {
    const save: GameSave = {
      ...withTime(createTestSave(), 1, 5, 'monday'),
      gladiators: [createGladiator()],
      events: {
        pendingEvents: [],
        resolvedEvents: [],
        launchedEvents: [createLaunchedEventRecord('departureThreat', 1, 1, 'monday')],
      },
    };
    const synchronized = synchronizeMacroEvents(
      save,
      createDefaultDailyPlan('monday'),
      createSequenceRandom([0, 0, 0]),
    ).save;

    expect(synchronized.events.pendingEvents[0].definitionId).toBe('departureThreat');
  });

  it('can resolve a selected outcome from an exclusive outcome group', () => {
    const save: GameSave = {
      ...createTestSave(),
      gladiators: [createGladiator()],
    };
    const synchronized = triggerDebugDailyEvent(save, 'departureThreat', () => 0);
    const event = synchronized.events.pendingEvents[0];
    const resolved = resolveGameEventChoice(
      synchronized,
      event.id,
      'refusePayment',
      () => 0.49,
    ).save;

    expect(resolved.gladiators).toHaveLength(0);
    expect(resolved.ludus.treasury).toBe(save.ludus.treasury);
    expect(resolved.events.pendingEvents).toEqual([]);
    expect(resolved.events.resolvedEvents[0]).toMatchObject({
      id: event.id,
      resolvedOutcomeIds: ['gladiatorLeaves'],
      selectedChoiceId: 'refusePayment',
      status: 'resolved',
    });
  });

  it('can resolve the last outcome from an exclusive outcome group', () => {
    const save: GameSave = {
      ...createTestSave(),
      gladiators: [createGladiator()],
    };
    const synchronized = triggerDebugDailyEvent(save, 'departureThreat', () => 0);
    const event = synchronized.events.pendingEvents[0];
    const resolved = resolveGameEventChoice(
      synchronized,
      event.id,
      'refusePayment',
      () => 0.7,
    ).save;

    expect(resolved.gladiators).toHaveLength(1);
    expect(resolved.gladiators[0].morale).toBe(40);
    expect(resolved.events.resolvedEvents[0].resolvedOutcomeIds).toEqual(['moraleLoss']);
    expect(resolved.ludus.treasury).toBe(save.ludus.treasury);
  });

  it('does not trigger debug events when the requested type cannot be used', () => {
    const save: GameSave = {
      ...createTestSave(),
      gladiators: [createGladiator({ health: 100 })],
    };
    const synchronized = triggerDebugDailyEvent(save, 'medicusOffer', () => 0);

    expect(synchronized).toBe(save);
  });

  it('generates daily events during macro day resolution', () => {
    const save: GameSave = {
      ...createTestSave(),
      gladiators: [createGladiator()],
    };
    const synchronized = synchronizeMacroEvents(
      save,
      createDefaultDailyPlan('monday'),
      () => 0,
    ).save;

    expect(synchronized.events.pendingEvents).toHaveLength(1);
  });

  it('uses the current day probability before generating daily events', () => {
    const save: GameSave = {
      ...createTestSave(),
      gladiators: [createGladiator()],
    };
    const synchronized = synchronizeMacroEvents(
      save,
      createDefaultDailyPlan('monday'),
      () => 0.99,
    ).save;

    expect(synchronized.events.pendingEvents).toHaveLength(0);
  });

  it('does not generate daily events after the weekly limit is reached', () => {
    const save = createTestSave();
    const saveAtWeeklyLimit: GameSave = {
      ...save,
      time: {
        ...save.time,
        dayOfWeek: 'friday',
      },
      gladiators: [createGladiator()],
      events: {
        pendingEvents: [],
        resolvedEvents: Array.from({ length: EVENT_CONFIG.maxEventsPerWeek }, (_, index) =>
          createRecordedEvent(save, 'monday', index),
        ),
        launchedEvents: Array.from({ length: EVENT_CONFIG.maxEventsPerWeek }, (_, index) => ({
          eventId: `event-${index}`,
          definitionId: `event-${index}`,
          launchedAtYear: save.time.year,
          launchedAtWeek: save.time.week,
          launchedAtDay: 'monday' as const,
        })),
      },
    };
    const synchronized = synchronizeMacroEvents(
      saveAtWeeklyLimit,
      createDefaultDailyPlan('friday'),
      () => 0,
    ).save;

    expect(synchronized.events.pendingEvents).toHaveLength(0);
  });

  it('does not generate daily events on arena day', () => {
    const save: GameSave = {
      ...withTime(createTestSave(), 1, 1, 'sunday'),
      gladiators: [createGladiator()],
    };
    const synchronized = synchronizeMacroEvents(
      save,
      createDefaultDailyPlan('sunday'),
      () => 0,
    ).save;

    expect(synchronized.events.pendingEvents).toHaveLength(0);
  });

  it('expires unresolved events when the day changes', () => {
    const save: GameSave = {
      ...createTestSave(),
      gladiators: [createGladiator()],
    };
    const synchronized = synchronizeMacroEvents(
      save,
      createDefaultDailyPlan('monday'),
      () => 0,
    ).save;
    const nextDaySave: GameSave = {
      ...synchronized,
      time: {
        ...synchronized.time,
        dayOfWeek: 'tuesday',
      },
    };
    const nextDay = synchronizeMacroEvents(
      nextDaySave,
      createDefaultDailyPlan('tuesday'),
      () => 0,
    ).save;

    expect(nextDay.events.resolvedEvents.some((event) => event.status === 'expired')).toBe(true);
    expect(nextDay.events.pendingEvents).toHaveLength(1);
  });
});
