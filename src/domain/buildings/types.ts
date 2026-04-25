export type BuildingId =
  | 'domus'
  | 'canteen'
  | 'dormitory'
  | 'trainingGround'
  | 'pleasureHall'
  | 'infirmary';

export interface BuildingState {
  id: BuildingId;
  isPurchased: boolean;
  level: number;
  configuration?: BuildingConfiguration;
  purchasedImprovementIds: string[];
  selectedPolicyId?: string;
}

export type BuildingConfiguration =
  | CanteenConfiguration
  | DormitoryConfiguration
  | TrainingGroundConfiguration
  | PleasureHallConfiguration
  | InfirmaryConfiguration;

export interface CanteenConfiguration {
  mealPlanId: string;
}

export interface DormitoryConfiguration {
  purchasedBeds: number;
}

export interface TrainingGroundConfiguration {
  defaultDoctrineId: string;
}

export interface PleasureHallConfiguration {
  entertainmentPlanId: string;
}

export interface InfirmaryConfiguration {
  carePolicyId: string;
}

export interface BuildingDefinition {
  id: BuildingId;
  nameKey: string;
  descriptionKey: string;
  startsPurchased: boolean;
  startsAtLevel: number;
  levels: BuildingLevelDefinition[];
  improvementIds: string[];
}

export interface BuildingLevelDefinition {
  level: number;
  purchaseCost?: number;
  upgradeCost?: number;
  requiredDomusLevel: number;
  effects: BuildingEffect[];
}

export interface BuildingImprovementDefinition {
  id: string;
  buildingId: BuildingId;
  nameKey: string;
  descriptionKey: string;
  cost: number;
  requiredBuildingLevel: number;
  requiredImprovementIds?: string[];
  effects: BuildingEffect[];
}

export interface BuildingPolicyDefinition {
  id: string;
  buildingId: BuildingId;
  nameKey: string;
  descriptionKey: string;
  requiredBuildingLevel: number;
  effects: BuildingEffect[];
  cost?: number;
}

export type BuildingEffectType =
  | 'increaseSatiety'
  | 'increaseEnergy'
  | 'increaseHealth'
  | 'increaseMorale'
  | 'increaseStrength'
  | 'increaseAgility'
  | 'increaseDefense'
  | 'decreaseEnergy'
  | 'decreaseMorale'
  | 'increaseCapacity'
  | 'reduceInjuryRisk'
  | 'increaseReadiness';

export interface BuildingEffect {
  type: BuildingEffectType;
  value: number;
  perHour?: boolean;
  target?: 'assignedGladiator' | 'allGladiators' | 'ludus';
}
