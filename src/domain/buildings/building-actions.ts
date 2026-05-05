import { BUILDING_IMPROVEMENTS, BUILDING_POLICIES } from '../../game-data/building-improvements';
import { BUILDING_SKILLS } from '../../game-data/building-skills';
import { BUILDING_DEFINITIONS } from '../../game-data/buildings';
import {
  addLedgerEntry,
  createLedgerEntry,
  updateCurrentWeekSummary,
} from '../economy/economy-actions';
import {
  findBuildingPurchaseLevelDefinition,
  getBuildingPurchaseTargetLevel,
} from './building-unlocks';
import type { GameSave } from '../saves/types';
import type {
  BuildingId,
  BuildingImprovementDefinition,
  BuildingLevelDefinition,
  BuildingPolicyDefinition,
  BuildingSkillDefinition,
} from './types';

export type BuildingActionFailureReason =
  | 'alreadyPurchased'
  | 'alreadyPurchasedImprovement'
  | 'alreadyPurchasedSkill'
  | 'alreadySelectedPolicy'
  | 'insufficientTreasury'
  | 'missingBuildingLevel'
  | 'missingDomusLevel'
  | 'missingImprovementPrerequisite'
  | 'missingSkillPrerequisite'
  | 'notPurchased'
  | 'unavailableImprovement'
  | 'unavailableLevel'
  | 'unavailablePolicy'
  | 'unavailableSkill';

export interface BuildingActionValidation {
  isAllowed: boolean;
  cost: number;
  missingImprovementIds?: string[];
  missingSkillIds?: string[];
  requiredBuildingLevel?: number;
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

function findBuildingImprovement(
  buildingId: BuildingId,
  improvementId: string,
): BuildingImprovementDefinition | undefined {
  return BUILDING_IMPROVEMENTS.find(
    (improvement) => improvement.buildingId === buildingId && improvement.id === improvementId,
  );
}

function findBuildingPolicy(
  buildingId: BuildingId,
  policyId: string,
): BuildingPolicyDefinition | undefined {
  return BUILDING_POLICIES.find(
    (policy) => policy.buildingId === buildingId && policy.id === policyId,
  );
}

function findBuildingSkill(
  buildingId: BuildingId,
  skillId: string,
): BuildingSkillDefinition | undefined {
  return BUILDING_SKILLS.find((skill) => skill.buildingId === buildingId && skill.id === skillId);
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

function recordBuildingExpense(
  save: GameSave,
  buildingId: BuildingId,
  amount: number,
  labelKey: string,
  relatedId: string = buildingId,
) {
  if (amount <= 0) {
    return updateCurrentWeekSummary(save);
  }

  return updateCurrentWeekSummary(
    addLedgerEntry(
      save,
      createLedgerEntry(save, {
        kind: 'expense',
        category: 'building',
        amount,
        labelKey,
        buildingId,
        relatedId,
      }),
    ),
  );
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

  const targetLevel = getBuildingPurchaseTargetLevel(buildingId);
  const levelDefinition = findBuildingPurchaseLevelDefinition(buildingId);

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

export function validateBuildingImprovementPurchase(
  save: GameSave,
  buildingId: BuildingId,
  improvementId: string,
): BuildingActionValidation {
  const building = save.buildings[buildingId];
  const improvement = findBuildingImprovement(buildingId, improvementId);

  if (!improvement) {
    return {
      isAllowed: false,
      cost: 0,
      reason: 'unavailableImprovement',
    };
  }

  if (!building.isPurchased) {
    return {
      isAllowed: false,
      cost: improvement.cost,
      reason: 'notPurchased',
    };
  }

  if (building.level < improvement.requiredBuildingLevel) {
    return {
      isAllowed: false,
      cost: improvement.cost,
      reason: 'missingBuildingLevel',
      requiredBuildingLevel: improvement.requiredBuildingLevel,
    };
  }

  if (building.purchasedImprovementIds.includes(improvement.id)) {
    return {
      isAllowed: false,
      cost: improvement.cost,
      reason: 'alreadyPurchasedImprovement',
    };
  }

  const missingImprovementIds = (improvement.requiredImprovementIds ?? []).filter(
    (requiredImprovementId) => !building.purchasedImprovementIds.includes(requiredImprovementId),
  );

  if (missingImprovementIds.length > 0) {
    return {
      isAllowed: false,
      cost: improvement.cost,
      reason: 'missingImprovementPrerequisite',
      missingImprovementIds,
    };
  }

  const treasuryValidation = validateTreasury(save, improvement.cost);

  if (treasuryValidation) {
    return treasuryValidation;
  }

  return {
    isAllowed: true,
    cost: improvement.cost,
  };
}

export function validateBuildingPolicySelection(
  save: GameSave,
  buildingId: BuildingId,
  policyId: string,
): BuildingActionValidation {
  const building = save.buildings[buildingId];
  const policy = findBuildingPolicy(buildingId, policyId);

  if (!policy) {
    return {
      isAllowed: false,
      cost: 0,
      reason: 'unavailablePolicy',
    };
  }

  const cost = policy.cost ?? 0;

  if (!building.isPurchased) {
    return {
      isAllowed: false,
      cost,
      reason: 'notPurchased',
    };
  }

  if (building.level < policy.requiredBuildingLevel) {
    return {
      isAllowed: false,
      cost,
      reason: 'missingBuildingLevel',
      requiredBuildingLevel: policy.requiredBuildingLevel,
    };
  }

  if (building.selectedPolicyId === policy.id) {
    return {
      isAllowed: false,
      cost,
      reason: 'alreadySelectedPolicy',
    };
  }

  const treasuryValidation = validateTreasury(save, cost);

  if (treasuryValidation) {
    return treasuryValidation;
  }

  return {
    isAllowed: true,
    cost,
  };
}

export function validateBuildingSkillPurchase(
  save: GameSave,
  buildingId: BuildingId,
  skillId: string,
): BuildingActionValidation {
  const building = save.buildings[buildingId];
  const skill = findBuildingSkill(buildingId, skillId);

  if (!skill) {
    return {
      isAllowed: false,
      cost: 0,
      reason: 'unavailableSkill',
    };
  }

  if (!building.isPurchased) {
    return {
      isAllowed: false,
      cost: skill.cost,
      reason: 'notPurchased',
    };
  }

  if (building.level < skill.requiredBuildingLevel) {
    return {
      isAllowed: false,
      cost: skill.cost,
      reason: 'missingBuildingLevel',
      requiredBuildingLevel: skill.requiredBuildingLevel,
    };
  }

  if (building.purchasedSkillIds.includes(skill.id)) {
    return {
      isAllowed: false,
      cost: skill.cost,
      reason: 'alreadyPurchasedSkill',
    };
  }

  const missingSkillIds = (skill.requiredSkillIds ?? []).filter(
    (requiredSkillId) => !building.purchasedSkillIds.includes(requiredSkillId),
  );

  if (missingSkillIds.length > 0) {
    return {
      isAllowed: false,
      cost: skill.cost,
      reason: 'missingSkillPrerequisite',
      missingSkillIds,
    };
  }

  const treasuryValidation = validateTreasury(save, skill.cost);

  if (treasuryValidation) {
    return treasuryValidation;
  }

  return {
    isAllowed: true,
    cost: skill.cost,
  };
}

export function purchaseBuilding(save: GameSave, buildingId: BuildingId): BuildingActionResult {
  const validation = validateBuildingPurchase(save, buildingId);

  if (!validation.isAllowed || !validation.targetLevel) {
    return { save, validation };
  }

  return {
    validation,
    save: recordBuildingExpense(
      {
        ...save,
        buildings: {
          ...save.buildings,
          [buildingId]: {
            ...save.buildings[buildingId],
            isPurchased: true,
            level: validation.targetLevel,
          },
        },
      },
      buildingId,
      validation.cost,
      'finance.ledger.buildingPurchase',
    ),
  };
}

export function upgradeBuilding(save: GameSave, buildingId: BuildingId): BuildingActionResult {
  const validation = validateBuildingUpgrade(save, buildingId);

  if (!validation.isAllowed || !validation.targetLevel) {
    return { save, validation };
  }

  return {
    validation,
    save: recordBuildingExpense(
      {
        ...save,
        buildings: {
          ...save.buildings,
          [buildingId]: {
            ...save.buildings[buildingId],
            level: validation.targetLevel,
          },
        },
      },
      buildingId,
      validation.cost,
      'finance.ledger.buildingUpgrade',
    ),
  };
}

export function purchaseBuildingImprovement(
  save: GameSave,
  buildingId: BuildingId,
  improvementId: string,
): BuildingActionResult {
  const validation = validateBuildingImprovementPurchase(save, buildingId, improvementId);

  if (!validation.isAllowed) {
    return { save, validation };
  }

  return {
    validation,
    save: recordBuildingExpense(
      {
        ...save,
        buildings: {
          ...save.buildings,
          [buildingId]: {
            ...save.buildings[buildingId],
            purchasedImprovementIds: [
              ...save.buildings[buildingId].purchasedImprovementIds,
              improvementId,
            ],
          },
        },
      },
      buildingId,
      validation.cost,
      'finance.ledger.buildingImprovement',
      improvementId,
    ),
  };
}

export function selectBuildingPolicy(
  save: GameSave,
  buildingId: BuildingId,
  policyId: string,
): BuildingActionResult {
  const validation = validateBuildingPolicySelection(save, buildingId, policyId);

  if (!validation.isAllowed) {
    return { save, validation };
  }

  return {
    validation,
    save: recordBuildingExpense(
      {
        ...save,
        buildings: {
          ...save.buildings,
          [buildingId]: {
            ...save.buildings[buildingId],
            selectedPolicyId: policyId,
          },
        },
      },
      buildingId,
      validation.cost,
      'finance.ledger.buildingPolicy',
      policyId,
    ),
  };
}

export function purchaseBuildingSkill(
  save: GameSave,
  buildingId: BuildingId,
  skillId: string,
): BuildingActionResult {
  const validation = validateBuildingSkillPurchase(save, buildingId, skillId);

  if (!validation.isAllowed) {
    return { save, validation };
  }

  return {
    validation,
    save: recordBuildingExpense(
      {
        ...save,
        buildings: {
          ...save.buildings,
          [buildingId]: {
            ...save.buildings[buildingId],
            purchasedSkillIds: [...save.buildings[buildingId].purchasedSkillIds, skillId],
          },
        },
      },
      buildingId,
      validation.cost,
      'finance.ledger.buildingSkill',
      skillId,
    ),
  };
}
