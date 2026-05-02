import {
  validateBuildingImprovementPurchase,
  validateBuildingPolicySelection,
  validateBuildingPurchase,
  validateBuildingSkillPurchase,
  validateBuildingUpgrade,
} from '../../domain/buildings/building-actions';
import { getActiveBuildingEffects } from '../../domain/buildings/building-effects';
import {
  getAvailableLudusGladiatorPlaces,
  getLudusGladiatorCapacity,
} from '../../domain/ludus/capacity';
import type {
  BuildingActionValidation,
  BuildingEffect,
  BuildingEffectType,
  BuildingId,
  GameSave,
} from '../../domain/types';
import { getBuildingActivityDefinitions } from '../../game-data/building-activities';
import { BUILDING_IMPROVEMENTS, BUILDING_POLICIES } from '../../game-data/building-improvements';
import { BUILDING_SKILLS } from '../../game-data/building-skills';
import { BUILDING_DEFINITIONS } from '../../game-data/buildings';

type Translate = (key: string, params?: Record<string, string | number>) => string;

export interface BuildingActionEffectPreview {
  currentValue: number | null;
  id: string;
  nextValue: number | null;
  type: BuildingEffectType;
}

export interface BuildingActionPreview {
  currentLevel: number;
  effects: BuildingActionEffectPreview[];
  nextLevel: number;
}

export interface BuildingPanelUnlockedActivityViewModel {
  id: string;
  name: string;
}

export interface BuildingPanelActivityViewModel extends BuildingPanelUnlockedActivityViewModel {
  description: string;
  isUnlocked: boolean;
  requiredBuildingLevel: number;
  sourceSkillName: string;
  tier: number;
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
  skills: {
    actionLabelKey: string;
    canPurchase: boolean;
    cost: number;
    descriptionKey: string;
    effects: string[];
    id: string;
    isPurchased: boolean;
    name: string;
    nameKey: string;
    requiredBuildingLevel: number;
    requiredSkillNames: string[];
    tier: number;
    unlockedActivities: BuildingPanelUnlockedActivityViewModel[];
    validationMessageKey: string | null;
    validationMessageParams: Record<string, string | number>;
  }[];
  activities: BuildingPanelActivityViewModel[];
}

export interface LudusCapacityViewModel {
  availablePlaces: number;
  capacity: number;
  usedPlaces: number;
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
        : validation.missingSkillIds && validation.missingSkillIds.length > 0
          ? validation.missingSkillIds.join(', ')
          : '',
  };
}

function formatBuildingEffects(effects: BuildingEffect[], t: Translate) {
  if (effects.length === 0) {
    return [t('buildings.noActiveEffects')];
  }

  return effects.map((effect) => {
    return t(`buildingEffects.${effect.type}`, { value: effect.value });
  });
}

function getEffectPreviewId(effect: BuildingEffect) {
  return [effect.type, effect.target ?? 'default'].join('-');
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
      nextValue: nextEffect?.value ?? null,
      type: effect.type,
    };
  });
}

function formatSkillName(skill: { name: string; nameKey: string }, t: Translate): string {
  return t(skill.nameKey, { name: skill.name });
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
  const buildingSkills = BUILDING_SKILLS.filter((skill) => skill.buildingId === buildingId);
  const buildingActivities = getBuildingActivityDefinitions(buildingId);
  const getActivityLabel = (activityId: string, sourceSkillName: string) => {
    const activityDefinition = buildingActivities.find((activity) => activity.id === activityId);

    return {
      description: activityDefinition
        ? t(activityDefinition.descriptionKey)
        : t('buildingPanel.activityDescription', { skill: sourceSkillName }),
      name: activityDefinition
        ? t(activityDefinition.nameKey)
        : t('buildingPanel.activityName', { skill: sourceSkillName }),
    };
  };
  const activities = buildingSkills.flatMap((skill) => {
    const sourceSkillName = formatSkillName(skill, t);

    return (skill.unlockedActivities ?? []).map((activityId) => {
      const activityLabel = getActivityLabel(activityId, sourceSkillName);

      return {
        description: activityLabel.description,
        id: activityId,
        isUnlocked: building.purchasedSkillIds.includes(skill.id),
        name: activityLabel.name,
        requiredBuildingLevel: skill.requiredBuildingLevel,
        sourceSkillName,
        tier: skill.tier,
      };
    });
  });

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
    skills: buildingSkills.map((skill) => {
      const validation = validateBuildingSkillPurchase(save, buildingId, skill.id);
      const isPurchased = building.purchasedSkillIds.includes(skill.id);
      const requiredSkillNames = (skill.requiredSkillIds ?? []).map((requiredSkillId) => {
        const requiredSkill = buildingSkills.find((candidate) => candidate.id === requiredSkillId);

        return requiredSkill ? formatSkillName(requiredSkill, t) : requiredSkillId;
      });

      return {
        actionLabelKey: isPurchased ? 'common.purchased' : 'buildingPanel.purchaseSkill',
        canPurchase: validation.isAllowed,
        cost: skill.cost,
        descriptionKey: skill.descriptionKey,
        effects: formatBuildingEffects(skill.effects, t),
        id: skill.id,
        isPurchased,
        name: skill.name,
        nameKey: skill.nameKey,
        requiredBuildingLevel: skill.requiredBuildingLevel,
        requiredSkillNames,
        tier: skill.tier,
        unlockedActivities: (skill.unlockedActivities ?? []).map((activityId) => {
          const activityLabel = getActivityLabel(activityId, formatSkillName(skill, t));

          return {
            id: activityId,
            name: activityLabel.name,
          };
        }),
        validationMessageKey: getBuildingActionMessageKey(validation),
        validationMessageParams: {
          ...getBuildingActionMessageParams(validation),
          missing: requiredSkillNames.join(', '),
        },
      };
    }),
    activities,
  };
}

export function createLudusCapacityViewModel(save: GameSave): LudusCapacityViewModel {
  return {
    availablePlaces: getAvailableLudusGladiatorPlaces(save),
    capacity: getLudusGladiatorCapacity(save),
    usedPlaces: save.gladiators.length,
  };
}
