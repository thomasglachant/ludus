import { BUILDING_IMPROVEMENTS, BUILDING_POLICIES } from '../../game-data/building-improvements';
import { BUILDING_SKILLS } from '../../game-data/building-skills';
import { BUILDING_DEFINITIONS } from '../../game-data/buildings';
import type { GameSave } from '../saves/types';
import type { BuildingEffect, BuildingId } from './types';

interface BuildingEffectFilter {
  target?: BuildingEffect['target'];
  type?: BuildingEffect['type'];
}

function matchesFilter(effect: BuildingEffect, filter: BuildingEffectFilter = {}) {
  const target = effect.target ?? 'plannedGladiators';

  if (filter.target && target !== filter.target) {
    return false;
  }

  if (filter.type && effect.type !== filter.type) {
    return false;
  }

  return true;
}

function sumEffectValues(effects: BuildingEffect[]) {
  return effects.reduce((total, effect) => total + effect.value, 0);
}

export function getCurrentBuildingLevelEffects(save: GameSave, buildingId: BuildingId) {
  const building = save.buildings[buildingId];

  if (!building.isPurchased || building.level <= 0) {
    return [];
  }

  const levelDefinitions = BUILDING_DEFINITIONS[buildingId].levels;
  const levelDefinition =
    levelDefinitions.find((level) => level.level === building.level) ??
    levelDefinitions
      .filter((level) => level.level <= building.level)
      .sort((left, right) => right.level - left.level)[0];

  return levelDefinition?.effects ?? [];
}

export function getPurchasedBuildingImprovementEffects(save: GameSave, buildingId: BuildingId) {
  const building = save.buildings[buildingId];

  if (!building.isPurchased) {
    return [];
  }

  return BUILDING_IMPROVEMENTS.filter(
    (improvement) =>
      improvement.buildingId === buildingId &&
      building.purchasedImprovementIds.includes(improvement.id),
  ).flatMap((improvement) => improvement.effects);
}

export function getSelectedBuildingPolicyEffects(save: GameSave, buildingId: BuildingId) {
  const building = save.buildings[buildingId];

  if (!building.isPurchased || !building.selectedPolicyId) {
    return [];
  }

  return (
    BUILDING_POLICIES.find(
      (policy) =>
        policy.buildingId === buildingId &&
        policy.id === building.selectedPolicyId &&
        policy.requiredBuildingLevel <= building.level,
    )?.effects ?? []
  );
}

export function getPurchasedBuildingSkillEffects(save: GameSave, buildingId: BuildingId) {
  const building = save.buildings[buildingId];

  if (!building.isPurchased) {
    return [];
  }

  return BUILDING_SKILLS.filter(
    (skill) => skill.buildingId === buildingId && building.purchasedSkillIds.includes(skill.id),
  ).flatMap((skill) => skill.effects);
}

export function getActiveBuildingEffects(
  save: GameSave,
  buildingId: BuildingId,
  filter: BuildingEffectFilter = {},
) {
  return [
    ...getCurrentBuildingLevelEffects(save, buildingId),
    ...getPurchasedBuildingImprovementEffects(save, buildingId),
    ...getSelectedBuildingPolicyEffects(save, buildingId),
    ...getPurchasedBuildingSkillEffects(save, buildingId),
  ].filter((effect) => matchesFilter(effect, filter));
}

export function sumActiveBuildingEffectValues(save: GameSave, filter: BuildingEffectFilter = {}) {
  return Object.values(save.buildings).reduce((total, building) => {
    return (
      total +
      getActiveBuildingEffects(save, building.id, filter).reduce(
        (buildingTotal, effect) => buildingTotal + effect.value,
        0,
      )
    );
  }, 0);
}

export function getPurchasedDormitoryImprovementCapacityBonus(save: GameSave) {
  return sumEffectValues(
    getPurchasedBuildingImprovementEffects(save, 'dormitory').filter((effect) =>
      matchesFilter(effect, {
        target: 'ludus',
        type: 'increaseCapacity',
      }),
    ),
  );
}

export function getGlobalGladiatorInjuryRiskReduction(save: GameSave) {
  const globalEffects = Object.values(save.buildings).flatMap((building) =>
    getActiveBuildingEffects(save, building.id, {
      target: 'allGladiators',
      type: 'reduceInjuryRisk',
    }),
  );

  return sumEffectValues(globalEffects);
}
