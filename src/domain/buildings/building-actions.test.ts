import { describe, expect, it } from 'vitest';
import { calculateBuildingUpgradeCost } from '../../game-data/building-levels';
import { createInitialSave } from '../saves/create-initial-save';
import {
  purchaseBuilding,
  upgradeBuilding,
  validateBuildingPurchase,
  validateBuildingUpgrade,
} from './building-actions';

function createTestSave() {
  return createInitialSave({
    ownerName: 'Marcus',
    ludusName: 'Ludus Magnus',
    language: 'en',
    saveId: 'save-test',
    createdAt: '2026-04-25T12:00:00.000Z',
  });
}

describe('building actions', () => {
  it('purchases an empty building slot when requirements are met', () => {
    const save = createTestSave();
    const result = purchaseBuilding(save, 'canteen');

    expect(result.validation).toMatchObject({
      isAllowed: true,
      cost: 120,
      targetLevel: 1,
    });
    expect(result.save.buildings.canteen).toMatchObject({
      isPurchased: true,
      level: 1,
    });
    expect(result.save.ludus.treasury).toBe(save.ludus.treasury - 120);
  });

  it('prevents purchasing an already purchased building', () => {
    const save = createTestSave();
    const validation = validateBuildingPurchase(save, 'domus');

    expect(validation).toMatchObject({
      isAllowed: false,
      reason: 'alreadyPurchased',
    });
  });

  it('prevents purchasing when treasury is too low', () => {
    const save = {
      ...createTestSave(),
      ludus: {
        treasury: 10,
        reputation: 0,
      },
    };
    const validation = validateBuildingPurchase(save, 'canteen');

    expect(validation).toMatchObject({
      isAllowed: false,
      reason: 'insufficientTreasury',
      targetLevel: 1,
    });
  });

  it('upgrades a purchased building when requirements are met', () => {
    const save = createTestSave();
    const result = upgradeBuilding(save, 'domus');

    expect(result.validation).toMatchObject({
      isAllowed: true,
      cost: calculateBuildingUpgradeCost(2),
      targetLevel: 2,
    });
    expect(result.save.buildings.domus.level).toBe(2);
    expect(result.save.ludus.treasury).toBe(save.ludus.treasury - calculateBuildingUpgradeCost(2));
  });

  it('gates non-domus upgrades behind the required Domus level', () => {
    const purchased = purchaseBuilding(
      {
        ...createTestSave(),
        ludus: {
          treasury: 1_000,
          reputation: 0,
        },
      },
      'canteen',
    ).save;
    const validation = validateBuildingUpgrade(purchased, 'canteen');

    expect(validation).toMatchObject({
      isAllowed: false,
      reason: 'missingDomusLevel',
      requiredDomusLevel: 2,
      targetLevel: 2,
    });
  });
});
