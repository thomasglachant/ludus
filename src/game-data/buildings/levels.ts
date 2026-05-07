import { BUILDING_IMPROVEMENTS } from './improvements';

export const BUILDING_UPGRADE_COST_CONFIG = {
  // Base denarii cost used by the generic building upgrade formula.
  baseCost: 150,
  // Exponential multiplier applied for each target level above level 1.
  growthFactor: 2.2,
} as const;

export const LUDUS_CAPACITY_CONFIG = {
  // Minimum owned gladiator capacity when Dormitory is available.
  minimumGladiators: 1,
  // Maximum owned gladiator capacity granted by Dormitory improvements.
  maximumGladiators: 6,
} as const;

export function calculateBuildingUpgradeCost(targetLevel: number) {
  return Math.round(
    BUILDING_UPGRADE_COST_CONFIG.baseCost *
      BUILDING_UPGRADE_COST_CONFIG.growthFactor ** (targetLevel - 1),
  );
}

export const DORMITORY_CAPACITY_IMPROVEMENT_COSTS = BUILDING_IMPROVEMENTS.filter((improvement) =>
  improvement.effects.some((effect) => effect.type === 'increaseCapacity'),
).map((improvement) => improvement.cost);
