import { INITIAL_TREASURY } from '../../game-data/economy';
import { GAME_BALANCE } from '../../game-data/balance';
import { createInitialLudusMapState } from '../../game-data/map-layout';
import { PROGRESSION_CONFIG } from '../../game-data/progression';
import { createInitialBuildings } from '../buildings/initial-buildings';
import { createWeeklyContracts } from '../contracts/contract-actions';
import { createMarketState } from '../market/market-actions';
import type { GameSave } from './types';

export interface InitialSaveInput {
  ludusName: string;
  gameId?: string;
  saveId: string;
  createdAt: string;
}

export const CURRENT_SCHEMA_VERSION = 5;

export function createInitialSave(input: InitialSaveInput): GameSave {
  return {
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
    },
    time: {
      year: PROGRESSION_CONFIG.startingYear,
      week: PROGRESSION_CONFIG.startingWeek,
      dayOfWeek: PROGRESSION_CONFIG.startingDayOfWeek,
      hour: PROGRESSION_CONFIG.startingHour,
      minute: PROGRESSION_CONFIG.startingMinute,
      speed: PROGRESSION_CONFIG.initialSpeed,
      isPaused: PROGRESSION_CONFIG.initialIsPaused,
    },
    map: createInitialLudusMapState(),
    buildings: createInitialBuildings(),
    gladiators: [],
    market: createMarketState(PROGRESSION_CONFIG.startingYear, PROGRESSION_CONFIG.startingWeek),
    arena: {
      pendingCombats: [],
      resolvedCombats: [],
      isArenaDayActive: false,
      betting: {
        year: PROGRESSION_CONFIG.startingYear,
        week: PROGRESSION_CONFIG.startingWeek,
        odds: [],
        scoutingReports: [],
        areBetsLocked: false,
      },
    },
    planning: {
      week: PROGRESSION_CONFIG.startingWeek,
      year: PROGRESSION_CONFIG.startingYear,
      routines: [],
      alerts: [],
    },
    contracts: {
      availableContracts: createWeeklyContracts(
        PROGRESSION_CONFIG.startingYear,
        PROGRESSION_CONFIG.startingWeek,
      ),
      acceptedContracts: [],
    },
    events: {
      pendingEvents: [],
      resolvedEvents: [],
    },
  };
}
