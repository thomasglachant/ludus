import { INITIAL_TREASURY } from '../../game-data/economy';
import { PROGRESSION_CONFIG } from '../../game-data/progression';
import type { LanguageCode } from '../common/types';
import { createInitialBuildings } from '../buildings/initial-buildings';
import { createWeeklyContracts } from '../contracts/contract-actions';
import { createMarketState } from '../market/market-actions';
import type { GameSave } from './types';

export interface InitialSaveInput {
  ownerName: string;
  ludusName: string;
  language: LanguageCode;
  saveId: string;
  createdAt: string;
}

export const CURRENT_SCHEMA_VERSION = 1;

export function createInitialSave(input: InitialSaveInput): GameSave {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    saveId: input.saveId,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    player: {
      ownerName: input.ownerName.trim(),
      ludusName: input.ludusName.trim(),
      isCloudUser: false,
    },
    settings: {
      language: input.language,
    },
    ludus: {
      treasury: INITIAL_TREASURY,
      reputation: 0,
    },
    time: {
      year: PROGRESSION_CONFIG.startingYear,
      week: PROGRESSION_CONFIG.startingWeek,
      dayOfWeek: 'monday',
      hour: PROGRESSION_CONFIG.startingHour,
      minute: PROGRESSION_CONFIG.startingMinute,
      speed: 1,
      isPaused: false,
    },
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
