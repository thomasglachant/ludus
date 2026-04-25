export const INITIAL_TREASURY = 500;

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
