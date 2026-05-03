import type {
  BuildingConfiguration,
  BuildingDefinition,
  BuildingEffect,
  BuildingId,
} from '../domain/buildings/types';
import { calculateBuildingUpgradeCost } from './building-levels';
import { GAME_BALANCE } from './balance';

export const BUILDING_IDS = [
  'domus',
  'trainingGround',
  'canteen',
  'dormitory',
] as const satisfies BuildingId[];

function createLevel(level: number, requiredDomusLevel: number, effects: BuildingEffect[] = []) {
  return {
    level,
    upgradeCost: level === 1 ? undefined : calculateBuildingUpgradeCost(level),
    requiredDomusLevel,
    effects,
  };
}

export const BUILDING_DEFINITIONS: Record<BuildingId, BuildingDefinition> = {
  domus: {
    id: 'domus',
    nameKey: 'buildings.domus.name',
    descriptionKey: 'buildings.domus.description',
    startsPurchased: true,
    startsAtLevel: 1,
    levels: [
      createLevel(1, 1, [
        {
          type: 'increaseCapacity',
          value: GAME_BALANCE.buildings.levelEffects.domus[1].capacity,
          target: 'ludus',
        },
      ]),
      createLevel(2, 1, [
        {
          type: 'increaseCapacity',
          value: GAME_BALANCE.buildings.levelEffects.domus[2].capacity,
          target: 'ludus',
        },
      ]),
      createLevel(3, 2, [
        {
          type: 'increaseCapacity',
          value: GAME_BALANCE.buildings.levelEffects.domus[3].capacity,
          target: 'ludus',
        },
      ]),
      createLevel(4, 3, [
        {
          type: 'increaseCapacity',
          value: GAME_BALANCE.buildings.levelEffects.domus[4].capacity,
          target: 'ludus',
        },
      ]),
      createLevel(5, 4, [
        {
          type: 'increaseCapacity',
          value: GAME_BALANCE.buildings.levelEffects.domus[5].capacity,
          target: 'ludus',
        },
      ]),
      createLevel(6, 5, [
        {
          type: 'increaseCapacity',
          value: GAME_BALANCE.buildings.levelEffects.domus[6].capacity,
          target: 'ludus',
        },
      ]),
    ],
    improvementIds: [],
  },
  trainingGround: {
    id: 'trainingGround',
    nameKey: 'buildings.trainingGround.name',
    descriptionKey: 'buildings.trainingGround.description',
    startsPurchased: true,
    startsAtLevel: 1,
    staffType: 'trainer',
    requiredStaffByLevel: { 1: 1, 2: 1, 3: 2, 4: 2, 5: 3 },
    levels: [
      {
        level: 1,
        purchaseCost: 180,
        requiredDomusLevel: 1,
        effects: [
          {
            type: 'increaseStrength',
            value: GAME_BALANCE.buildings.levelEffects.trainingGround[1].skillProgressPerPoint,
            target: 'plannedGladiators',
          },
          {
            type: 'reduceInjuryRisk',
            value: GAME_BALANCE.buildings.levelEffects.trainingGround[1].injuryRiskPerPoint,
            target: 'allGladiators',
          },
        ],
      },
      {
        level: 2,
        upgradeCost: calculateBuildingUpgradeCost(2),
        requiredDomusLevel: 2,
        effects: [
          {
            type: 'increaseStrength',
            value: GAME_BALANCE.buildings.levelEffects.trainingGround[2].skillProgressPerPoint,
            target: 'plannedGladiators',
          },
          {
            type: 'reduceInjuryRisk',
            value: GAME_BALANCE.buildings.levelEffects.trainingGround[2].injuryRiskPerPoint,
            target: 'allGladiators',
          },
        ],
      },
      createLevel(3, 3, [{ type: 'increaseReputation', value: 2, target: 'ludus' }]),
      createLevel(4, 4, [{ type: 'reduceInjuryRisk', value: 4, target: 'allGladiators' }]),
      createLevel(5, 5, [{ type: 'increaseStaffEfficiency', value: 5, target: 'ludus' }]),
    ],
    improvementIds: ['sparringRing', 'advancedDoctoreTools'],
  },
  canteen: {
    id: 'canteen',
    nameKey: 'buildings.canteen.name',
    descriptionKey: 'buildings.canteen.description',
    startsPurchased: true,
    startsAtLevel: 1,
    staffType: 'slave',
    requiredStaffByLevel: { 1: 1, 2: 1, 3: 2, 4: 2, 5: 3 },
    levels: [
      {
        level: 1,
        purchaseCost: 120,
        requiredDomusLevel: 1,
        effects: [
          {
            type: 'increaseDailyGladiatorPoints',
            value: GAME_BALANCE.buildings.levelEffects.canteen[1].dailyGladiatorPoints,
            target: 'ludus',
          },
        ],
      },
      {
        level: 2,
        upgradeCost: calculateBuildingUpgradeCost(2),
        requiredDomusLevel: 2,
        effects: [
          {
            type: 'increaseDailyGladiatorPoints',
            value: GAME_BALANCE.buildings.levelEffects.canteen[2].dailyGladiatorPoints,
            target: 'ludus',
          },
        ],
      },
      createLevel(3, 3, [
        {
          type: 'increaseDailyGladiatorPoints',
          value: GAME_BALANCE.buildings.levelEffects.canteen[3].dailyGladiatorPoints,
          target: 'ludus',
        },
        {
          type: 'increaseHappiness',
          value: GAME_BALANCE.buildings.levelEffects.canteen[3].happiness,
          target: 'ludus',
        },
      ]),
      createLevel(4, 4, [
        {
          type: 'increaseDailyGladiatorPoints',
          value: GAME_BALANCE.buildings.levelEffects.canteen[4].dailyGladiatorPoints,
          target: 'ludus',
        },
        {
          type: 'reduceExpense',
          value: GAME_BALANCE.buildings.levelEffects.canteen[4].expenseReduction,
          target: 'ludus',
        },
      ]),
      createLevel(5, 5, [
        {
          type: 'increaseDailyGladiatorPoints',
          value: GAME_BALANCE.buildings.levelEffects.canteen[5].dailyGladiatorPoints,
          target: 'ludus',
        },
        {
          type: 'increaseProduction',
          value: GAME_BALANCE.buildings.levelEffects.canteen[5].production,
          target: 'ludus',
        },
      ]),
    ],
    improvementIds: [],
  },
  dormitory: {
    id: 'dormitory',
    nameKey: 'buildings.dormitory.name',
    descriptionKey: 'buildings.dormitory.description',
    startsPurchased: true,
    startsAtLevel: 1,
    staffType: 'slave',
    requiredStaffByLevel: { 1: 1, 2: 1, 3: 2, 4: 2, 5: 3 },
    levels: [
      {
        level: 1,
        purchaseCost: 140,
        requiredDomusLevel: 1,
        effects: [
          {
            type: 'increaseDailyGladiatorPoints',
            value: GAME_BALANCE.buildings.levelEffects.dormitory[1].dailyGladiatorPoints,
            target: 'ludus',
          },
          {
            type: 'increaseHappiness',
            value: GAME_BALANCE.buildings.levelEffects.dormitory[1].happiness,
            target: 'ludus',
          },
        ],
      },
      {
        level: 2,
        upgradeCost: calculateBuildingUpgradeCost(2),
        requiredDomusLevel: 2,
        effects: [
          {
            type: 'increaseDailyGladiatorPoints',
            value: GAME_BALANCE.buildings.levelEffects.dormitory[2].dailyGladiatorPoints,
            target: 'ludus',
          },
          {
            type: 'increaseHappiness',
            value: GAME_BALANCE.buildings.levelEffects.dormitory[2].happiness,
            target: 'ludus',
          },
        ],
      },
      createLevel(3, 3, [
        {
          type: 'increaseDailyGladiatorPoints',
          value: GAME_BALANCE.buildings.levelEffects.dormitory[3].dailyGladiatorPoints,
          target: 'ludus',
        },
        {
          type: 'increaseHappiness',
          value: GAME_BALANCE.buildings.levelEffects.dormitory[3].happiness,
          target: 'ludus',
        },
      ]),
      createLevel(4, 4, [
        {
          type: 'increaseDailyGladiatorPoints',
          value: GAME_BALANCE.buildings.levelEffects.dormitory[4].dailyGladiatorPoints,
          target: 'ludus',
        },
        {
          type: 'decreaseRebellion',
          value: GAME_BALANCE.buildings.levelEffects.dormitory[4].rebellionReduction,
          target: 'ludus',
        },
      ]),
      createLevel(5, 5, [
        {
          type: 'increaseDailyGladiatorPoints',
          value: GAME_BALANCE.buildings.levelEffects.dormitory[5].dailyGladiatorPoints,
          target: 'ludus',
        },
        {
          type: 'increaseStaffEfficiency',
          value: GAME_BALANCE.buildings.levelEffects.dormitory[5].staffEfficiency,
          target: 'ludus',
        },
      ]),
    ],
    improvementIds: ['strawBeds', 'woodenBeds', 'quietQuarters'],
  },
};

export const INITIAL_BUILDING_CONFIGURATIONS: Partial<Record<BuildingId, BuildingConfiguration>> = {
  trainingGround: { defaultDoctrineId: 'balancedTraining' },
};

export const INITIAL_BUILDING_POLICY_IDS: Partial<Record<BuildingId, string>> = {
  trainingGround: 'balancedTraining',
};
