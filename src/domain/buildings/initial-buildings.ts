import {
  BUILDING_DEFINITIONS,
  BUILDING_IDS,
  INITIAL_BUILDING_CONFIGURATIONS,
  INITIAL_BUILDING_POLICY_IDS,
} from '../../game-data/buildings';
import { cloneJson } from '../../utils/clone';
import type { BuildingId, BuildingState } from './types';

export function createInitialBuildings(): Record<BuildingId, BuildingState> {
  const buildings = {} as Record<BuildingId, BuildingState>;

  for (const buildingId of BUILDING_IDS) {
    const definition = BUILDING_DEFINITIONS[buildingId];
    const configuration = INITIAL_BUILDING_CONFIGURATIONS[buildingId];
    const selectedPolicyId = INITIAL_BUILDING_POLICY_IDS[buildingId];

    buildings[buildingId] = {
      id: buildingId,
      isPurchased: definition.startsPurchased,
      level: definition.startsAtLevel,
      efficiency: definition.startsPurchased ? 100 : 0,
      purchasedImprovementIds: [],
      purchasedSkillIds: [],
      staffAssignmentIds: [],
    };

    if (configuration) {
      buildings[buildingId].configuration = cloneJson(configuration);
    }

    if (selectedPolicyId) {
      buildings[buildingId].selectedPolicyId = selectedPolicyId;
    }
  }

  return buildings;
}
