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

  return {
    ...save,
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
  });

  it('applies gladiator status effects from event consequences', () => {
    const save = createTestSave();
    const event = {
      id: 'event-status-effect-test',
      definitionId: 'statusEffectTest',
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
                  type: 'applyGladiatorStatusEffect' as const,
                  gladiatorId: 'gladiator-test',
                  effectId: 'injury',
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

    expect(result.statusEffects).toEqual([
      expect.objectContaining({
        effectId: 'injury',
        target: { type: 'gladiator', id: 'gladiator-test' },
        expiresAt: { dayOfWeek: 'wednesday', week: 1, year: 1 },
      }),
    ]);
    expect(result.planning.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          gladiatorId: 'gladiator-test',
          statusEffectId: 'injury',
        }),
      ]),
    );
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
