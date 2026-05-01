import { GAME_BALANCE } from './balance';

export const BUILDING_UPGRADE_COST_CONFIG = {
  baseCost: GAME_BALANCE.buildings.upgradeCost.baseCost,
  growthFactor: GAME_BALANCE.buildings.upgradeCost.growthFactor,
} as const;

export const LUDUS_CAPACITY_CONFIG = {
  minimumGladiators: GAME_BALANCE.buildings.capacity.minimumGladiators,
  maximumGladiators: GAME_BALANCE.buildings.capacity.maximumGladiators,
  minimumStaff: GAME_BALANCE.buildings.capacity.minimumStaff,
  maximumStaff: GAME_BALANCE.buildings.capacity.maximumStaff,
  staffPerDomusLevel: GAME_BALANCE.buildings.capacity.staffPerDomusLevel,
} as const;

export function calculateBuildingUpgradeCost(targetLevel: number) {
  return Math.round(
    BUILDING_UPGRADE_COST_CONFIG.baseCost *
      BUILDING_UPGRADE_COST_CONFIG.growthFactor ** (targetLevel - 1),
  );
}
