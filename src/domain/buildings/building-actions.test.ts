import { describe, expect, it } from 'vitest';
import { calculateBuildingUpgradeCost } from '../../game-data/building-levels';
import { BUILDING_IDS } from '../../game-data/buildings';
import { createInitialSave } from '../saves/create-initial-save';
import type { GameSave } from '../saves/types';
import {
  purchaseBuilding,
  purchaseBuildingImprovement,
  purchaseBuildingSkill,
  selectBuildingPolicy,
  upgradeBuilding,
  validateBuildingImprovementPurchase,
  validateBuildingPolicySelection,
  validateBuildingPurchase,
  validateBuildingSkillPurchase,
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
    expect(result.save.buildings.canteen).not.toHaveProperty('efficiency');
    expect(result.save.ludus.treasury).toBe(save.ludus.treasury - 120);
    expect(result.save.economy.ledgerEntries[0]).toMatchObject({
      amount: 120,
      buildingId: 'canteen',
      category: 'building',
      kind: 'expense',
      labelKey: 'finance.ledger.buildingPurchase',
    });
  });

  it('prevents purchasing an already purchased building', () => {
    const save = createTestSave();
    const purchasedBuildingIds = BUILDING_IDS.filter(
      (buildingId) => save.buildings[buildingId].isPurchased,
    );

    for (const buildingId of purchasedBuildingIds) {
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
          ...createTestSave().ludus,
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
    expect(result.save.economy.ledgerEntries[0]).toMatchObject({
      amount: calculateBuildingUpgradeCost(2),
      buildingId: 'domus',
      category: 'building',
      kind: 'expense',
      labelKey: 'finance.ledger.buildingUpgrade',
    });
  });

  it('upgrades buildings without adding legacy efficiency state', () => {
    const save = {
      ...createTestSave(),
      ludus: {
        ...createTestSave().ludus,
        treasury: 2_000,
      },
      buildings: {
        ...createTestSave().buildings,
        domus: {
          ...createTestSave().buildings.domus,
          level: 3,
        },
        trainingGround: {
          ...createTestSave().buildings.trainingGround,
          level: 2,
        },
      },
    };
    const result = upgradeBuilding(save, 'trainingGround');

    expect(result.validation).toMatchObject({
      isAllowed: true,
      targetLevel: 3,
    });
    expect(result.save.buildings.trainingGround.level).toBe(3);
    expect(result.save.buildings.trainingGround).not.toHaveProperty('efficiency');
  });

  it('gates non-domus upgrades behind the required Domus level', () => {
    const save = {
      ...createTestSave(),
      ludus: {
        ...createTestSave().ludus,
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
    expect(result.save.economy.ledgerEntries[0]).toMatchObject({
      amount: 70,
      buildingId: 'dormitory',
      category: 'building',
      kind: 'expense',
      labelKey: 'finance.ledger.buildingImprovement',
      relatedId: 'strawBeds',
    });
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

  it('purchases a building skill when requirements are met', () => {
    const save = createTestSave();
    const result = purchaseBuildingSkill(save, 'domus', 'domus.ledger-room');

    expect(result.validation).toMatchObject({
      isAllowed: true,
      cost: 90,
    });
    expect(result.save.buildings.domus.purchasedSkillIds).toContain('domus.ledger-room');
    expect(result.save.ludus.treasury).toBe(save.ludus.treasury - 90);
    expect(result.save.economy.ledgerEntries[0]).toMatchObject({
      amount: 90,
      buildingId: 'domus',
      category: 'building',
      kind: 'expense',
      labelKey: 'finance.ledger.buildingSkill',
      relatedId: 'domus.ledger-room',
    });
  });

  it('prevents a building skill purchase when prerequisites are missing', () => {
    const validation = validateBuildingSkillPurchase(
      createTestSave(),
      'domus',
      'domus.steward-desk',
    );

    expect(validation).toMatchObject({
      isAllowed: false,
      reason: 'missingSkillPrerequisite',
      missingSkillIds: ['domus.ledger-room', 'domus.contract-shelf', 'domus.estate-registry'],
    });
  });

  it('prevents buying the same building skill twice', () => {
    const save = purchaseBuildingSkill(createTestSave(), 'domus', 'domus.ledger-room').save;
    const validation = validateBuildingSkillPurchase(save, 'domus', 'domus.ledger-room');

    expect(validation).toMatchObject({
      isAllowed: false,
      reason: 'alreadyPurchasedSkill',
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
    const result = selectBuildingPolicy(save, 'trainingGround', 'strengthDoctrine');

    expect(result.validation).toMatchObject({
      isAllowed: true,
      cost: 0,
    });
    expect(result.save.buildings.trainingGround.selectedPolicyId).toBe('strengthDoctrine');
    expect(result.save.ludus.treasury).toBe(save.ludus.treasury);
    expect(result.save.economy.ledgerEntries).toEqual(save.economy.ledgerEntries);
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
