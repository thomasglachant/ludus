import type { Gladiator } from './types';

export const GLADIATOR_SKILL_NAMES = ['strength', 'agility', 'defense'] as const;

export type GladiatorSkillName = (typeof GLADIATOR_SKILL_NAMES)[number];

const SKILL_MINIMUM = 0;
const SKILL_MAXIMUM = 100;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getEffectiveSkillValue(value: number) {
  return Math.floor(clamp(value, SKILL_MINIMUM, SKILL_MAXIMUM));
}

export function getGladiatorEffectiveSkill(gladiator: Gladiator, skill: GladiatorSkillName) {
  return getEffectiveSkillValue(gladiator[skill]);
}

export function getSkillTrainingProgress(value: number) {
  const clampedValue = clamp(value, SKILL_MINIMUM, SKILL_MAXIMUM);
  const progress = (clampedValue - Math.floor(clampedValue)) * 100;

  return Math.floor(clamp(progress, 0, 99));
}

export function addSkillTrainingProgress(value: number, progressPoints: number) {
  return clamp(value + progressPoints / 100, SKILL_MINIMUM, SKILL_MAXIMUM);
}

export function addSkillLevels(value: number, levels: number) {
  return clamp(value + levels, SKILL_MINIMUM, SKILL_MAXIMUM);
}

export function isGladiatorSkillName(value: string): value is GladiatorSkillName {
  return GLADIATOR_SKILL_NAMES.includes(value as GladiatorSkillName);
}
