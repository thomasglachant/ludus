import { describe, expect, it } from 'vitest';

import { createInitialSave } from '../saves/create-initial-save';
import type { GameSave } from '../saves/types';
import {
  findBuildingPurchaseLevelDefinition,
  getBuildingPurchaseAvailability,
  getBuildingPurchaseTargetLevel,
} from './building-unlocks';

function createTestSave(): GameSave {
  return createInitialSave({
    ludusName: 'Test Ludus',
    saveId: 'test-save',
    createdAt: '2026-05-01T08:00:00.000Z',
  });
}

describe('building unlocks', () => {
  it('returns the configured purchase level for a building', () => {
    expect(getBuildingPurchaseTargetLevel('farm')).toBe(1);
    expect(findBuildingPurchaseLevelDefinition('farm')).toMatchObject({
      level: 1,
      purchaseCost: 300,
      requiredDomusLevel: 2,
    });
  });

  it('marks starting buildings as purchased', () => {
    expect(getBuildingPurchaseAvailability(createTestSave(), 'domus')).toMatchObject({
      isPurchased: true,
      purchaseCost: 0,
      requiredDomusLevel: 1,
      status: 'purchased',
      targetLevel: 1,
    });
  });

  it('locks optional buildings until the Domus requirement is met', () => {
    expect(getBuildingPurchaseAvailability(createTestSave(), 'farm')).toMatchObject({
      isPurchased: false,
      purchaseCost: 300,
      requiredDomusLevel: 2,
      status: 'locked',
      targetLevel: 1,
    });
  });

  it('marks optional buildings as available when the Domus requirement is met', () => {
    const save = createTestSave();
    save.buildings.domus.level = 2;

    expect(getBuildingPurchaseAvailability(save, 'farm')).toMatchObject({
      isPurchased: false,
      purchaseCost: 300,
      requiredDomusLevel: 2,
      status: 'available',
      targetLevel: 1,
    });
  });
});
