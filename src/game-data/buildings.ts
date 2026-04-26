import type {
  BuildingConfiguration,
  BuildingDefinition,
  BuildingId,
} from '../domain/buildings/types';
import { calculateBuildingUpgradeCost } from './building-levels';

export const BUILDING_IDS = [
  'domus',
  'canteen',
  'dormitory',
  'trainingGround',
  'pleasureHall',
  'infirmary',
] as const satisfies BuildingId[];

export const BUILDING_DEFINITIONS: Record<BuildingId, BuildingDefinition> = {
  domus: {
    id: 'domus',
    nameKey: 'buildings.domus.name',
    descriptionKey: 'buildings.domus.description',
    startsPurchased: true,
    startsAtLevel: 1,
    levels: [
      {
        level: 1,
        requiredDomusLevel: 1,
        effects: [{ type: 'increaseCapacity', value: 1, target: 'ludus' }],
      },
      {
        level: 2,
        upgradeCost: calculateBuildingUpgradeCost(2),
        requiredDomusLevel: 1,
        effects: [{ type: 'increaseCapacity', value: 2, target: 'ludus' }],
      },
      {
        level: 3,
        upgradeCost: calculateBuildingUpgradeCost(3),
        requiredDomusLevel: 2,
        effects: [{ type: 'increaseCapacity', value: 3, target: 'ludus' }],
      },
      {
        level: 4,
        upgradeCost: calculateBuildingUpgradeCost(4),
        requiredDomusLevel: 3,
        effects: [{ type: 'increaseCapacity', value: 4, target: 'ludus' }],
      },
      {
        level: 5,
        upgradeCost: calculateBuildingUpgradeCost(5),
        requiredDomusLevel: 4,
        effects: [{ type: 'increaseCapacity', value: 5, target: 'ludus' }],
      },
      {
        level: 6,
        upgradeCost: calculateBuildingUpgradeCost(6),
        requiredDomusLevel: 5,
        effects: [{ type: 'increaseCapacity', value: 6, target: 'ludus' }],
      },
    ],
    improvementIds: [],
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
          { type: 'increaseSatiety', value: 6, perHour: true, target: 'assignedGladiator' },
        ],
      },
      {
        level: 2,
        upgradeCost: calculateBuildingUpgradeCost(2),
        requiredDomusLevel: 2,
        effects: [
          { type: 'increaseSatiety', value: 8, perHour: true, target: 'assignedGladiator' },
        ],
      },
    ],
    improvementIds: ['betterKitchen', 'proteinRations', 'grainStorage'],
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
        effects: [{ type: 'increaseEnergy', value: 5, perHour: true, target: 'assignedGladiator' }],
      },
      {
        level: 2,
        upgradeCost: calculateBuildingUpgradeCost(2),
        requiredDomusLevel: 2,
        effects: [{ type: 'increaseEnergy', value: 7, perHour: true, target: 'assignedGladiator' }],
      },
    ],
    improvementIds: ['strawBeds', 'woodenBeds', 'quietQuarters'],
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
          { type: 'increaseStrength', value: 1, perHour: true, target: 'assignedGladiator' },
          { type: 'decreaseEnergy', value: 4, perHour: true, target: 'assignedGladiator' },
        ],
      },
      {
        level: 2,
        upgradeCost: calculateBuildingUpgradeCost(2),
        requiredDomusLevel: 2,
        effects: [
          { type: 'increaseStrength', value: 2, perHour: true, target: 'assignedGladiator' },
          { type: 'decreaseEnergy', value: 4, perHour: true, target: 'assignedGladiator' },
        ],
      },
    ],
    improvementIds: ['woodenWeapons', 'sparringRing', 'advancedDoctoreTools'],
  },
  pleasureHall: {
    id: 'pleasureHall',
    nameKey: 'buildings.pleasureHall.name',
    descriptionKey: 'buildings.pleasureHall.description',
    startsPurchased: true,
    startsAtLevel: 1,
    levels: [
      {
        level: 1,
        purchaseCost: 160,
        requiredDomusLevel: 1,
        effects: [{ type: 'increaseMorale', value: 5, perHour: true, target: 'assignedGladiator' }],
      },
      {
        level: 2,
        upgradeCost: calculateBuildingUpgradeCost(2),
        requiredDomusLevel: 2,
        effects: [{ type: 'increaseMorale', value: 7, perHour: true, target: 'assignedGladiator' }],
      },
    ],
    improvementIds: ['gameTables', 'musicians', 'privateRooms'],
  },
  infirmary: {
    id: 'infirmary',
    nameKey: 'buildings.infirmary.name',
    descriptionKey: 'buildings.infirmary.description',
    startsPurchased: true,
    startsAtLevel: 1,
    levels: [
      {
        level: 1,
        purchaseCost: 200,
        requiredDomusLevel: 1,
        effects: [{ type: 'increaseHealth', value: 5, perHour: true, target: 'assignedGladiator' }],
      },
      {
        level: 2,
        upgradeCost: calculateBuildingUpgradeCost(2),
        requiredDomusLevel: 2,
        effects: [
          { type: 'increaseHealth', value: 7, perHour: true, target: 'assignedGladiator' },
          { type: 'reduceInjuryRisk', value: 5, target: 'allGladiators' },
        ],
      },
    ],
    improvementIds: ['cleanBandages', 'herbalStock', 'surgicalTools'],
  },
};

export const INITIAL_BUILDING_CONFIGURATIONS: Partial<Record<BuildingId, BuildingConfiguration>> = {
  canteen: { mealPlanId: 'balancedMeals' },
  trainingGround: { defaultDoctrineId: 'balancedTraining' },
  pleasureHall: { entertainmentPlanId: 'quietEvenings' },
  infirmary: { carePolicyId: 'basicCare' },
};

export const INITIAL_BUILDING_POLICY_IDS: Partial<Record<BuildingId, string>> = {
  canteen: 'balancedMeals',
  trainingGround: 'balancedTraining',
  pleasureHall: 'quietEvenings',
  infirmary: 'basicCare',
};
