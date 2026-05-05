export type BuildingId = 'domus' | 'canteen' | 'dormitory' | 'trainingGround';

export interface BuildingState {
  id: BuildingId;
  isPurchased: boolean;
  level: number;
  configuration?: BuildingConfiguration;
  purchasedImprovementIds: string[];
  purchasedSkillIds: string[];
  selectedPolicyId?: string;
}

export type BuildingConfiguration = DormitoryConfiguration | TrainingGroundConfiguration;

export interface DormitoryConfiguration {
  purchasedBeds: number;
}

export interface TrainingGroundConfiguration {
  defaultDoctrineId: string;
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

export interface BuildingSkillDefinition {
  id: string;
  buildingId: BuildingId;
  tier: number;
  name: string;
  nameKey: string;
  descriptionKey: string;
  cost: number;
  requiredBuildingLevel: number;
  requiredSkillIds?: string[];
  effects: BuildingEffect[];
  unlockedActivities?: BuildingActivityId[];
}

export type BuildingActivityId =
  | 'trainingGround.nobleTraining'
  | 'trainingGround.soldierTraining'
  | 'trainingGround.publicDrill'
  | 'canteen.supplyContracts'
  | 'canteen.festivalCatering'
  | 'domus.profitForecasting'
  | 'domus.championshipBooking';

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
  | 'increaseTrainingExperience'
  | 'increaseCapacity'
  | 'increaseDailyGladiatorPoints'
  | 'reduceInjuryRisk'
  | 'increaseReputation'
  | 'increaseHappiness'
  | 'decreaseRebellion'
  | 'increaseIncome'
  | 'reduceExpense'
  | 'increaseProduction';

export interface BuildingEffect {
  type: BuildingEffectType;
  value: number;
  target?: 'plannedGladiators' | 'allGladiators' | 'ludus';
}
