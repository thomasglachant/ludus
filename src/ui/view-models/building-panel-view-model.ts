import {
  validateBuildingImprovementPurchase,
  validateBuildingPolicySelection,
  validateBuildingPurchase,
  validateBuildingUpgrade,
} from '../../domain/buildings/building-actions';
import { getActiveBuildingEffects } from '../../domain/buildings/building-effects';
import {
  getAvailableLudusGladiatorPlaces,
  getLudusGladiatorCapacity,
} from '../../domain/ludus/capacity';
import { calculateEffectiveReadiness } from '../../domain/planning/readiness';
import type {
  BuildingActionValidation,
  BuildingEffect,
  BuildingEffectType,
  BuildingId,
  GameSave,
} from '../../domain/types';
import { BUILDING_IMPROVEMENTS, BUILDING_POLICIES } from '../../game-data/building-improvements';
import { BUILDING_DEFINITIONS } from '../../game-data/buildings';

type Translate = (key: string, params?: Record<string, string | number>) => string;

export interface BuildingActionEffectPreview {
  currentValue: number | null;
  id: string;
  isPerHour: boolean;
  nextValue: number | null;
  type: BuildingEffectType;
}

export interface BuildingActionPreview {
  currentLevel: number;
  effects: BuildingActionEffectPreview[];
  nextLevel: number;
}

export interface BuildingPanelViewModel {
  action: {
    cost: number;
    isAllowed: boolean;
    kind: 'purchase' | 'upgrade';
    labelKey: string;
    preview: BuildingActionPreview | null;
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

function getEffectPreviewId(effect: BuildingEffect) {
  return [effect.type, effect.target ?? 'default', effect.perHour ? 'perHour' : 'flat'].join('-');
}

function createEffectPreviewMap(effects: BuildingEffect[]) {
  return new Map(effects.map((effect) => [getEffectPreviewId(effect), effect]));
}

function createActionEffectPreviews(
  currentEffects: BuildingEffect[],
  nextEffects: BuildingEffect[],
): BuildingActionEffectPreview[] {
  const currentEffectMap = createEffectPreviewMap(currentEffects);
  const nextEffectMap = createEffectPreviewMap(nextEffects);
  const ids = nextEffects.map(getEffectPreviewId);

  for (const effect of currentEffects) {
    const id = getEffectPreviewId(effect);

    if (!ids.includes(id)) {
      ids.push(id);
    }
  }

  return ids.map((id) => {
    const currentEffect = currentEffectMap.get(id);
    const nextEffect = nextEffectMap.get(id);
    const effect = nextEffect ?? currentEffect;

    if (!effect) {
      throw new Error(`Missing building effect preview for ${id}`);
    }

    return {
      currentValue: currentEffect?.value ?? null,
      id,
      isPerHour: Boolean(effect.perHour),
      nextValue: nextEffect?.value ?? null,
      type: effect.type,
    };
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
  const actionKind = building.isPurchased ? 'upgrade' : 'purchase';
  const targetLevel =
    actionValidation.targetLevel ??
    (building.isPurchased ? building.level + 1 : definition.startsAtLevel || 1);
  const currentLevelDefinition = building.isPurchased
    ? definition.levels.find((level) => level.level === building.level)
    : null;
  const nextLevelDefinition = definition.levels.find((level) => level.level === targetLevel);
  const actionPreview = nextLevelDefinition
    ? {
        currentLevel: building.isPurchased ? building.level : 0,
        effects: createActionEffectPreviews(
          currentLevelDefinition?.effects ?? [],
          nextLevelDefinition.effects,
        ),
        nextLevel: targetLevel,
      }
    : null;

  return {
    action: {
      cost: actionValidation.cost,
      isAllowed: actionValidation.isAllowed,
      kind: actionKind,
      labelKey: building.isPurchased ? 'buildings.upgrade' : 'buildings.purchase',
      preview: actionPreview,
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
  return {
    availableBeds: getAvailableLudusGladiatorPlaces(save),
    capacity: getLudusGladiatorCapacity(save),
    usedBeds: save.gladiators.length,
  };
}
