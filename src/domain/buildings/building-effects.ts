import { BUILDING_IMPROVEMENTS, BUILDING_POLICIES } from '../../game-data/building-improvements';
import { BUILDING_DEFINITIONS } from '../../game-data/buildings';
import type { Gladiator } from '../gladiators/types';
import type { GameSave } from '../saves/types';
import type { BuildingEffect, BuildingId } from './types';

interface BuildingEffectFilter {
  includeHourly?: boolean;
  includeNonHourly?: boolean;
  target?: BuildingEffect['target'];
  type?: BuildingEffect['type'];
}

function matchesFilter(effect: BuildingEffect, filter: BuildingEffectFilter = {}) {
  const includeHourly = filter.includeHourly ?? true;
  const includeNonHourly = filter.includeNonHourly ?? true;
  const target = effect.target ?? 'assignedGladiator';

  if (effect.perHour && !includeHourly) {
    return false;
  }

  if (!effect.perHour && !includeNonHourly) {
    return false;
  }

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

  return (
    BUILDING_DEFINITIONS[buildingId].levels.find((level) => level.level === building.level)
      ?.effects ?? []
  );
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

export function getActiveBuildingEffects(
  save: GameSave,
  buildingId: BuildingId,
  filter: BuildingEffectFilter = {},
) {
  return [
    ...getCurrentBuildingLevelEffects(save, buildingId),
    ...getPurchasedBuildingImprovementEffects(save, buildingId),
    ...getSelectedBuildingPolicyEffects(save, buildingId),
  ].filter((effect) => matchesFilter(effect, filter));
}

export function getHourlyBuildingEffects(save: GameSave, buildingId: BuildingId) {
  return getActiveBuildingEffects(save, buildingId, {
    includeHourly: true,
    includeNonHourly: false,
  });
}

export function getPurchasedDormitoryImprovementCapacityBonus(save: GameSave) {
  return sumEffectValues(
    getPurchasedBuildingImprovementEffects(save, 'dormitory').filter((effect) =>
      matchesFilter(effect, {
        includeHourly: false,
        includeNonHourly: true,
        target: 'ludus',
        type: 'increaseCapacity',
      }),
    ),
  );
}

export function getGladiatorReadinessEffectBonus(save: GameSave, gladiator: Gladiator) {
  const assignedBuildingEffects = gladiator.currentBuildingId
    ? getActiveBuildingEffects(save, gladiator.currentBuildingId, {
        includeHourly: false,
        includeNonHourly: true,
        target: 'assignedGladiator',
        type: 'increaseReadiness',
      })
    : [];
  const globalEffects = Object.values(save.buildings).flatMap((building) =>
    getActiveBuildingEffects(save, building.id, {
      includeHourly: false,
      includeNonHourly: true,
      target: 'allGladiators',
      type: 'increaseReadiness',
    }),
  );

  return sumEffectValues([...assignedBuildingEffects, ...globalEffects]);
}

export function getGladiatorInjuryRiskReduction(save: GameSave, gladiator: Gladiator) {
  const assignedBuildingEffects = gladiator.currentBuildingId
    ? getActiveBuildingEffects(save, gladiator.currentBuildingId, {
        includeHourly: false,
        includeNonHourly: true,
        target: 'assignedGladiator',
        type: 'reduceInjuryRisk',
      })
    : [];
  const globalEffects = Object.values(save.buildings).flatMap((building) =>
    getActiveBuildingEffects(save, building.id, {
      includeHourly: false,
      includeNonHourly: true,
      target: 'allGladiators',
      type: 'reduceInjuryRisk',
    }),
  );

  return sumEffectValues([...assignedBuildingEffects, ...globalEffects]);
}
