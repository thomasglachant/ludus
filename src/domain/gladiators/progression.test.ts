import { describe, expect, it } from 'vitest';
import { GLADIATOR_PROGRESSION_CONFIG } from '../../game-data/gladiators/progression';
import { GLADIATOR_SKILL_CONFIG } from '../../game-data/gladiators/skills';
import {
  addGladiatorExperience,
  allocateGladiatorSkillPoint,
  createInitialGladiatorSkillProfile,
  createInitialSkillProfile,
  getAvailableSkillPoints,
  getGladiatorExperienceProgress,
  getGladiatorLevel,
  getGladiatorLevelFromExperience,
  normalizeGladiatorProgression,
} from './progression';
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

describe('gladiator progression', () => {
  it('derives gladiator level from experience thresholds', () => {
    expect(getGladiatorLevelFromExperience(0)).toBe(1);
    expect(getGladiatorLevelFromExperience(99)).toBe(1);
    expect(getGladiatorLevelFromExperience(100)).toBe(2);
    expect(getGladiatorLevelFromExperience(390)).toBe(4);
    expect(getGladiatorLevelFromExperience(999_999)).toBe(GLADIATOR_PROGRESSION_CONFIG.maxLevel);
    expect(getGladiatorLevel(createGladiator({ experience: 390 }))).toBe(4);
  });

  it('reports experience progress inside the current level', () => {
    const progress = getGladiatorExperienceProgress(createGladiator({ experience: 120 }));

    expect(progress).toMatchObject({
      currentExperience: 20,
      experience: 120,
      level: 2,
      levelStart: 100,
      nextLevelStart: 230,
      requiredExperience: 130,
    });
    expect(progress.ratio).toBeCloseTo(20 / 130);
  });

  it('normalizes required experience and integer skills into supported ranges', () => {
    const gladiator = normalizeGladiatorProgression(
      createGladiator({
        experience: 100.9,
        strength: 10.9,
        agility: 0,
        defense: 4.8,
        life: 99,
      }),
    );

    expect(gladiator).toMatchObject({
      experience: 100,
      strength: GLADIATOR_SKILL_CONFIG.maximum,
      agility: GLADIATOR_SKILL_CONFIG.minimum,
      defense: 4,
      life: GLADIATOR_SKILL_CONFIG.maximum,
    });
  });

  it('adds non-negative rounded experience and exposes level-up skill points', () => {
    const trained = addGladiatorExperience(createGladiator(), 99.6);

    expect(trained.experience).toBe(100);
    expect(getGladiatorLevel(trained)).toBe(2);
    expect(getAvailableSkillPoints(trained)).toBe(1);
    expect(addGladiatorExperience(trained, -10).experience).toBe(100);
  });

  it('allocates available skill points one integer level at a time', () => {
    const gladiator = createGladiator({ experience: 100 });
    const upgraded = allocateGladiatorSkillPoint(gladiator, 'life');
    const blocked = allocateGladiatorSkillPoint(upgraded, 'life');

    expect(upgraded.life).toBe(3);
    expect(getAvailableSkillPoints(upgraded)).toBe(0);
    expect(blocked).toBe(upgraded);
  });

  it('creates initial skill profiles with ten points and deterministic seeded output', () => {
    const profile = createInitialSkillProfile(() => 0);
    const seededProfile = createInitialGladiatorSkillProfile('market-gladiator-test');
    const repeatedSeededProfile = createInitialGladiatorSkillProfile('market-gladiator-test');
    const totalPoints = profile.strength + profile.agility + profile.defense + profile.life;

    expect(totalPoints).toBe(GLADIATOR_SKILL_CONFIG.initialTotalPoints);
    expect(Object.values(profile).every((value) => value >= GLADIATOR_SKILL_CONFIG.minimum)).toBe(
      true,
    );
    expect(
      Object.values(profile).every((value) => value <= GLADIATOR_SKILL_CONFIG.initialMaximum),
    ).toBe(true);
    expect(seededProfile).toEqual(repeatedSeededProfile);
  });

  it('does not allocate points above the skill cap', () => {
    const capped = createGladiator({
      experience: GLADIATOR_PROGRESSION_CONFIG.experienceByLevel[1],
      strength: GLADIATOR_SKILL_CONFIG.maximum,
      agility: 1,
      defense: 1,
      life: 1,
    });

    expect(allocateGladiatorSkillPoint(capped, 'strength')).toBe(capped);
  });
});
