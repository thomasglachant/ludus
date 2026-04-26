export const BUILDING_UPGRADE_COST_CONFIG = {
  baseCost: 150,
  growthFactor: 2.2,
} as const;

export const LUDUS_CAPACITY_CONFIG = {
  minimumGladiators: 1,
  maximumGladiators: 6,
} as const;

export function calculateBuildingUpgradeCost(targetLevel: number) {
  return Math.round(
    BUILDING_UPGRADE_COST_CONFIG.baseCost *
      BUILDING_UPGRADE_COST_CONFIG.growthFactor ** (targetLevel - 1),
  );
}
