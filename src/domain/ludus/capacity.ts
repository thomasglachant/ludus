import { LUDUS_CAPACITY_CONFIG } from '../../game-data/building-levels';
import type { GameSave } from '../saves/types';

export function getLudusGladiatorCapacity(save: GameSave) {
  const domus = save.buildings.domus;

  if (!domus.isPurchased || domus.level <= 0) {
    return 0;
  }

  return Math.min(
    Math.max(domus.level, LUDUS_CAPACITY_CONFIG.minimumGladiators),
    LUDUS_CAPACITY_CONFIG.maximumGladiators,
  );
}

export function getAvailableLudusGladiatorPlaces(save: GameSave) {
  return Math.max(0, getLudusGladiatorCapacity(save) - save.gladiators.length);
}

export function getLudusStaffCapacity(save: GameSave) {
  const domus = save.buildings.domus;

  if (!domus.isPurchased || domus.level <= 0) {
    return 0;
  }

  return Math.min(
    Math.max(
      domus.level * LUDUS_CAPACITY_CONFIG.staffPerDomusLevel,
      LUDUS_CAPACITY_CONFIG.minimumStaff,
    ),
    LUDUS_CAPACITY_CONFIG.maximumStaff,
  );
}

export function getAvailableLudusStaffPlaces(save: GameSave) {
  return Math.max(0, getLudusStaffCapacity(save) - save.staff.members.length);
}
