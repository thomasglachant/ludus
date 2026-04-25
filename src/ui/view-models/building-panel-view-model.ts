import {
  validateBuildingPurchase,
  validateBuildingUpgrade,
} from '../../domain/buildings/building-actions';
import {
  getAvailableDormitoryBeds,
  getDormitoryCapacity,
  getMaximumPurchasableDormitoryBeds,
} from '../../domain/buildings/dormitory-capacity';
import { calculateReadiness } from '../../domain/planning/readiness';
import type {
  BuildingActionValidation,
  BuildingEffect,
  BuildingId,
  GameSave,
} from '../../domain/types';
import { BUILDING_IMPROVEMENTS, BUILDING_POLICIES } from '../../game-data/building-improvements';
import { BUILDING_DEFINITIONS } from '../../game-data/buildings';

type Translate = (key: string, params?: Record<string, string | number>) => string;

export interface BuildingPanelViewModel {
  action: {
    cost: number;
    isAllowed: boolean;
    labelKey: string;
    validationMessageKey: string | null;
    validationMessageParams: Record<string, string | number>;
  };
  assignedGladiators: {
    id: string;
    name: string;
    readiness: number;
  }[];
  descriptionKey: string;
  effects: string[];
  improvements: {
    cost: number;
    descriptionKey: string;
    id: string;
    isPurchased: boolean;
    nameKey: string;
  }[];
  isPurchased: boolean;
  level: number;
  nameKey: string;
  policies: {
    cost?: number;
    descriptionKey: string;
    id: string;
    isSelected: boolean;
    nameKey: string;
  }[];
  statusKey: string;
}

export interface DormitoryCapacityViewModel {
  availableBeds: number;
  capacity: number;
  maximumPurchasableBeds: number;
  purchasedBeds: number;
  usedBeds: number;
}

function getBuildingActionMessageKey(validation: BuildingActionValidation) {
  return validation.reason ? `buildings.validation.${validation.reason}` : null;
}

function getBuildingActionMessageParams(validation: BuildingActionValidation) {
  return {
    cost: validation.cost,
    level: validation.requiredDomusLevel ?? validation.targetLevel ?? 0,
  };
}

function formatBuildingEffects(effects: BuildingEffect[], t: Translate) {
  if (effects.length === 0) {
    return [t('buildings.noActiveEffects')];
  }

  return effects.map((effect) => {
    const effectText = t(`buildingEffects.${effect.type}`, { value: effect.value });

    return effect.perHour ? `${effectText} ${t('buildingEffects.perHour')}` : effectText;
  });
}

export function createBuildingPanelViewModel(
  save: GameSave,
  buildingId: BuildingId,
  t: Translate,
): BuildingPanelViewModel {
  const building = save.buildings[buildingId];
  const definition = BUILDING_DEFINITIONS[buildingId];
  const levelDefinition = definition.levels.find((level) => level.level === building.level);
  const purchaseValidation = validateBuildingPurchase(save, buildingId);
  const upgradeValidation = validateBuildingUpgrade(save, buildingId);
  const actionValidation = building.isPurchased ? upgradeValidation : purchaseValidation;

  return {
    action: {
      cost: actionValidation.cost,
      isAllowed: actionValidation.isAllowed,
      labelKey: building.isPurchased ? 'buildings.upgrade' : 'buildings.purchase',
      validationMessageKey: getBuildingActionMessageKey(actionValidation),
      validationMessageParams: getBuildingActionMessageParams(actionValidation),
    },
    assignedGladiators: save.gladiators
      .filter((gladiator) => gladiator.currentBuildingId === buildingId)
      .map((gladiator) => ({
        id: gladiator.id,
        name: gladiator.name,
        readiness: calculateReadiness(gladiator),
      })),
    descriptionKey: definition.descriptionKey,
    effects: formatBuildingEffects(levelDefinition?.effects ?? [], t),
    improvements: BUILDING_IMPROVEMENTS.filter(
      (improvement) => improvement.buildingId === buildingId,
    ).map((improvement) => ({
      cost: improvement.cost,
      descriptionKey: improvement.descriptionKey,
      id: improvement.id,
      isPurchased: building.purchasedImprovementIds.includes(improvement.id),
      nameKey: improvement.nameKey,
    })),
    isPurchased: building.isPurchased,
    level: building.level,
    nameKey: definition.nameKey,
    policies: BUILDING_POLICIES.filter((policy) => policy.buildingId === buildingId).map(
      (policy) => ({
        cost: policy.cost,
        descriptionKey: policy.descriptionKey,
        id: policy.id,
        isSelected: building.selectedPolicyId === policy.id,
        nameKey: policy.nameKey,
      }),
    ),
    statusKey: building.isPurchased ? 'common.purchased' : 'common.notPurchased',
  };
}

export function createDormitoryCapacityViewModel(save: GameSave): DormitoryCapacityViewModel {
  const configuration = save.buildings.dormitory.configuration;
  const purchasedBeds =
    configuration && 'purchasedBeds' in configuration ? configuration.purchasedBeds : 0;

  return {
    availableBeds: getAvailableDormitoryBeds(save),
    capacity: getDormitoryCapacity(save),
    maximumPurchasableBeds: getMaximumPurchasableDormitoryBeds(save),
    purchasedBeds,
    usedBeds: save.gladiators.length,
  };
}
