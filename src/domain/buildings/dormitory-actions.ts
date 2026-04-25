import { calculateDormitoryBedCost } from '../../game-data/building-levels';
import type { GameSave } from '../saves/types';
import {
  getDormitoryPurchasedBeds,
  getMaximumPurchasableDormitoryBeds,
} from './dormitory-capacity';

export type DormitoryBedPurchaseFailureReason =
  | 'insufficientTreasury'
  | 'maximumBedsReached'
  | 'notPurchased';

export interface DormitoryBedPurchaseValidation {
  isAllowed: boolean;
  cost: number;
  maximumPurchasableBeds: number;
  purchasedBeds: number;
  reason?: DormitoryBedPurchaseFailureReason;
}

export interface DormitoryBedPurchaseResult {
  save: GameSave;
  validation: DormitoryBedPurchaseValidation;
}

export function validateDormitoryBedPurchase(save: GameSave): DormitoryBedPurchaseValidation {
  const dormitory = save.buildings.dormitory;
  const purchasedBeds = getDormitoryPurchasedBeds(save);
  const maximumPurchasableBeds = getMaximumPurchasableDormitoryBeds(save);
  const cost = calculateDormitoryBedCost(purchasedBeds);

  if (!dormitory.isPurchased || dormitory.level <= 0) {
    return {
      isAllowed: false,
      cost: 0,
      maximumPurchasableBeds,
      purchasedBeds,
      reason: 'notPurchased',
    };
  }

  if (purchasedBeds >= maximumPurchasableBeds) {
    return {
      isAllowed: false,
      cost: 0,
      maximumPurchasableBeds,
      purchasedBeds,
      reason: 'maximumBedsReached',
    };
  }

  if (save.ludus.treasury < cost) {
    return {
      isAllowed: false,
      cost,
      maximumPurchasableBeds,
      purchasedBeds,
      reason: 'insufficientTreasury',
    };
  }

  return {
    isAllowed: true,
    cost,
    maximumPurchasableBeds,
    purchasedBeds,
  };
}

export function purchaseDormitoryBed(save: GameSave): DormitoryBedPurchaseResult {
  const validation = validateDormitoryBedPurchase(save);

  if (!validation.isAllowed) {
    return { save, validation };
  }

  return {
    validation,
    save: {
      ...save,
      ludus: {
        ...save.ludus,
        treasury: save.ludus.treasury - validation.cost,
      },
      buildings: {
        ...save.buildings,
        dormitory: {
          ...save.buildings.dormitory,
          configuration: {
            ...save.buildings.dormitory.configuration,
            purchasedBeds: validation.purchasedBeds + 1,
          },
        },
      },
    },
  };
}
