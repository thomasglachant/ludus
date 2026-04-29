import { describe, expect, it } from 'vitest';
import { EVENT_CONFIG } from '../../game-data/events';
import { createInitialSave } from '../saves/create-initial-save';
import type { DayOfWeek, GameEvent, GameSave, Gladiator } from '../types';
import { resolveGameEventChoice, synchronizeEvents } from './event-actions';

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
    satiety: 80,
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

function createRecordedEvent(save: GameSave, day: DayOfWeek, index = 0): GameEvent {
  return {
    id: `event-${save.time.year}-${save.time.week}-${day}-recorded-${index}`,
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
