import { GAME_BALANCE } from '../../game-data/balance';
import {
  GLADIATOR_SKILL_NAMES,
  type GladiatorSkillName,
  getEffectiveSkillValue,
  normalizeGladiatorSkillValue,
} from './skills';
import type { Gladiator, GladiatorSkillProfile } from './types';

type RandomSource = () => number;

const EXPERIENCE_BY_LEVEL = GAME_BALANCE.gladiators.progression.experienceByLevel;
const INITIAL_EXPERIENCE = EXPERIENCE_BY_LEVEL[0];
const MAX_LEVEL = GAME_BALANCE.gladiators.progression.maxLevel;
const SKILL_MINIMUM = GAME_BALANCE.gladiators.skills.minimum;
const SKILL_MAXIMUM = GAME_BALANCE.gladiators.skills.maximum;
const INITIAL_TOTAL_POINTS = GAME_BALANCE.gladiators.skills.initialTotalPoints;
const INITIAL_MAXIMUM = GAME_BALANCE.gladiators.skills.initialMaximum;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizeInteger(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function pickIndex(length: number, random: RandomSource) {
  return Math.min(length - 1, Math.floor(random() * length));
}

function createSeededRandom(seed: string): RandomSource {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return () => {
    hash += 0x6d2b79f5;
    let value = hash;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function getSkillPointTotal(profile: GladiatorSkillProfile) {
  return GLADIATOR_SKILL_NAMES.reduce(
    (total, skill) => total + getEffectiveSkillValue(profile[skill]),
    0,
  );
}

export function normalizeGladiatorExperience(experience: unknown) {
  return normalizeInteger(experience);
}

export function getGladiatorLevelFromExperience(experience: number) {
  const normalizedExperience = normalizeGladiatorExperience(experience);
  const levelIndex = EXPERIENCE_BY_LEVEL.findLastIndex(
    (threshold) => normalizedExperience >= threshold,
  );

  return clamp(levelIndex + 1, 1, MAX_LEVEL);
}

export function getGladiatorLevel(gladiator: Pick<Gladiator, 'experience'>) {
  return getGladiatorLevelFromExperience(gladiator.experience);
}

export function getGladiatorExperienceProgress(gladiator: Pick<Gladiator, 'experience'>) {
  const experience = normalizeGladiatorExperience(gladiator.experience);
  const level = getGladiatorLevelFromExperience(experience);
  const levelStart = EXPERIENCE_BY_LEVEL[level - 1] ?? INITIAL_EXPERIENCE;
  const nextLevelStart = EXPERIENCE_BY_LEVEL[level];
  const requiredExperience = nextLevelStart === undefined ? 0 : nextLevelStart - levelStart;
  const currentExperience =
    requiredExperience === 0 ? 0 : clamp(experience - levelStart, 0, requiredExperience);

  return {
    currentExperience,
    experience,
    level,
    levelStart,
    nextLevelStart,
    ratio: requiredExperience === 0 ? 1 : currentExperience / requiredExperience,
    requiredExperience,
  };
}

export function normalizeGladiatorSkillProfile(
  skillProfile: GladiatorSkillProfile,
): GladiatorSkillProfile {
  return {
    strength: normalizeGladiatorSkillValue(skillProfile.strength),
    agility: normalizeGladiatorSkillValue(skillProfile.agility),
    defense: normalizeGladiatorSkillValue(skillProfile.defense),
    life: normalizeGladiatorSkillValue(skillProfile.life),
  };
}

export function getGladiatorSkillPointBudget(gladiator: Pick<Gladiator, 'experience'>) {
  return clamp(INITIAL_TOTAL_POINTS + getGladiatorLevel(gladiator) - 1, 0, SKILL_MAXIMUM * 4);
}

export function getAvailableSkillPoints(gladiator: Gladiator) {
  const allocatedPoints = getSkillPointTotal(normalizeGladiatorSkillProfile(gladiator));

  return Math.max(0, getGladiatorSkillPointBudget(gladiator) - allocatedPoints);
}

export function addGladiatorExperience<TGladiator extends Gladiator>(
  gladiator: TGladiator,
  amount: number,
): TGladiator {
  const experienceGain = Math.max(0, Math.round(Number.isFinite(amount) ? amount : 0));

  return {
    ...gladiator,
    experience: normalizeGladiatorExperience(gladiator.experience) + experienceGain,
  };
}

export function allocateGladiatorSkillPoint<TGladiator extends Gladiator>(
  gladiator: TGladiator,
  skill: GladiatorSkillName,
): TGladiator {
  if (getAvailableSkillPoints(gladiator) <= 0 || gladiator[skill] >= SKILL_MAXIMUM) {
    return gladiator;
  }

  return {
    ...gladiator,
    [skill]: normalizeGladiatorSkillValue(gladiator[skill] + 1),
  };
}

export function createInitialSkillProfile(
  random: RandomSource = Math.random,
): GladiatorSkillProfile {
  const profile: GladiatorSkillProfile = {
    strength: SKILL_MINIMUM,
    agility: SKILL_MINIMUM,
    defense: SKILL_MINIMUM,
    life: SKILL_MINIMUM,
  };
  let remainingPoints = INITIAL_TOTAL_POINTS - GLADIATOR_SKILL_NAMES.length * SKILL_MINIMUM;

  while (remainingPoints > 0) {
    const eligibleSkills = GLADIATOR_SKILL_NAMES.filter(
      (skill) => profile[skill] < INITIAL_MAXIMUM,
    );

    if (eligibleSkills.length === 0) {
      break;
    }

    const selectedSkill = eligibleSkills[pickIndex(eligibleSkills.length, random)];

    profile[selectedSkill] += 1;
    remainingPoints -= 1;
  }

  return profile;
}

export function createInitialGladiatorSkillProfile(seed: string) {
  return createInitialSkillProfile(createSeededRandom(seed));
}

export function normalizeGladiatorProgression<TGladiator extends Gladiator>(
  gladiator: TGladiator,
): TGladiator {
  return {
    ...gladiator,
    ...normalizeGladiatorSkillProfile(gladiator),
    experience: normalizeGladiatorExperience(gladiator.experience),
  };
}

export function resetGladiatorToInitialProgression<TGladiator extends Gladiator>(
  gladiator: TGladiator,
  seed = gladiator.id,
): TGladiator {
  return {
    ...gladiator,
    ...createInitialGladiatorSkillProfile(seed),
    experience: INITIAL_EXPERIENCE,
  };
}
