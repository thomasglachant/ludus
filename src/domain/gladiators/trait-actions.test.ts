import { describe, expect, it } from 'vitest';
import { createInitialSave } from '../saves/create-initial-save';
import type { GameSave } from '../saves/types';
import { getGladiatorEffectiveSkill } from './skills';
import {
  addPermanentGladiatorTrait,
  applyGladiatorTrait,
  applyGladiatorTraitAtDate,
  canGladiatorFightInArena,
  canGladiatorPerformActivities,
  getActiveGladiatorTraits,
  getGladiatorSkillBonus,
  getGladiatorTrainingExperienceMultiplier,
} from './trait-actions';
import type { TemporaryGladiatorTraitId } from './traits';
import type { Gladiator } from './types';

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

describe('gladiator trait actions', () => {
  it('adds permanent gladiator traits without expiration or duplicates', () => {
    const save = createTestSave();
    const disciplined = addPermanentGladiatorTrait(save, 'disciplined', 'gladiator-test');
    const duplicated = addPermanentGladiatorTrait(disciplined, 'disciplined', 'gladiator-test');

    expect(duplicated.gladiators[0].traits).toEqual([{ traitId: 'disciplined' }]);
  });

  it('applies, refreshes and expires gladiator traits by exclusive game-day end', () => {
    const save = createTestSave();
    const injured = applyGladiatorTrait(save, 'injury', 1, 'gladiator-test');
    const refreshed = applyGladiatorTrait(injured, 'injury', 5, 'gladiator-test');

    expect(refreshed.gladiators[0].traits).toEqual([
      {
        traitId: 'injury',
        expiresAt: { dayOfWeek: 'saturday', week: 1, year: 1 },
      },
    ]);
    expect(refreshed.gladiators[0].traits).toHaveLength(1);
    expect(
      getActiveGladiatorTraits(refreshed, 'gladiator-test', {
        dayOfWeek: 'saturday',
        week: 1,
        year: 1,
      }),
    ).toEqual([]);
  });

  it('ignores permanent traits in the temporary trait application path', () => {
    const save = createTestSave();
    const result = applyGladiatorTraitAtDate(
      save,
      'disciplined' as TemporaryGladiatorTraitId,
      2,
      'gladiator-test',
      { dayOfWeek: 'monday', week: 1, year: 1 },
    );

    expect(result).toBe(save);
    expect(result.gladiators[0].traits).toEqual([]);
  });

  it('combines training multipliers with global activity eligibility modifiers', () => {
    const save = applyGladiatorTraitAtDate(
      applyGladiatorTrait(createTestSave(), 'victoryAura', 3, 'gladiator-test'),
      'injury',
      2,
      'gladiator-test',
      { dayOfWeek: 'monday', week: 1, year: 1 },
    );

    expect(getGladiatorTrainingExperienceMultiplier(save, 'gladiator-test')).toBe(1.1);
    expect(canGladiatorPerformActivities(save, 'gladiator-test')).toBe(false);
    expect(canGladiatorFightInArena(save, 'gladiator-test')).toBe(false);
  });

  it('applies permanent trait skill bonuses to effective skills', () => {
    const gladiator = createGladiator({
      agility: 3,
      traits: [{ traitId: 'limping' }, { traitId: 'fleetFooted' }],
    });

    expect(getGladiatorSkillBonus(gladiator, 'agility')).toBe(0);
    expect(getGladiatorEffectiveSkill(gladiator, 'agility')).toBe(3);
  });

  it('uses rest as a temporary global activity blocker', () => {
    const save = applyGladiatorTrait(createTestSave(), 'rest', 2, 'gladiator-test');

    expect(canGladiatorPerformActivities(save, 'gladiator-test')).toBe(false);
    expect(canGladiatorFightInArena(save, 'gladiator-test')).toBe(false);
  });

  it('does not add rest to an already injured gladiator', () => {
    const injured = applyGladiatorTrait(createTestSave(), 'injury', 2, 'gladiator-test');
    const rested = applyGladiatorTrait(injured, 'rest', 2, 'gladiator-test');

    expect(rested.gladiators[0].traits).toEqual([
      {
        traitId: 'injury',
        expiresAt: { dayOfWeek: 'wednesday', week: 1, year: 1 },
      },
    ]);
  });

  it('replaces rest when an injury is applied later', () => {
    const rested = applyGladiatorTrait(createTestSave(), 'rest', 2, 'gladiator-test');
    const injured = applyGladiatorTrait(rested, 'injury', 2, 'gladiator-test');

    expect(injured.gladiators[0].traits).toEqual([
      {
        traitId: 'injury',
        expiresAt: { dayOfWeek: 'wednesday', week: 1, year: 1 },
      },
    ]);
  });
});
