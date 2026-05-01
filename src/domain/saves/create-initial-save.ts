import { INITIAL_TREASURY } from '../../game-data/economy';
import { GAME_BALANCE } from '../../game-data/balance';
import { createInitialLudusMapState } from '../../game-data/map-layout';
import { PROGRESSION_CONFIG } from '../../game-data/progression';
import { createInitialBuildings } from '../buildings/initial-buildings';
import { updateBuildingEfficiencies } from '../buildings/building-staffing';
import { createInitialEconomyState } from '../economy/economy-actions';
import { createMarketState } from '../market/market-actions';
import { createInitialStaffState, synchronizeStaffAssignments } from '../staff/staff-actions';
import {
  createDefaultWeeklyPlan,
  synchronizeEconomyProjection,
} from '../weekly-simulation/weekly-simulation-actions';
import type { GameSave } from './types';

export interface InitialSaveInput {
  ludusName: string;
  gameId?: string;
  saveId: string;
  createdAt: string;
}

export const CURRENT_SCHEMA_VERSION = 11;

export function createInitialSave(input: InitialSaveInput): GameSave {
  const save: GameSave = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    gameId: input.gameId ?? input.saveId,
    saveId: input.saveId,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    player: {
      ludusName: input.ludusName.trim(),
      isCloudUser: false,
    },
    ludus: {
      treasury: INITIAL_TREASURY,
      reputation: GAME_BALANCE.economy.initialReputation,
      glory: 0,
      security: 50,
      happiness: 65,
      rebellion: 0,
      gameStatus: 'active',
    },
    time: {
      year: PROGRESSION_CONFIG.startingYear,
      week: PROGRESSION_CONFIG.startingWeek,
      dayOfWeek: PROGRESSION_CONFIG.startingDayOfWeek,
      phase: 'planning',
    },
    map: createInitialLudusMapState(),
    buildings: createInitialBuildings(),
    gladiators: [],
    economy: createInitialEconomyState(),
    staff: createInitialStaffState(),
    market: createMarketState(PROGRESSION_CONFIG.startingYear, PROGRESSION_CONFIG.startingWeek),
    arena: {
      resolvedCombats: [],
      isArenaDayActive: false,
    },
    planning: createDefaultWeeklyPlan(
      PROGRESSION_CONFIG.startingYear,
      PROGRESSION_CONFIG.startingWeek,
    ),
    events: {
      pendingEvents: [],
      resolvedEvents: [],
      launchedEvents: [],
    },
  };

  return synchronizeEconomyProjection(
    updateBuildingEfficiencies(synchronizeStaffAssignments(save)),
  );
}
