import { GAME_BALANCE } from '../../game-data/balance';
import { GLADIATOR_TRAIT_DEFINITIONS } from '../../game-data/gladiator-traits';
import { PROGRESSION_CONFIG } from '../../game-data/progression';
import { DAYS_OF_WEEK } from '../../game-data/time';
import type { Gladiator, GladiatorTrait } from '../gladiators/types';
import type { GameSave } from '../saves/types';
import type { GameDate } from '../time/types';
import type {
  GladiatorTraitDefinition,
  GladiatorTraitDurationBreakdown,
  GladiatorTraitModifier,
} from './types';

const DEFAULT_MULTIPLIER = 1;

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

function getGladiator(save: GameSave, gladiatorId: string) {
  return save.gladiators.find((gladiator) => gladiator.id === gladiatorId);
}

function getTraitModifierValue(
  definition: GladiatorTraitDefinition,
  type: GladiatorTraitModifier['type'],
): number | boolean | undefined {
  return definition.modifiers.find((modifier) => modifier.type === type)?.value;
}

function getTraitModifierValues(
  gladiator: Gladiator,
  type: GladiatorTraitModifier['type'],
  date?: GameDate,
): Array<number | boolean> {
  return getActiveGladiatorTraitsFromGladiator(gladiator, date).flatMap((trait) => {
    const definition = getGladiatorTraitDefinition(trait.traitId);
    const value = definition ? getTraitModifierValue(definition, type) : undefined;

    return value === undefined ? [] : [value];
  });
}

function multiplyNumericModifiers(
  gladiator: Gladiator,
  type: GladiatorTraitModifier['type'],
  date?: GameDate,
) {
  return getTraitModifierValues(gladiator, type, date).reduce<number>((multiplier, value) => {
    return typeof value === 'number' ? multiplier * value : multiplier;
  }, DEFAULT_MULTIPLIER);
}

function sumNumericModifiers(
  gladiator: Gladiator,
  type: GladiatorTraitModifier['type'],
  date?: GameDate,
) {
  return getTraitModifierValues(gladiator, type, date).reduce<number>((total, value) => {
    return typeof value === 'number' ? total + value : total;
  }, 0);
}

function pruneExpiredGladiatorTraits(gladiator: Gladiator, date: GameDate): Gladiator {
  const traits = gladiator.traits.filter((trait) => isGladiatorTraitActiveAt(trait, date));

  return traits.length === gladiator.traits.length ? gladiator : { ...gladiator, traits };
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

export function getGladiatorTraitDefinition(traitId: string): GladiatorTraitDefinition | undefined {
  return GLADIATOR_TRAIT_DEFINITIONS.find((definition) => definition.id === traitId);
}

export function isGladiatorTraitTemporary(trait: GladiatorTrait) {
  return trait.expiresAt !== undefined;
}

export function isGladiatorTraitActiveAt(trait: GladiatorTrait, date: GameDate) {
  return !trait.expiresAt || compareGameDates(date, trait.expiresAt) < 0;
}

export function pruneExpiredTraits(save: GameSave, date = getCurrentGameDate(save)): GameSave {
  const gladiators = save.gladiators.map((gladiator) =>
    pruneExpiredGladiatorTraits(gladiator, date),
  );
  const didChange = gladiators.some((gladiator, index) => gladiator !== save.gladiators[index]);

  return didChange ? { ...save, gladiators } : save;
}

export function getActiveGladiatorTraitsFromGladiator(gladiator: Gladiator, date?: GameDate) {
  return date
    ? gladiator.traits.filter((trait) => isGladiatorTraitActiveAt(trait, date))
    : gladiator.traits;
}

export function getActiveGladiatorTraits(
  save: GameSave,
  gladiatorId: string,
  date = getCurrentGameDate(save),
) {
  const gladiator = getGladiator(save, gladiatorId);

  return gladiator ? getActiveGladiatorTraitsFromGladiator(gladiator, date) : [];
}

export function getPermanentGladiatorTraits(gladiator: Gladiator, date?: GameDate) {
  return getActiveGladiatorTraitsFromGladiator(gladiator, date).filter(
    (trait) => !isGladiatorTraitTemporary(trait),
  );
}

export function getTemporaryGladiatorTraits(gladiator: Gladiator, date?: GameDate) {
  return getActiveGladiatorTraitsFromGladiator(gladiator, date).filter(isGladiatorTraitTemporary);
}

export function getActiveTemporaryGladiatorTraits(save: GameSave, date = getCurrentGameDate(save)) {
  return save.gladiators.flatMap((gladiator) =>
    getTemporaryGladiatorTraits(gladiator, date).map((trait) => ({ gladiator, trait })),
  );
}

export function getRemainingGladiatorTraitDuration(
  trait: GladiatorTrait,
  date: GameDate,
): GladiatorTraitDurationBreakdown | null {
  if (!trait.expiresAt) {
    return null;
  }

  return {
    days: Math.max(0, getAbsoluteDay(trait.expiresAt) - getAbsoluteDay(date)),
    expiresAtDayOfWeek: trait.expiresAt.dayOfWeek,
    expiresAtWeek: trait.expiresAt.week,
    expiresAtYear: trait.expiresAt.year,
  };
}

export function getGladiatorTrainingExperienceMultiplier(
  save: GameSave,
  gladiatorId: string,
  date = getCurrentGameDate(save),
) {
  const gladiator = getGladiator(save, gladiatorId);

  return gladiator
    ? multiplyNumericModifiers(gladiator, 'trainingExperienceMultiplier', date)
    : DEFAULT_MULTIPLIER;
}

export function getGladiatorInjuryRiskMultiplier(
  save: GameSave,
  gladiatorId: string,
  date = getCurrentGameDate(save),
) {
  const gladiator = getGladiator(save, gladiatorId);

  return gladiator
    ? multiplyNumericModifiers(gladiator, 'injuryRiskMultiplier', date)
    : DEFAULT_MULTIPLIER;
}

export function getGladiatorCombatExperienceMultiplier(gladiator: Gladiator, date?: GameDate) {
  return multiplyNumericModifiers(gladiator, 'combatExperienceMultiplier', date);
}

export function getGladiatorArenaRewardMultiplier(gladiator: Gladiator, date?: GameDate) {
  return multiplyNumericModifiers(gladiator, 'arenaRewardMultiplier', date);
}

export function getGladiatorCombatEnergyBonus(gladiator: Gladiator, date?: GameDate) {
  return sumNumericModifiers(gladiator, 'combatEnergyBonus', date);
}

export function getGladiatorCombatMoraleBonus(gladiator: Gladiator, date?: GameDate) {
  return sumNumericModifiers(gladiator, 'combatMoraleBonus', date);
}

export function canGladiatorFightInArena(
  save: GameSave,
  gladiatorId: string,
  date = getCurrentGameDate(save),
) {
  const gladiator = getGladiator(save, gladiatorId);

  if (!gladiator) {
    return false;
  }

  return !getActiveGladiatorTraitsFromGladiator(gladiator, date).some((trait) => {
    const definition = getGladiatorTraitDefinition(trait.traitId);
    const modifierValue = definition
      ? getTraitModifierValue(definition, 'arenaCombatEligibility')
      : undefined;

    return modifierValue === false;
  });
}

export function hasActiveGladiatorTrait(
  save: GameSave,
  gladiatorId: string,
  traitId: string,
  date = getCurrentGameDate(save),
) {
  return getActiveGladiatorTraits(save, gladiatorId, date).some(
    (trait) => trait.traitId === traitId,
  );
}

export function applyGladiatorTraitAtDate(
  save: GameSave,
  traitId: string,
  durationDays: number,
  gladiatorId: string,
  date: GameDate,
): GameSave {
  const definition = getGladiatorTraitDefinition(traitId);

  if (durationDays <= 0 || !definition) {
    return save;
  }

  const expiresAt = addDaysToGameDate(date, durationDays);
  const resolvedTraitId = definition.id;
  const prunedSave = pruneExpiredTraits(save, date);
  let didChange = false;
  const gladiators = prunedSave.gladiators.map((gladiator) => {
    if (gladiator.id !== gladiatorId) {
      return gladiator;
    }

    const existingTrait = gladiator.traits.find((trait) => trait.traitId === resolvedTraitId);

    if (!existingTrait) {
      didChange = true;

      return {
        ...gladiator,
        traits: [...gladiator.traits, { traitId: resolvedTraitId, expiresAt }],
      };
    }

    if (!existingTrait.expiresAt || compareGameDates(existingTrait.expiresAt, expiresAt) >= 0) {
      return gladiator;
    }

    didChange = true;

    return {
      ...gladiator,
      traits: gladiator.traits.map((trait) =>
        trait.traitId === resolvedTraitId ? { ...trait, expiresAt } : trait,
      ),
    };
  });

  return didChange ? { ...prunedSave, gladiators } : prunedSave;
}

export function addPermanentGladiatorTrait(
  save: GameSave,
  traitId: string,
  gladiatorId: string,
): GameSave {
  const definition = getGladiatorTraitDefinition(traitId);

  if (!definition) {
    return save;
  }

  let didChange = false;
  const gladiators = save.gladiators.map((gladiator) => {
    if (
      gladiator.id !== gladiatorId ||
      gladiator.traits.some((trait) => trait.traitId === definition.id)
    ) {
      return gladiator;
    }

    didChange = true;

    return {
      ...gladiator,
      traits: [...gladiator.traits, { traitId: definition.id }],
    };
  });

  return didChange ? { ...save, gladiators } : save;
}

export function applyGladiatorTrait(
  save: GameSave,
  traitId: string,
  durationDays: number,
  gladiatorId: string,
): GameSave {
  return applyGladiatorTraitAtDate(
    save,
    traitId,
    durationDays,
    gladiatorId,
    getCurrentGameDate(save),
  );
}

export function getRandomCombatInjuryDuration(random: () => number) {
  const { maxDurationDays, minDurationDays } = GAME_BALANCE.traits.injury.combat;
  const durationSpread = maxDurationDays - minDurationDays;

  return minDurationDays + Math.min(durationSpread, Math.floor(random() * (durationSpread + 1)));
}
