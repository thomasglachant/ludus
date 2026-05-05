import { describe, expect, it } from 'vitest';
import type { Gladiator } from '../gladiators/types';
import { createInitialSave } from '../saves/create-initial-save';
import type { GameSave } from '../saves/types';
import {
  applyGladiatorStatusEffect,
  applyGladiatorStatusEffectAtDate,
  canGladiatorFightInArena,
  getActiveGladiatorStatusEffects,
  getGladiatorTrainingExperienceMultiplier,
} from './status-effect-actions';

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

describe('status effect actions', () => {
  it('applies, refreshes and expires status effects by exclusive game-day end', () => {
    const save = createTestSave();
    const injured = applyGladiatorStatusEffect(save, 'injury', 1, 'gladiator-test');
    const refreshed = applyGladiatorStatusEffect(injured, 'injury', 5, 'gladiator-test');

    expect(refreshed.statusEffects).toEqual([
      expect.objectContaining({
        effectId: 'injury',
        target: { type: 'gladiator', id: 'gladiator-test' },
        startedAt: { dayOfWeek: 'monday', week: 1, year: 1 },
        expiresAt: { dayOfWeek: 'saturday', week: 1, year: 1 },
      }),
    ]);
    expect(refreshed.statusEffects).toHaveLength(1);
    expect(
      getActiveGladiatorStatusEffects(refreshed, 'gladiator-test', {
        dayOfWeek: 'saturday',
        week: 1,
        year: 1,
      }),
    ).toEqual([]);
  });

  it('combines training multipliers and arena eligibility modifiers', () => {
    const save = applyGladiatorStatusEffectAtDate(
      applyGladiatorStatusEffect(createTestSave(), 'victoryAura', 3, 'gladiator-test'),
      'injury',
      2,
      'gladiator-test',
      { dayOfWeek: 'monday', week: 1, year: 1 },
    );

    expect(getGladiatorTrainingExperienceMultiplier(save, 'gladiator-test')).toBe(0);
    expect(canGladiatorFightInArena(save, 'gladiator-test')).toBe(false);
  });
});
