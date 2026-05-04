import { synchronizePlanning } from '../../domain/planning/planning-actions';
import { CURRENT_SCHEMA_VERSION } from '../../domain/saves/create-initial-save';
import { createInitialBuildings } from '../../domain/buildings/initial-buildings';
import { createInitialEconomyState } from '../../domain/economy/economy-actions';
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
  MarketGladiator,
} from '../../domain/types';

export const DEMO_CREATED_AT = '2026-01-01T00:00:00.000Z';
export const DEMO_UPDATED_AT = '2026-01-01T00:00:00.000Z';

export type DemoGladiatorInput = Gladiator;

interface DemoSaveInput {
  id: DemoSaveId;
  ludusName: string;
  ludus: Pick<GameSave['ludus'], 'treasury' | 'reputation'> & Partial<GameSave['ludus']>;
  time: Pick<GameSave['time'], 'year' | 'week' | 'dayOfWeek'> & Partial<GameSave['time']>;
  buildings: Partial<Record<BuildingId, BuildingState>>;
  gladiators: DemoGladiatorInput[];
  market: MarketGladiator[];
}

export function createPurchasedBuilding(
  building: Pick<BuildingState, 'id' | 'level'> &
    Partial<Omit<BuildingState, 'id' | 'isPurchased' | 'level'>>,
): BuildingState {
  return {
    ...building,
    isPurchased: true,
    efficiency: building.efficiency ?? 100,
    purchasedImprovementIds: building.purchasedImprovementIds ?? [],
    purchasedSkillIds: building.purchasedSkillIds ?? [],
  };
}

export function createDemoSave(input: DemoSaveInput): GameSave {
  const gladiators = input.gladiators.map<Gladiator>((gladiator) => {
    const skillProfile = {
      strength: gladiator.strength,
      agility: gladiator.agility,
      defense: gladiator.defense,
      life: gladiator.life,
    };

    return {
      id: gladiator.id,
      name: gladiator.name,
      age: gladiator.age,
      strength: gladiator.strength,
      agility: gladiator.agility,
      defense: gladiator.defense,
      life: gladiator.life,
      reputation: gladiator.reputation,
      wins: gladiator.wins,
      losses: gladiator.losses,
      traits: gladiator.traits,
      trainingPlan: gladiator.trainingPlan,
      visualIdentity: getGladiatorVisualIdentity(gladiator.id, gladiator.visualIdentity, {
        skillProfile,
      }),
    };
  });
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
    metadata: {
      demoSaveId: input.id,
    },
  };

  return synchronizeEconomyProjection(synchronizePlanning(baseSave, DEMO_UPDATED_AT));
}

export function createMarketGladiator(gladiator: Gladiator & { price: number }): MarketGladiator {
  const skillProfile = {
    strength: gladiator.strength,
    agility: gladiator.agility,
    defense: gladiator.defense,
    life: gladiator.life,
  };

  return {
    ...gladiator,
    visualIdentity: getGladiatorVisualIdentity(gladiator.id, gladiator.visualIdentity, {
      skillProfile,
    }),
  };
}
