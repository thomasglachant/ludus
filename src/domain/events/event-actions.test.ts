import { describe, expect, it } from 'vitest';
import { createInitialSave } from '../saves/create-initial-save';
import type { GameSave, Gladiator } from '../types';
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

function duringEventWindow(save: GameSave): GameSave {
  return {
    ...save,
    time: {
      ...save.time,
      hour: 10,
      minute: 0,
    },
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
