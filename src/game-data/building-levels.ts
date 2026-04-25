export const BUILDING_UPGRADE_COST_CONFIG = {
  baseCost: 150,
  growthFactor: 2.2,
} as const;

export const DORMITORY_BED_CONFIG = {
  freeBedsAtLevelOne: 1,
  purchasableBedsPerLevel: 2,
  baseBedCost: 80,
  bedCostGrowthFactor: 1.4,
} as const;

export function calculateBuildingUpgradeCost(targetLevel: number) {
  return Math.round(
    BUILDING_UPGRADE_COST_CONFIG.baseCost *
      BUILDING_UPGRADE_COST_CONFIG.growthFactor ** (targetLevel - 1),
  );
}

export function calculateDormitoryBedCost(purchasedBeds: number) {
  return Math.round(
    DORMITORY_BED_CONFIG.baseBedCost * DORMITORY_BED_CONFIG.bedCostGrowthFactor ** purchasedBeds,
  );
}
