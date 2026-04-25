import {
  validateBuildingImprovementPurchase,
  validateBuildingPolicySelection,
  validateBuildingPurchase,
  validateBuildingUpgrade,
} from '../../domain/buildings/building-actions';
import { getActiveBuildingEffects } from '../../domain/buildings/building-effects';
import { validateDormitoryBedPurchase } from '../../domain/buildings/dormitory-actions';
import {
  getAvailableDormitoryBeds,
  getDormitoryCapacity,
  getMaximumPurchasableDormitoryBeds,
  getDormitoryPurchasedBeds,
} from '../../domain/buildings/dormitory-capacity';
import { calculateEffectiveReadiness } from '../../domain/planning/readiness';
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
    actionLabelKey: string;
    canPurchase: boolean;
    cost: number;
    descriptionKey: string;
    effects: string[];
    id: string;
    isPurchased: boolean;
    nameKey: string;
    requiredBuildingLevel: number;
    requiredImprovementNames: string[];
    validationMessageKey: string | null;
    validationMessageParams: Record<string, string | number>;
  }[];
  isPurchased: boolean;
  level: number;
  nameKey: string;
  policies: {
    actionLabelKey: string;
    canSelect: boolean;
    cost?: number;
    descriptionKey: string;
    effects: string[];
    id: string;
    isSelected: boolean;
    nameKey: string;
    requiredBuildingLevel: number;
    validationMessageKey: string | null;
    validationMessageParams: Record<string, string | number>;
  }[];
  statusKey: string;
}

export interface DormitoryCapacityViewModel {
  availableBeds: number;
  capacity: number;
  canPurchaseBed: boolean;
  maximumPurchasableBeds: number;
  nextBedCost: number;
  purchasedBeds: number;
  validationMessageKey: string | null;
  usedBeds: number;
}

function getBuildingActionMessageKey(validation: BuildingActionValidation) {
  return validation.reason ? `buildings.validation.${validation.reason}` : null;
}

function getBuildingActionMessageParams(validation: BuildingActionValidation) {
  return {
    cost: validation.cost,
    level:
      validation.requiredBuildingLevel ??
      validation.requiredDomusLevel ??
      validation.targetLevel ??
      0,
    missing:
      validation.missingImprovementIds && validation.missingImprovementIds.length > 0
        ? validation.missingImprovementIds.join(', ')
        : '',
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
        readiness: calculateEffectiveReadiness(save, gladiator),
      })),
    descriptionKey: definition.descriptionKey,
    effects: formatBuildingEffects(getActiveBuildingEffects(save, buildingId), t),
    improvements: BUILDING_IMPROVEMENTS.filter(
      (improvement) => improvement.buildingId === buildingId,
    ).map((improvement) => {
      const validation = validateBuildingImprovementPurchase(save, buildingId, improvement.id);
      const isPurchased = building.purchasedImprovementIds.includes(improvement.id);
      const requiredImprovementNames = (improvement.requiredImprovementIds ?? []).map(
        (requiredImprovementId) =>
          t(
            BUILDING_IMPROVEMENTS.find(
              (candidate) =>
                candidate.buildingId === buildingId && candidate.id === requiredImprovementId,
            )?.nameKey ?? requiredImprovementId,
          ),
      );

      return {
        actionLabelKey: isPurchased ? 'common.purchased' : 'buildingPanel.purchaseImprovement',
        canPurchase: validation.isAllowed,
        cost: improvement.cost,
        descriptionKey: improvement.descriptionKey,
        effects: formatBuildingEffects(improvement.effects, t),
        id: improvement.id,
        isPurchased,
        nameKey: improvement.nameKey,
        requiredBuildingLevel: improvement.requiredBuildingLevel,
        requiredImprovementNames,
        validationMessageKey: getBuildingActionMessageKey(validation),
        validationMessageParams: {
          ...getBuildingActionMessageParams(validation),
          missing: requiredImprovementNames.join(', '),
        },
      };
    }),
    isPurchased: building.isPurchased,
    level: building.level,
    nameKey: definition.nameKey,
    policies: BUILDING_POLICIES.filter((policy) => policy.buildingId === buildingId).map(
      (policy) => {
        const validation = validateBuildingPolicySelection(save, buildingId, policy.id);
        const isSelected = building.selectedPolicyId === policy.id;

        return {
          actionLabelKey: isSelected ? 'common.selected' : 'buildingPanel.selectPolicy',
          canSelect: validation.isAllowed,
          cost: policy.cost,
          descriptionKey: policy.descriptionKey,
          effects: formatBuildingEffects(policy.effects, t),
          id: policy.id,
          isSelected,
          nameKey: policy.nameKey,
          requiredBuildingLevel: policy.requiredBuildingLevel,
          validationMessageKey: getBuildingActionMessageKey(validation),
          validationMessageParams: getBuildingActionMessageParams(validation),
        };
      },
    ),
    statusKey: building.isPurchased ? 'common.purchased' : 'common.notPurchased',
  };
}

export function createDormitoryCapacityViewModel(save: GameSave): DormitoryCapacityViewModel {
  const validation = validateDormitoryBedPurchase(save);

  return {
    availableBeds: getAvailableDormitoryBeds(save),
    capacity: getDormitoryCapacity(save),
    canPurchaseBed: validation.isAllowed,
    maximumPurchasableBeds: getMaximumPurchasableDormitoryBeds(save),
    nextBedCost: validation.cost,
    purchasedBeds: getDormitoryPurchasedBeds(save),
    validationMessageKey: validation.reason
      ? `dormitoryBeds.validation.${validation.reason}`
      : null,
    usedBeds: save.gladiators.length,
  };
}
