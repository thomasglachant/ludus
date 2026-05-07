import { getPurchasedDormitoryImprovementCapacityBonus } from '../buildings/building-effects';
import { LUDUS_CAPACITY_CONFIG } from '../../game-data/buildings/levels';
import type { GameSave } from '../saves/types';

export function getLudusGladiatorCapacity(save: GameSave) {
  const dormitory = save.buildings.dormitory;

  if (!dormitory.isPurchased || dormitory.level <= 0) {
    return 0;
  }

  return Math.min(
    LUDUS_CAPACITY_CONFIG.minimumGladiators + getPurchasedDormitoryImprovementCapacityBonus(save),
    LUDUS_CAPACITY_CONFIG.maximumGladiators,
  );
}

export function getAvailableLudusGladiatorPlaces(save: GameSave) {
  return Math.max(0, getLudusGladiatorCapacity(save) - save.gladiators.length);
}
