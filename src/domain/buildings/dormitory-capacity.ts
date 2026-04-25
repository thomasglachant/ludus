import { DORMITORY_BED_CONFIG } from '../../game-data/building-levels';
import type { GameSave } from '../saves/types';
import type { DormitoryConfiguration } from './types';

function getDormitoryConfiguration(save: GameSave): DormitoryConfiguration {
  const configuration = save.buildings.dormitory.configuration;

  if (configuration && 'purchasedBeds' in configuration) {
    return configuration;
  }

  return { purchasedBeds: 0 };
}

export function getDormitoryPurchasedBeds(save: GameSave) {
  return getDormitoryConfiguration(save).purchasedBeds;
}

export function getDormitoryCapacity(save: GameSave) {
  const dormitory = save.buildings.dormitory;

  if (!dormitory.isPurchased || dormitory.level <= 0) {
    return 0;
  }

  const freeBeds = DORMITORY_BED_CONFIG.freeBedsAtLevelOne + Math.max(0, dormitory.level - 1);
  return freeBeds + getDormitoryPurchasedBeds(save);
}

export function getAvailableDormitoryBeds(save: GameSave) {
  return Math.max(0, getDormitoryCapacity(save) - save.gladiators.length);
}

export function getMaximumPurchasableDormitoryBeds(save: GameSave) {
  const dormitory = save.buildings.dormitory;

  if (!dormitory.isPurchased || dormitory.level <= 0) {
    return 0;
  }

  return dormitory.level * DORMITORY_BED_CONFIG.purchasableBedsPerLevel;
}
