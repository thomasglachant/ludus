import { refreshGameAlerts } from '../../domain/alerts/alert-actions';
import { synchronizePlanning } from '../../domain/planning/planning-actions';
import { CURRENT_SCHEMA_VERSION } from '../../domain/saves/create-initial-save';
import { createInitialBuildings } from '../../domain/buildings/initial-buildings';
import { createInitialEconomyState } from '../../domain/economy/economy-actions';
import { normalizeGladiatorProgression } from '../../domain/gladiators/progression';
import { calculateGladiatorMarketPrice } from '../../domain/market/market-actions';
import {
  createDefaultWeeklyPlan,
  synchronizeEconomyProjection,
} from '../../domain/weekly-simulation/weekly-simulation-actions';
import { getGladiatorVisualIdentity } from '../gladiator-visuals';
import type {
  BuildingId,
  BuildingState,
  DemoSaveId,
  GameSave,
  Gladiator,
  GladiatorTrait,
  GladiatorTraitId,
  MarketGladiator,
} from '../../domain/types';

export const DEMO_CREATED_AT = '2026-01-01T00:00:00.000Z';
export const DEMO_UPDATED_AT = '2026-01-01T00:00:00.000Z';

export type DemoGladiatorInput = Omit<Gladiator, 'experience' | 'traits'> &
  Partial<Pick<Gladiator, 'experience'>> & {
    traits: Array<GladiatorTraitId | GladiatorTrait>;
  };
type DemoMarketGladiatorInput = DemoGladiatorInput & { price: number };

interface DemoSaveInput {
  id: DemoSaveId;
  ludusName: string;
  ludus: Pick<GameSave['ludus'], 'treasury' | 'reputation'> & Partial<GameSave['ludus']>;
  time: Pick<GameSave['time'], 'year' | 'week' | 'dayOfWeek'> & Partial<GameSave['time']>;
  buildings: Partial<Record<BuildingId, BuildingState>>;
  gladiators: DemoGladiatorInput[];
  market: DemoMarketGladiatorInput[];
}

function createDemoTraits(traits: Array<GladiatorTraitId | GladiatorTrait>): GladiatorTrait[] {
  return traits.map((trait) => (typeof trait === 'string' ? { traitId: trait } : trait));
}

export function createPurchasedBuilding(
  building: Pick<BuildingState, 'id' | 'level'> &
    Partial<Omit<BuildingState, 'id' | 'isPurchased' | 'level'>>,
): BuildingState {
  return {
    ...building,
    isPurchased: true,
    purchasedImprovementIds: building.purchasedImprovementIds ?? [],
    purchasedSkillIds: building.purchasedSkillIds ?? [],
  };
}

function createDemoGladiator(gladiator: DemoGladiatorInput): Gladiator {
  const normalizedGladiator = normalizeGladiatorProgression({
    id: gladiator.id,
    name: gladiator.name,
    age: gladiator.age,
    strength: gladiator.strength,
    agility: gladiator.agility,
    defense: gladiator.defense,
    life: gladiator.life,
    experience: gladiator.experience ?? 0,
    reputation: gladiator.reputation,
    wins: gladiator.wins,
    losses: gladiator.losses,
    traits: createDemoTraits(gladiator.traits),
    visualIdentity: gladiator.visualIdentity,
  });
  const skillProfile = {
    strength: normalizedGladiator.strength,
    agility: normalizedGladiator.agility,
    defense: normalizedGladiator.defense,
    life: normalizedGladiator.life,
  };

  return {
    ...normalizedGladiator,
    visualIdentity: getGladiatorVisualIdentity(gladiator.id, gladiator.visualIdentity, {
      skillProfile,
    }),
  };
}

export function createDemoSave(input: DemoSaveInput): GameSave {
  const gladiators = input.gladiators.map<Gladiator>(createDemoGladiator);
  const marketGladiators = input.market.map(createMarketGladiator);
  const time: GameSave['time'] = {
    phase: 'planning',
    ...input.time,
  };
  const buildings = {
    ...createInitialBuildings(),
    ...input.buildings,
  };
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
    ludus: {
      happiness: 65,
      rebellion: 0,
      gameStatus: 'active',
      ...input.ludus,
    },
    time,
    buildings,
    gladiators,
    economy: createInitialEconomyState(),
    market: {
      year: time.year,
      week: time.week,
      availableGladiators: marketGladiators,
    },
    arena: {
      resolvedCombats: [],
      isArenaDayActive: false,
    },
    planning: createDefaultWeeklyPlan(time.year, time.week),
    events: {
      pendingEvents: [],
      resolvedEvents: [],
      launchedEvents: [],
    },
    notifications: [],
    metadata: {
      demoSaveId: input.id,
    },
  };

  return refreshGameAlerts(synchronizeEconomyProjection(synchronizePlanning(baseSave)));
}

export function createMarketGladiator(gladiator: DemoMarketGladiatorInput): MarketGladiator {
  const normalizedGladiator = createDemoGladiator(gladiator);

  return {
    ...normalizedGladiator,
    price: calculateGladiatorMarketPrice(normalizedGladiator),
  };
}
