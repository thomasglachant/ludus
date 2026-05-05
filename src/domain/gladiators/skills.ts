import { GAME_BALANCE } from '../../game-data/balance';
import type { Gladiator, GladiatorClassId, GladiatorSkillProfile } from './types';

export const GLADIATOR_SKILL_NAMES = GAME_BALANCE.gladiators.skills.names;

export type GladiatorSkillName = (typeof GLADIATOR_SKILL_NAMES)[number];

export const GLADIATOR_CLASS_BY_DOMINANT_SKILL = {
  strength: 'murmillo',
  agility: 'retiarius',
  defense: 'secutor',
  life: 'murmillo',
} as const satisfies Record<GladiatorSkillName, GladiatorClassId>;

const SKILL_MINIMUM = GAME_BALANCE.gladiators.skills.minimum;
const SKILL_MAXIMUM = GAME_BALANCE.gladiators.skills.maximum;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeGladiatorSkillValue(value: number) {
  return Math.floor(clamp(value, SKILL_MINIMUM, SKILL_MAXIMUM));
}

export function isGladiatorSkillValue(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= SKILL_MINIMUM &&
    value <= SKILL_MAXIMUM
  );
}

export function getEffectiveSkillValue(value: number) {
  return normalizeGladiatorSkillValue(value);
}

export function getGladiatorEffectiveSkill(gladiator: Gladiator, skill: GladiatorSkillName) {
  return getEffectiveSkillValue(gladiator[skill]);
}

export function inferGladiatorClassId(skillProfile: GladiatorSkillProfile): GladiatorClassId {
  const [firstSkill, ...remainingSkills] = GLADIATOR_SKILL_NAMES;
  const dominantSkill = remainingSkills.reduce<GladiatorSkillName>(
    (bestSkill, skill) =>
      getEffectiveSkillValue(skillProfile[skill]) > getEffectiveSkillValue(skillProfile[bestSkill])
        ? skill
        : bestSkill,
    firstSkill,
  );

  return GLADIATOR_CLASS_BY_DOMINANT_SKILL[dominantSkill];
}

export function addSkillLevels(value: number, levels: number) {
  return normalizeGladiatorSkillValue(getEffectiveSkillValue(value) + levels);
}

export function isGladiatorSkillName(value: string): value is GladiatorSkillName {
  return GLADIATOR_SKILL_NAMES.includes(value as GladiatorSkillName);
}
