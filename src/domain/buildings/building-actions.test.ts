import { describe, expect, it } from 'vitest';
import { calculateBuildingUpgradeCost } from '../../game-data/building-levels';
import { BUILDING_IDS } from '../../game-data/buildings';
import { createInitialSave } from '../saves/create-initial-save';
import type { GameSave } from '../saves/types';
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

function withUnpurchasedBuilding(save: GameSave, buildingId: (typeof BUILDING_IDS)[number]) {
  return {
    ...save,
    buildings: {
      ...save.buildings,
      [buildingId]: {
        ...save.buildings[buildingId],
        isPurchased: false,
        level: 0,
      },
    },
  };
}

describe('building actions', () => {
  it('purchases an unowned building fixture when requirements are met', () => {
    const save = withUnpurchasedBuilding(createTestSave(), 'canteen');
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

    for (const buildingId of BUILDING_IDS) {
      expect(validateBuildingPurchase(save, buildingId)).toMatchObject({
        isAllowed: false,
        reason: 'alreadyPurchased',
      });
    }
  });

  it('prevents purchasing when treasury is too low', () => {
    const save = withUnpurchasedBuilding(
      {
        ...createTestSave(),
        ludus: {
          treasury: 10,
          reputation: 0,
        },
      },
      'canteen',
    );
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
    const save = {
      ...createTestSave(),
      ludus: {
        treasury: 1_000,
        reputation: 0,
      },
    };
    const validation = validateBuildingUpgrade(save, 'canteen');

    expect(validation).toMatchObject({
      isAllowed: false,
      reason: 'missingDomusLevel',
      requiredDomusLevel: 2,
      targetLevel: 2,
    });
  });
});
