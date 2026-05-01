import { describe, expect, it } from 'vitest';
import { calculateBuildingUpgradeCost } from '../../game-data/building-levels';
import { BUILDING_IDS } from '../../game-data/buildings';
import { createInitialSave } from '../saves/create-initial-save';
import type { GameSave } from '../saves/types';
import {
  purchaseBuilding,
  purchaseBuildingImprovement,
  selectBuildingPolicy,
  upgradeBuilding,
  validateBuildingImprovementPurchase,
  validateBuildingPolicySelection,
  validateBuildingPurchase,
  validateBuildingUpgrade,
} from './building-actions';
import { getLudusGladiatorCapacity } from '../ludus/capacity';

function createTestSave() {
  return createInitialSave({
    ludusName: 'Ludus Magnus',
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

  it('purchases a building improvement when requirements are met', () => {
    const save = createTestSave();
    const result = purchaseBuildingImprovement(save, 'dormitory', 'strawBeds');

    expect(result.validation).toMatchObject({
      isAllowed: true,
      cost: 70,
    });
    expect(result.save.buildings.dormitory.purchasedImprovementIds).toContain('strawBeds');
    expect(result.save.ludus.treasury).toBe(save.ludus.treasury - 70);
  });

  it('prevents an improvement purchase when the building level is too low', () => {
    const validation = validateBuildingImprovementPurchase(
      createTestSave(),
      'trainingGround',
      'advancedDoctoreTools',
    );

    expect(validation).toMatchObject({
      isAllowed: false,
      reason: 'missingBuildingLevel',
      requiredBuildingLevel: 2,
    });
  });

  it('prevents an improvement purchase when prerequisites are missing', () => {
    const validation = validateBuildingImprovementPurchase(
      createTestSave(),
      'dormitory',
      'woodenBeds',
    );

    expect(validation).toMatchObject({
      isAllowed: false,
      reason: 'missingImprovementPrerequisite',
      missingImprovementIds: ['strawBeds'],
    });
  });

  it('prevents buying the same improvement twice', () => {
    const save = purchaseBuildingImprovement(createTestSave(), 'dormitory', 'strawBeds').save;
    const validation = validateBuildingImprovementPurchase(save, 'dormitory', 'strawBeds');

    expect(validation).toMatchObject({
      isAllowed: false,
      reason: 'alreadyPurchasedImprovement',
    });
  });

  it('does not let dormitory improvements change Domus-governed capacity', () => {
    const save = createTestSave();
    const result = purchaseBuildingImprovement(save, 'dormitory', 'strawBeds');

    expect(getLudusGladiatorCapacity(save)).toBe(1);
    expect(getLudusGladiatorCapacity(result.save)).toBe(1);
  });

  it('selects a building policy and pays its selection cost', () => {
    const save = createTestSave();
    const result = selectBuildingPolicy(save, 'pleasureHall', 'gamesAndSongs');

    expect(result.validation).toMatchObject({
      isAllowed: true,
      cost: 25,
    });
    expect(result.save.buildings.pleasureHall.selectedPolicyId).toBe('gamesAndSongs');
    expect(result.save.ludus.treasury).toBe(save.ludus.treasury - 25);
  });

  it('prevents selecting a policy above the current building level', () => {
    const validation = validateBuildingPolicySelection(
      createTestSave(),
      'trainingGround',
      'brutalDiscipline',
    );

    expect(validation).toMatchObject({
      isAllowed: false,
      reason: 'missingBuildingLevel',
      requiredBuildingLevel: 2,
    });
  });
});
