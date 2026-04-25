import { BUILDING_DEFINITIONS } from '../../game-data/buildings';
import type { GameSave } from '../saves/types';
import type { BuildingId, BuildingLevelDefinition } from './types';

export type BuildingActionFailureReason =
  | 'alreadyPurchased'
  | 'insufficientTreasury'
  | 'missingDomusLevel'
  | 'notPurchased'
  | 'unavailableLevel';

export interface BuildingActionValidation {
  isAllowed: boolean;
  cost: number;
  targetLevel?: number;
  reason?: BuildingActionFailureReason;
  requiredDomusLevel?: number;
}

export interface BuildingActionResult {
  save: GameSave;
  validation: BuildingActionValidation;
}

function findBuildingLevel(
  buildingId: BuildingId,
  targetLevel: number,
): BuildingLevelDefinition | undefined {
  return BUILDING_DEFINITIONS[buildingId].levels.find((level) => level.level === targetLevel);
}

function validateTreasury(save: GameSave, cost: number): BuildingActionValidation | null {
  if (save.ludus.treasury < cost) {
    return {
      isAllowed: false,
      cost,
      reason: 'insufficientTreasury',
    };
  }

  return null;
}

function validateDomusLevel(
  save: GameSave,
  levelDefinition: BuildingLevelDefinition,
): BuildingActionValidation | null {
  if (save.buildings.domus.level < levelDefinition.requiredDomusLevel) {
    return {
      isAllowed: false,
      cost: levelDefinition.purchaseCost ?? levelDefinition.upgradeCost ?? 0,
      targetLevel: levelDefinition.level,
      reason: 'missingDomusLevel',
      requiredDomusLevel: levelDefinition.requiredDomusLevel,
    };
  }

  return null;
}

export function validateBuildingPurchase(
  save: GameSave,
  buildingId: BuildingId,
): BuildingActionValidation {
  const building = save.buildings[buildingId];

  if (building.isPurchased) {
    return {
      isAllowed: false,
      cost: 0,
      reason: 'alreadyPurchased',
    };
  }

  const targetLevel = BUILDING_DEFINITIONS[buildingId].startsAtLevel || 1;
  const levelDefinition = findBuildingLevel(buildingId, targetLevel);

  if (!levelDefinition) {
    return {
      isAllowed: false,
      cost: 0,
      targetLevel,
      reason: 'unavailableLevel',
    };
  }

  const cost = levelDefinition.purchaseCost ?? 0;
  const domusValidation = validateDomusLevel(save, levelDefinition);

  if (domusValidation) {
    return { ...domusValidation, cost, targetLevel };
  }

  const treasuryValidation = validateTreasury(save, cost);

  if (treasuryValidation) {
    return { ...treasuryValidation, targetLevel };
  }

  return {
    isAllowed: true,
    cost,
    targetLevel,
  };
}

export function validateBuildingUpgrade(
  save: GameSave,
  buildingId: BuildingId,
): BuildingActionValidation {
  const building = save.buildings[buildingId];

  if (!building.isPurchased) {
    return {
      isAllowed: false,
      cost: 0,
      reason: 'notPurchased',
    };
  }

  const targetLevel = building.level + 1;
  const levelDefinition = findBuildingLevel(buildingId, targetLevel);

  if (!levelDefinition) {
    return {
      isAllowed: false,
      cost: 0,
      targetLevel,
      reason: 'unavailableLevel',
    };
  }

  const cost = levelDefinition.upgradeCost ?? 0;
  const domusValidation = validateDomusLevel(save, levelDefinition);

  if (domusValidation) {
    return { ...domusValidation, cost, targetLevel };
  }

  const treasuryValidation = validateTreasury(save, cost);

  if (treasuryValidation) {
    return { ...treasuryValidation, targetLevel };
  }

  return {
    isAllowed: true,
    cost,
    targetLevel,
  };
}

export function purchaseBuilding(save: GameSave, buildingId: BuildingId): BuildingActionResult {
  const validation = validateBuildingPurchase(save, buildingId);

  if (!validation.isAllowed || !validation.targetLevel) {
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
        [buildingId]: {
          ...save.buildings[buildingId],
          isPurchased: true,
          level: validation.targetLevel,
        },
      },
    },
  };
}

export function upgradeBuilding(save: GameSave, buildingId: BuildingId): BuildingActionResult {
  const validation = validateBuildingUpgrade(save, buildingId);

  if (!validation.isAllowed || !validation.targetLevel) {
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
        [buildingId]: {
          ...save.buildings[buildingId],
          level: validation.targetLevel,
        },
      },
    },
  };
}
