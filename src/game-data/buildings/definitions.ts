import type {
  BuildingConfiguration,
  BuildingDefinition,
  BuildingEffect,
  BuildingId,
} from '../../domain/buildings/types';
import { calculateBuildingUpgradeCost } from './levels';

export { BUILDING_IDS } from '../../domain/buildings/types';

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
      createLevel(1, 1),
      createLevel(2, 1),
      createLevel(3, 2),
      createLevel(4, 3),
      createLevel(5, 4),
      createLevel(6, 5),
    ],
    improvementIds: [],
  },
  trainingGround: {
    id: 'trainingGround',
    nameKey: 'buildings.trainingGround.name',
    descriptionKey: 'buildings.trainingGround.description',
    startsPurchased: true,
    startsAtLevel: 1,
    levels: [
      {
        level: 1,
        purchaseCost: 180,
        requiredDomusLevel: 1,
        effects: [
          {
            type: 'increaseTrainingExperience',
            value: 1,
            target: 'plannedGladiators',
          },
          {
            type: 'reduceInjuryRisk',
            value: 4,
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
            type: 'increaseTrainingExperience',
            value: 2,
            target: 'plannedGladiators',
          },
          {
            type: 'reduceInjuryRisk',
            value: 4,
            target: 'allGladiators',
          },
        ],
      },
      createLevel(3, 3, [{ type: 'increaseReputation', value: 2, target: 'ludus' }]),
      createLevel(4, 4, [{ type: 'reduceInjuryRisk', value: 4, target: 'allGladiators' }]),
      createLevel(5, 5, [{ type: 'increaseReputation', value: 4, target: 'ludus' }]),
    ],
    improvementIds: ['sparringRing', 'advancedDoctoreTools'],
  },
  canteen: {
    id: 'canteen',
    nameKey: 'buildings.canteen.name',
    descriptionKey: 'buildings.canteen.description',
    startsPurchased: true,
    startsAtLevel: 1,
    levels: [
      {
        level: 1,
        purchaseCost: 120,
        requiredDomusLevel: 1,
        effects: [
          {
            type: 'increaseDailyGladiatorPoints',
            value: 1,
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
            value: 2,
            target: 'ludus',
          },
        ],
      },
      createLevel(3, 3, [
        {
          type: 'increaseDailyGladiatorPoints',
          value: 3,
          target: 'ludus',
        },
        {
          type: 'increaseHappiness',
          value: 2,
          target: 'ludus',
        },
      ]),
      createLevel(4, 4, [
        {
          type: 'increaseDailyGladiatorPoints',
          value: 4,
          target: 'ludus',
        },
        {
          type: 'reduceExpense',
          value: 5,
          target: 'ludus',
        },
      ]),
      createLevel(5, 5, [
        {
          type: 'increaseDailyGladiatorPoints',
          value: 5,
          target: 'ludus',
        },
        {
          type: 'increaseProduction',
          value: 5,
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
    levels: [
      {
        level: 1,
        purchaseCost: 140,
        requiredDomusLevel: 1,
        effects: [
          {
            type: 'increaseDailyGladiatorPoints',
            value: 1,
            target: 'ludus',
          },
          {
            type: 'increaseHappiness',
            value: 2,
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
            value: 2,
            target: 'ludus',
          },
          {
            type: 'increaseHappiness',
            value: 3,
            target: 'ludus',
          },
        ],
      },
      createLevel(3, 3, [
        {
          type: 'increaseDailyGladiatorPoints',
          value: 3,
          target: 'ludus',
        },
        {
          type: 'increaseHappiness',
          value: 2,
          target: 'ludus',
        },
      ]),
      createLevel(4, 4, [
        {
          type: 'increaseDailyGladiatorPoints',
          value: 4,
          target: 'ludus',
        },
        {
          type: 'decreaseRebellion',
          value: 2,
          target: 'ludus',
        },
      ]),
      createLevel(5, 5, [
        {
          type: 'increaseDailyGladiatorPoints',
          value: 5,
          target: 'ludus',
        },
        {
          type: 'increaseHappiness',
          value: 4,
          target: 'ludus',
        },
      ]),
    ],
    improvementIds: [
      'dormitoryExtraBunk1',
      'dormitoryExtraBunk2',
      'dormitoryExtraBunk3',
      'dormitoryExtraBunk4',
      'dormitoryExtraBunk5',
      'strawBeds',
      'woodenBeds',
      'quietQuarters',
    ],
  },
};

export const INITIAL_BUILDING_CONFIGURATIONS: Partial<Record<BuildingId, BuildingConfiguration>> = {
  trainingGround: { defaultDoctrineId: 'balancedTraining' },
};

export const INITIAL_BUILDING_POLICY_IDS: Partial<Record<BuildingId, string>> = {
  trainingGround: 'balancedTraining',
};
