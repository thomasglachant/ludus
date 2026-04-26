import { createWeeklyContracts } from '../../domain/contracts/contract-actions';
import { synchronizePlanning } from '../../domain/planning/planning-actions';
import { CURRENT_SCHEMA_VERSION } from '../../domain/saves/create-initial-save';
import { getGladiatorVisualIdentity } from '../gladiator-visuals';
import type {
  ArenaRank,
  BettingOdds,
  BuildingId,
  BuildingState,
  CombatStrategy,
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
  combatStrategy?: CombatStrategy;
};

interface DemoSaveInput {
  id: DemoSaveId;
  ownerName: string;
  ludusName: string;
  language?: GameSave['settings']['language'];
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
  const gladiators = input.gladiators.map<Gladiator>((gladiator) => ({
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
    currentBuildingId: gladiator.currentBuildingId,
    currentActivityId: gladiator.currentActivityId,
    trainingPlan: gladiator.trainingPlan,
    visualIdentity: getGladiatorVisualIdentity(gladiator.id, gladiator.visualIdentity),
  }));
  const routines = input.gladiators.map<GladiatorRoutine>((gladiator) => ({
    gladiatorId: gladiator.id,
    objective: gladiator.weeklyObjective,
    intensity: gladiator.intensity ?? 'normal',
    allowAutomaticAssignment: true,
    combatStrategy: gladiator.combatStrategy ?? 'balanced',
  }));
  const marketGladiators = input.market.map(createMarketGladiator);
  const baseSave: GameSave = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    saveId: input.id,
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_UPDATED_AT,
    player: {
      ownerName: input.ownerName,
      ludusName: input.ludusName,
      isCloudUser: false,
    },
    settings: {
      language: input.language ?? 'en',
    },
    ludus: input.ludus,
    time: input.time,
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
    contracts: {
      availableContracts: createWeeklyContracts(input.time.year, input.time.week),
      acceptedContracts: [],
    },
    events: {
      pendingEvents: [],
      resolvedEvents: [],
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
