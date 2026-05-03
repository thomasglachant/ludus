import { describe, expect, it } from 'vitest';
import type { Gladiator } from '../gladiators/types';
import { createInitialSave } from '../saves/create-initial-save';
import type { GameSave } from '../saves/types';
import { createDefaultDailyPlan } from '../weekly-simulation/weekly-simulation-actions';
import { resolveGameEventChoice, synchronizeMacroEvents } from './event-actions';

function createGladiator(overrides: Partial<Gladiator> = {}): Gladiator {
  return {
    id: 'gladiator-test',
    name: 'Aulus',
    age: 24,
    strength: 20,
    agility: 18,
    defense: 18,
    life: 100,
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

  return {
    ...save,
    gladiators: [createGladiator()],
    ...overrides,
  };
}

describe('event actions', () => {
  it('generates activity-gated daily events from the current plan', () => {
    const plan = createDefaultDailyPlan('monday');
    plan.gladiatorTimePoints.strengthTraining = 1;

    const result = synchronizeMacroEvents(createTestSave(), plan, () => 0);

    expect(result.createdEventIds).toHaveLength(1);
    expect(result.save.events.pendingEvents[0]).toMatchObject({
      definitionId: 'trainingRefusal',
      status: 'pending',
    });
  });

  it('resolves event choices and records resolved events', () => {
    const plan = createDefaultDailyPlan('monday');
    plan.gladiatorTimePoints.strengthTraining = 1;
    const synchronized = synchronizeMacroEvents(createTestSave(), plan, () => 0).save;
    const event = synchronized.events.pendingEvents[0];
    const result = resolveGameEventChoice(synchronized, event.id, 'grantRest').save;

    expect(result.events.pendingEvents).toEqual([]);
    expect(result.events.resolvedEvents[0]).toMatchObject({
      id: event.id,
      selectedChoiceId: 'grantRest',
      status: 'resolved',
    });
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
});
