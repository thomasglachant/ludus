import { describe, expect, it } from 'vitest';
import { DAILY_EVENT_DEFINITIONS, EVENT_CONFIG } from '../../game-data/events';
import { createInitialSave } from '../saves/create-initial-save';
import type { DayOfWeek, GameEvent, GameSave, Gladiator } from '../types';
import { resolveGameEventChoice, synchronizeEvents, triggerDebugDailyEvent } from './event-actions';

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

function atTime(save: GameSave, hour: number, minute = 0): GameSave {
  return {
    ...save,
    time: {
      ...save.time,
      hour,
      minute,
    },
  };
}

function duringEventWindow(save: GameSave): GameSave {
  return atTime(save, 10);
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

  it('does not generate daily events without gladiators', () => {
    const synchronized = synchronizeEvents(duringEventWindow(createTestSave()), () => 0);

    expect(synchronized.events.pendingEvents).toHaveLength(0);
    expect(synchronized.events.resolvedEvents).toHaveLength(0);
  });

  it('generates one daily event and resolves a choice', () => {
    const save: GameSave = {
      ...duringEventWindow(createTestSave()),
      gladiators: [createGladiator()],
    };
    const synchronized = synchronizeEvents(save, () => 0);
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
      ...duringEventWindow(createTestSave()),
      gladiators: [createGladiator()],
    };
    const synchronized = synchronizeEvents(save, createSequenceRandom([0, 0.06, 0]));

    expect(synchronized.events.pendingEvents[0].definitionId).toBe('trainingRefusal');
  });

  it('skips events that are still on cooldown', () => {
    const save: GameSave = {
      ...duringEventWindow(withTime(createTestSave(), 1, 2, 'monday')),
      gladiators: [createGladiator()],
      events: {
        pendingEvents: [],
        resolvedEvents: [],
        launchedEvents: [createLaunchedEventRecord('departureThreat', 1, 1, 'monday')],
      },
    };
    const synchronized = synchronizeEvents(save, createSequenceRandom([0, 0, 0]));

    expect(synchronized.events.pendingEvents[0].definitionId).toBe('trainingRefusal');
  });

  it('allows events again after their cooldown has elapsed', () => {
    const save: GameSave = {
      ...duringEventWindow(withTime(createTestSave(), 1, 5, 'monday')),
      gladiators: [createGladiator()],
      events: {
        pendingEvents: [],
        resolvedEvents: [],
        launchedEvents: [createLaunchedEventRecord('departureThreat', 1, 1, 'monday')],
      },
    };
    const synchronized = synchronizeEvents(save, createSequenceRandom([0, 0, 0]));

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

  it('generates daily events from the configured start hour', () => {
    const save: GameSave = {
      ...atTime(createTestSave(), EVENT_CONFIG.dailyEventStartHour),
      gladiators: [createGladiator()],
    };
    const synchronized = synchronizeEvents(save, () => 0);

    expect(synchronized.events.pendingEvents).toHaveLength(1);
  });

  it('uses the current day probability before generating daily events', () => {
    const save: GameSave = {
      ...duringEventWindow(createTestSave()),
      gladiators: [createGladiator()],
    };
    const synchronized = synchronizeEvents(save, () => 0.99);

    expect(synchronized.events.pendingEvents).toHaveLength(0);
  });

  it('does not generate daily events after the weekly limit is reached', () => {
    const save = duringEventWindow(createTestSave());
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
    const synchronized = synchronizeEvents(saveAtWeeklyLimit, () => 0);

    expect(synchronized.events.pendingEvents).toHaveLength(0);
  });

  it('does not generate daily events before the configured start hour', () => {
    const save: GameSave = {
      ...atTime(createTestSave(), EVENT_CONFIG.dailyEventStartHour - 1, 59),
      gladiators: [createGladiator()],
    };
    const synchronized = synchronizeEvents(save, () => 0);

    expect(synchronized.events.pendingEvents).toHaveLength(0);
  });

  it('does not generate daily events from 20h', () => {
    const save: GameSave = {
      ...atTime(createTestSave(), 20),
      gladiators: [createGladiator()],
    };
    const synchronized = synchronizeEvents(save, () => 0);

    expect(synchronized.events.pendingEvents).toHaveLength(0);
  });

  it('expires unresolved events when the day changes', () => {
    const save: GameSave = {
      ...duringEventWindow(createTestSave()),
      gladiators: [createGladiator()],
    };
    const synchronized = synchronizeEvents(save, () => 0);
    const nextDaySave: GameSave = {
      ...synchronized,
      time: {
        ...synchronized.time,
        dayOfWeek: 'tuesday',
      },
    };
    const nextDay = synchronizeEvents(nextDaySave, () => 0);

    expect(nextDay.events.resolvedEvents.some((event) => event.status === 'expired')).toBe(true);
    expect(nextDay.events.pendingEvents).toHaveLength(1);
  });
});
