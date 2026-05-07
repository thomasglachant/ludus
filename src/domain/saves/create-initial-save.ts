import { INITIAL_TREASURY, TREASURY_CONFIG } from '../../game-data/economy/treasury';
import { GAME_TIME_CONFIG } from '../../game-data/time';
import { refreshGameAlerts } from '../alerts/alert-actions';
import { createInitialBuildings } from '../buildings/initial-buildings';
import { createInitialEconomyState } from '../economy/economy-actions';
import { normalizeGladiatorProgression } from '../gladiators/progression';
import { createMarketState } from '../market/market-actions';
import {
  createDefaultWeeklyPlan,
  synchronizeEconomyProjection,
} from '../weekly-simulation/weekly-simulation-actions';
import { synchronizePlanning } from '../planning/planning-actions';
import type { GameSave } from './types';

export interface InitialSaveInput {
  ludusName: string;
  gameId?: string;
  saveId: string;
  createdAt: string;
}

export const CURRENT_SCHEMA_VERSION = 20;

export function createInitialSave(input: InitialSaveInput): GameSave {
  const market = createMarketState(GAME_TIME_CONFIG.startingYear, GAME_TIME_CONFIG.startingWeek);
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
      reputation: TREASURY_CONFIG.initialReputation,
      happiness: 65,
      rebellion: 0,
      gameStatus: 'active',
    },
    time: {
      year: GAME_TIME_CONFIG.startingYear,
      week: GAME_TIME_CONFIG.startingWeek,
      dayOfWeek: GAME_TIME_CONFIG.startingDayOfWeek,
      phase: 'planning',
      pendingActionTrigger: 'startWeek',
    },
    buildings: createInitialBuildings(),
    gladiators: [],
    economy: createInitialEconomyState(),
    market: {
      ...market,
      availableGladiators: market.availableGladiators.map(normalizeGladiatorProgression),
    },
    arena: {
      resolvedCombats: [],
      isArenaDayActive: false,
    },
    planning: createDefaultWeeklyPlan(GAME_TIME_CONFIG.startingYear, GAME_TIME_CONFIG.startingWeek),
    events: {
      pendingEvents: [],
      resolvedEvents: [],
      launchedEvents: [],
    },
    notifications: [],
  };

  return refreshGameAlerts(synchronizeEconomyProjection(synchronizePlanning(save)));
}
