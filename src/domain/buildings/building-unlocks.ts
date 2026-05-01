import { BUILDING_DEFINITIONS } from '../../game-data/buildings';
import type { GameSave } from '../saves/types';
import type { BuildingId, BuildingLevelDefinition } from './types';

export type BuildingPurchaseAvailabilityStatus = 'purchased' | 'available' | 'locked';

export interface BuildingPurchaseAvailability {
  isPurchased: boolean;
  purchaseCost: number;
  requiredDomusLevel: number;
  status: BuildingPurchaseAvailabilityStatus;
  targetLevel: number;
}

export function getBuildingPurchaseTargetLevel(buildingId: BuildingId): number {
  return BUILDING_DEFINITIONS[buildingId].startsAtLevel || 1;
}

export function findBuildingPurchaseLevelDefinition(
  buildingId: BuildingId,
): BuildingLevelDefinition | undefined {
  const targetLevel = getBuildingPurchaseTargetLevel(buildingId);

  return BUILDING_DEFINITIONS[buildingId].levels.find((level) => level.level === targetLevel);
}

export function getBuildingPurchaseAvailability(
  save: GameSave,
  buildingId: BuildingId,
): BuildingPurchaseAvailability {
  const building = save.buildings[buildingId];
  const targetLevel = getBuildingPurchaseTargetLevel(buildingId);
  const purchaseLevel =
    findBuildingPurchaseLevelDefinition(buildingId) ?? BUILDING_DEFINITIONS[buildingId].levels[0];
  const requiredDomusLevel = purchaseLevel?.requiredDomusLevel ?? 0;
  const isDomusLevelMet = save.buildings.domus.level >= requiredDomusLevel;
  const status = building.isPurchased ? 'purchased' : isDomusLevelMet ? 'available' : 'locked';

  return {
    isPurchased: building.isPurchased,
    purchaseCost: purchaseLevel?.purchaseCost ?? 0,
    requiredDomusLevel,
    status,
    targetLevel,
  };
}
