import { GAME_BALANCE } from './balance';
import type { Gladiator, GladiatorClassId } from '../domain/gladiators/types';

export const GLADIATOR_CLASS_IDS = GAME_BALANCE.gladiators.classes.ids;
export const DEFAULT_GLADIATOR_CLASS_ID = GLADIATOR_CLASS_IDS[0];

export interface GladiatorClassDefinition {
  id: GladiatorClassId;
  nameKey: string;
  descriptionKey: string;
  effectSummaryKey: string;
  combatModifiers: (typeof GAME_BALANCE.gladiators.classes.combatModifiers)[GladiatorClassId];
}

export const GLADIATOR_CLASS_DEFINITIONS: Record<GladiatorClassId, GladiatorClassDefinition> = {
  murmillo: {
    id: 'murmillo',
    nameKey: 'gladiatorClasses.murmillo.name',
    descriptionKey: 'gladiatorClasses.murmillo.description',
    effectSummaryKey: 'gladiatorClasses.murmillo.effect',
    combatModifiers: GAME_BALANCE.gladiators.classes.combatModifiers.murmillo,
  },
  retiarius: {
    id: 'retiarius',
    nameKey: 'gladiatorClasses.retiarius.name',
    descriptionKey: 'gladiatorClasses.retiarius.description',
    effectSummaryKey: 'gladiatorClasses.retiarius.effect',
    combatModifiers: GAME_BALANCE.gladiators.classes.combatModifiers.retiarius,
  },
  secutor: {
    id: 'secutor',
    nameKey: 'gladiatorClasses.secutor.name',
    descriptionKey: 'gladiatorClasses.secutor.description',
    effectSummaryKey: 'gladiatorClasses.secutor.effect',
    combatModifiers: GAME_BALANCE.gladiators.classes.combatModifiers.secutor,
  },
  thraex: {
    id: 'thraex',
    nameKey: 'gladiatorClasses.thraex.name',
    descriptionKey: 'gladiatorClasses.thraex.description',
    effectSummaryKey: 'gladiatorClasses.thraex.effect',
    combatModifiers: GAME_BALANCE.gladiators.classes.combatModifiers.thraex,
  },
  hoplomachus: {
    id: 'hoplomachus',
    nameKey: 'gladiatorClasses.hoplomachus.name',
    descriptionKey: 'gladiatorClasses.hoplomachus.description',
    effectSummaryKey: 'gladiatorClasses.hoplomachus.effect',
    combatModifiers: GAME_BALANCE.gladiators.classes.combatModifiers.hoplomachus,
  },
};

function getStableIndex(seed: string, length: number) {
  const total = Array.from(seed).reduce((value, character) => value + character.charCodeAt(0), 0);

  return total % length;
}

export function isGladiatorClassId(value: string): value is GladiatorClassId {
  return GLADIATOR_CLASS_IDS.includes(value as GladiatorClassId);
}

export function createGladiatorClassId(seed: string): GladiatorClassId {
  return GLADIATOR_CLASS_IDS[getStableIndex(seed, GLADIATOR_CLASS_IDS.length)];
}

export function getGladiatorClassId(gladiator: Pick<Gladiator, 'classId'>): GladiatorClassId {
  return gladiator.classId ?? DEFAULT_GLADIATOR_CLASS_ID;
}

export function getGladiatorClassDefinition(gladiator: Pick<Gladiator, 'classId'>) {
  return GLADIATOR_CLASS_DEFINITIONS[getGladiatorClassId(gladiator)];
}

export function getGladiatorClassCombatModifiers(gladiator: Pick<Gladiator, 'classId'>) {
  return getGladiatorClassDefinition(gladiator).combatModifiers;
}
