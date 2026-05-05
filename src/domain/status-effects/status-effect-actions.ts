import { GAME_BALANCE } from '../../game-data/balance';
import { PROGRESSION_CONFIG } from '../../game-data/progression';
import { STATUS_EFFECT_DEFINITIONS } from '../../game-data/status-effects';
import { DAYS_OF_WEEK } from '../../game-data/time';
import type { GameSave } from '../saves/types';
import type { GameDate } from '../time/types';
import type {
  ActiveStatusEffect,
  StatusEffectDefinition,
  StatusEffectDurationBreakdown,
  StatusEffectModifier,
  StatusEffectTarget,
} from './types';

const DEFAULT_TRAINING_EXPERIENCE_MULTIPLIER = 1;

function getAbsoluteDay(date: GameDate) {
  const weekIndex = (date.year - 1) * PROGRESSION_CONFIG.weeksPerYear + (date.week - 1);
  const dayIndex = DAYS_OF_WEEK.indexOf(date.dayOfWeek);

  return weekIndex * DAYS_OF_WEEK.length + dayIndex;
}

function getDateFromAbsoluteDay(absoluteDay: number): GameDate {
  const daysPerYear = PROGRESSION_CONFIG.weeksPerYear * DAYS_OF_WEEK.length;
  const year = Math.floor(absoluteDay / daysPerYear) + 1;
  const dayOfYear = absoluteDay % daysPerYear;
  const week = Math.floor(dayOfYear / DAYS_OF_WEEK.length) + 1;
  const dayOfWeek = DAYS_OF_WEEK[dayOfYear % DAYS_OF_WEEK.length];

  return { year, week, dayOfWeek };
}

function compareGameDates(left: GameDate, right: GameDate) {
  return getAbsoluteDay(left) - getAbsoluteDay(right);
}

function createActiveStatusEffectId(effectId: string, target: StatusEffectTarget) {
  return `status-effect-${target.type}-${target.id}-${effectId}`;
}

function isSameStatusEffectTarget(left: StatusEffectTarget, right: StatusEffectTarget) {
  return left.type === right.type && left.id === right.id;
}

function getStatusEffectModifierValue(
  definition: StatusEffectDefinition,
  type: StatusEffectModifier['type'],
) {
  return definition.modifiers.find((modifier) => modifier.type === type)?.value;
}

export function getCurrentGameDate(save: GameSave): GameDate {
  return {
    year: save.time.year,
    week: save.time.week,
    dayOfWeek: save.time.dayOfWeek,
  };
}

export function addDaysToGameDate(date: GameDate, durationDays: number): GameDate {
  return getDateFromAbsoluteDay(getAbsoluteDay(date) + durationDays);
}

export function getStatusEffectDefinition(effectId: string) {
  return STATUS_EFFECT_DEFINITIONS.find((definition) => definition.id === effectId);
}

export function isStatusEffectActiveAt(effect: ActiveStatusEffect, date: GameDate) {
  return (
    compareGameDates(effect.startedAt, date) <= 0 && compareGameDates(date, effect.expiresAt) < 0
  );
}

export function pruneExpiredStatusEffects(
  save: GameSave,
  date = getCurrentGameDate(save),
): GameSave {
  const statusEffects = save.statusEffects.filter(
    (effect) => compareGameDates(date, effect.expiresAt) < 0,
  );

  return statusEffects.length === save.statusEffects.length ? save : { ...save, statusEffects };
}

export function getActiveStatusEffects(save: GameSave, date = getCurrentGameDate(save)) {
  return save.statusEffects.filter((effect) => isStatusEffectActiveAt(effect, date));
}

export function getActiveGladiatorStatusEffects(
  save: GameSave,
  gladiatorId: string,
  date = getCurrentGameDate(save),
) {
  return getActiveStatusEffects(save, date).filter(
    (effect) => effect.target.type === 'gladiator' && effect.target.id === gladiatorId,
  );
}

export function getRemainingStatusEffectDuration(
  effect: ActiveStatusEffect,
  date: GameDate,
): StatusEffectDurationBreakdown {
  return {
    days: Math.max(0, getAbsoluteDay(effect.expiresAt) - getAbsoluteDay(date)),
    expiresAtDayOfWeek: effect.expiresAt.dayOfWeek,
    expiresAtWeek: effect.expiresAt.week,
    expiresAtYear: effect.expiresAt.year,
  };
}

export function getGladiatorTrainingExperienceMultiplier(
  save: GameSave,
  gladiatorId: string,
  date = getCurrentGameDate(save),
) {
  return getActiveGladiatorStatusEffects(save, gladiatorId, date).reduce((multiplier, effect) => {
    const definition = getStatusEffectDefinition(effect.effectId);

    if (!definition) {
      return multiplier;
    }

    const modifierValue = getStatusEffectModifierValue(definition, 'trainingExperienceMultiplier');

    return typeof modifierValue === 'number' ? multiplier * modifierValue : multiplier;
  }, DEFAULT_TRAINING_EXPERIENCE_MULTIPLIER);
}

export function canGladiatorFightInArena(
  save: GameSave,
  gladiatorId: string,
  date = getCurrentGameDate(save),
) {
  return !getActiveGladiatorStatusEffects(save, gladiatorId, date).some((effect) => {
    const definition = getStatusEffectDefinition(effect.effectId);
    const modifierValue = definition
      ? getStatusEffectModifierValue(definition, 'arenaCombatEligibility')
      : undefined;

    return modifierValue === false;
  });
}

export function hasActiveGladiatorStatusEffect(
  save: GameSave,
  gladiatorId: string,
  effectId: string,
  date = getCurrentGameDate(save),
) {
  return getActiveGladiatorStatusEffects(save, gladiatorId, date).some(
    (effect) => effect.effectId === effectId,
  );
}

export function applyGladiatorStatusEffectAtDate(
  save: GameSave,
  effectId: string,
  durationDays: number,
  gladiatorId: string,
  startedAt: GameDate,
): GameSave {
  if (durationDays <= 0 || !getStatusEffectDefinition(effectId)) {
    return save;
  }

  const target: StatusEffectTarget = { type: 'gladiator', id: gladiatorId };
  const expiresAt = addDaysToGameDate(startedAt, durationDays);
  const statusEffects = pruneExpiredStatusEffects(save, startedAt).statusEffects;
  const existingEffect = statusEffects.find(
    (effect) => effect.effectId === effectId && isSameStatusEffectTarget(effect.target, target),
  );

  if (existingEffect) {
    const extendedExpiresAt =
      compareGameDates(existingEffect.expiresAt, expiresAt) >= 0
        ? existingEffect.expiresAt
        : expiresAt;

    return {
      ...save,
      statusEffects: statusEffects.map((effect) =>
        effect.id === existingEffect.id ? { ...effect, expiresAt: extendedExpiresAt } : effect,
      ),
    };
  }

  return {
    ...save,
    statusEffects: [
      ...statusEffects,
      {
        id: createActiveStatusEffectId(effectId, target),
        effectId,
        target,
        startedAt,
        expiresAt,
      },
    ],
  };
}

export function applyGladiatorStatusEffect(
  save: GameSave,
  effectId: string,
  durationDays: number,
  gladiatorId: string,
): GameSave {
  return applyGladiatorStatusEffectAtDate(
    save,
    effectId,
    durationDays,
    gladiatorId,
    getCurrentGameDate(save),
  );
}

export function getRandomCombatInjuryDuration(random: () => number) {
  const { maxDurationDays, minDurationDays } = GAME_BALANCE.statusEffects.injury.combat;
  const durationSpread = maxDurationDays - minDurationDays;

  return minDurationDays + Math.min(durationSpread, Math.floor(random() * (durationSpread + 1)));
}
