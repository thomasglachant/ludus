import { describe, expect, it } from 'vitest';
import { calculateDormitoryBedCost } from '../../game-data/building-levels';
import { createInitialSave } from '../saves/create-initial-save';
import type { GameSave } from '../saves/types';
import { getDormitoryCapacity, getMaximumPurchasableDormitoryBeds } from './dormitory-capacity';
import { purchaseDormitoryBed, validateDormitoryBedPurchase } from './dormitory-actions';

function createTestSave() {
  return createInitialSave({
    ownerName: 'Marcus',
    ludusName: 'Ludus Magnus',
    language: 'en',
    saveId: 'save-test',
    createdAt: '2026-04-25T12:00:00.000Z',
  });
}

function withDormitoryBeds(save: GameSave, purchasedBeds: number): GameSave {
  return {
    ...save,
    buildings: {
      ...save.buildings,
      dormitory: {
        ...save.buildings.dormitory,
        configuration: { purchasedBeds },
      },
    },
  };
}

describe('dormitory bed actions', () => {
  it('purchases a bed and increases capacity', () => {
    const save = createTestSave();
    const result = purchaseDormitoryBed(save);

    expect(result.validation).toMatchObject({
      isAllowed: true,
      cost: calculateDormitoryBedCost(0),
      purchasedBeds: 0,
    });
    expect(result.save.buildings.dormitory.configuration).toEqual({ purchasedBeds: 1 });
    expect(result.save.ludus.treasury).toBe(save.ludus.treasury - calculateDormitoryBedCost(0));
    expect(getDormitoryCapacity(result.save)).toBe(2);
  });

  it('prevents bed purchase when treasury is too low', () => {
    const save = {
      ...createTestSave(),
      ludus: {
        treasury: calculateDormitoryBedCost(0) - 1,
        reputation: 0,
      },
    };

    expect(validateDormitoryBedPurchase(save)).toMatchObject({
      isAllowed: false,
      reason: 'insufficientTreasury',
      cost: calculateDormitoryBedCost(0),
    });
  });

  it('prevents buying more beds than the current dormitory level allows', () => {
    const save = withDormitoryBeds(createTestSave(), 2);
    const validation = validateDormitoryBedPurchase(save);

    expect(getMaximumPurchasableDormitoryBeds(save)).toBe(2);
    expect(validation).toMatchObject({
      isAllowed: false,
      reason: 'maximumBedsReached',
      maximumPurchasableBeds: 2,
      purchasedBeds: 2,
    });
  });

  it('prevents bed purchase when the dormitory is not owned', () => {
    const baseSave = createTestSave();
    const save: GameSave = {
      ...baseSave,
      buildings: {
        ...baseSave.buildings,
        dormitory: {
          ...baseSave.buildings.dormitory,
          isPurchased: false,
          level: 0,
        },
      },
    };

    expect(validateDormitoryBedPurchase(save)).toMatchObject({
      isAllowed: false,
      reason: 'notPurchased',
    });
  });
});
