import { synchronizePlanning } from '../../domain/planning/planning-actions';
import { CURRENT_SCHEMA_VERSION } from '../../domain/saves/create-initial-save';
import { createInitialLudusMapState } from '../map-layout';
import { getGladiatorVisualIdentity } from '../gladiator-visuals';
import type {
  ArenaRank,
  BettingOdds,
  BuildingId,
  BuildingState,
  DemoSaveId,
  GameSave,
  Gladiator,
  GladiatorRoutine,
  MarketGladiator,
} from '../../domain/types';

export const DEMO_CREATED_AT = '2026-01-01T00:00:00.000Z';
export const DEMO_UPDATED_AT = '2026-01-01T00:00:00.000Z';

export type DemoGladiatorInput = Gladiator & {
  weeklyObjective: GladiatorRoutine['objective'];
  intensity?: GladiatorRoutine['intensity'];
};

interface DemoSaveInput {
  id: DemoSaveId;
  ludusName: string;
  ludus: GameSave['ludus'];
  time: GameSave['time'];
  buildings: Record<BuildingId, BuildingState>;
  gladiators: DemoGladiatorInput[];
  market: MarketGladiator[];
  bettingOdds?: BettingOdds[];
}

export function createPurchasedBuilding(
  building: Omit<BuildingState, 'isPurchased' | 'purchasedImprovementIds'> & {
    purchasedImprovementIds?: string[];
  },
): BuildingState {
  return {
    ...building,
    isPurchased: true,
    purchasedImprovementIds: building.purchasedImprovementIds ?? [],
  };
}

export function createDemoSave(input: DemoSaveInput): GameSave {
  const gladiators = input.gladiators.map<Gladiator>((gladiator) => {
    return {
      id: gladiator.id,
      name: gladiator.name,
      age: gladiator.age,
      strength: gladiator.strength,
      agility: gladiator.agility,
      defense: gladiator.defense,
      energy: gladiator.energy,
      health: gladiator.health,
      morale: gladiator.morale,
      satiety: gladiator.satiety,
      reputation: gladiator.reputation,
      wins: gladiator.wins,
      losses: gladiator.losses,
      traits: gladiator.traits,
      currentLocationId: gladiator.currentLocationId ?? gladiator.currentBuildingId,
      currentBuildingId: gladiator.currentBuildingId,
      currentActivityId: gladiator.currentActivityId,
      currentTaskStartedAt: gladiator.currentTaskStartedAt,
      trainingPlan: gladiator.trainingPlan,
      visualIdentity: getGladiatorVisualIdentity(gladiator.id, gladiator.visualIdentity),
    };
  });
  const routines = input.gladiators.map<GladiatorRoutine>((gladiator) => ({
    gladiatorId: gladiator.id,
    objective: gladiator.weeklyObjective,
    intensity: gladiator.intensity ?? 'normal',
    allowAutomaticAssignment: true,
  }));
  const marketGladiators = input.market.map(createMarketGladiator);
  const baseSave: GameSave = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    gameId: input.id,
    saveId: input.id,
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_UPDATED_AT,
    player: {
      ludusName: input.ludusName,
      isCloudUser: false,
    },
    ludus: input.ludus,
    time: input.time,
    map: createInitialLudusMapState(),
    buildings: input.buildings,
    gladiators,
    market: {
      year: input.time.year,
      week: input.time.week,
      availableGladiators: marketGladiators,
    },
    arena: {
      pendingCombats: [],
      resolvedCombats: [],
      isArenaDayActive: false,
      betting: {
        year: input.time.year,
        week: input.time.week,
        odds: input.bettingOdds ?? [],
        scoutingReports: [],
        areBetsLocked: input.time.dayOfWeek === 'saturday' || input.time.dayOfWeek === 'sunday',
      },
    },
    planning: {
      year: input.time.year,
      week: input.time.week,
      routines,
      alerts: [],
    },
    events: {
      pendingEvents: [],
      resolvedEvents: [],
      launchedEvents: [],
    },
    metadata: {
      demoSaveId: input.id,
    },
  };

  return synchronizePlanning(baseSave, DEMO_UPDATED_AT);
}

export function createMarketGladiator(gladiator: Gladiator & { price: number }): MarketGladiator {
  return {
    ...gladiator,
    health: 100,
    energy: 100,
    morale: 100,
    visualIdentity: getGladiatorVisualIdentity(gladiator.id, gladiator.visualIdentity),
  };
}

export function createBettingOdds(input: {
  year: number;
  week: number;
  gladiatorId: string;
  opponent: Gladiator;
  rank: ArenaRank;
  playerWinChance: number;
  playerDecimalOdds: number;
  opponentDecimalOdds: number;
  createdAtDay: BettingOdds['createdAtDay'];
}): BettingOdds {
  return {
    id: `odds-${input.year}-${input.week}-${input.gladiatorId}`,
    gladiatorId: input.gladiatorId,
    opponent: {
      ...input.opponent,
      visualIdentity: getGladiatorVisualIdentity(input.opponent.id, input.opponent.visualIdentity),
    },
    rank: input.rank,
    playerWinChance: input.playerWinChance,
    playerDecimalOdds: input.playerDecimalOdds,
    opponentDecimalOdds: input.opponentDecimalOdds,
    isScouted: false,
    createdAtDay: input.createdAtDay,
  };
}
