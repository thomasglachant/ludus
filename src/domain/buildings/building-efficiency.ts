import { BUILDING_IDS } from '../../game-data/buildings';
import type { GameSave } from '../saves/types';
import type { BuildingId } from './types';

export function calculateBuildingEfficiency(save: GameSave, buildingId: BuildingId) {
  return save.buildings[buildingId].isPurchased ? 1 : 0;
}

export function updateBuildingEfficiencies(save: GameSave): GameSave {
  return {
    ...save,
    buildings: {
      ...save.buildings,
      ...Object.fromEntries(
        BUILDING_IDS.map((buildingId) => [
          buildingId,
          {
            ...save.buildings[buildingId],
            efficiency: Math.round(calculateBuildingEfficiency(save, buildingId) * 100),
          },
        ]),
      ),
    },
  };
}
