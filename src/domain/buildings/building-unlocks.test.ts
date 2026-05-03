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
    expect(getBuildingPurchaseTargetLevel('canteen')).toBe(1);
    expect(findBuildingPurchaseLevelDefinition('canteen')).toMatchObject({
      level: 1,
      purchaseCost: 120,
      requiredDomusLevel: 1,
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
});
