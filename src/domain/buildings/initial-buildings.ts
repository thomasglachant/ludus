import { INITIAL_BUILDING_STATES } from '../../game-data/buildings';
import type { BuildingId, BuildingState } from './types';
import { cloneJson } from '../../utils/clone';

export function createInitialBuildings(): Record<BuildingId, BuildingState> {
  return cloneJson(INITIAL_BUILDING_STATES);
}
