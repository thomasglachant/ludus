export type BuildingId =
  | 'domus'
  | 'canteen'
  | 'dormitory'
  | 'trainingGround'
  | 'guardBarracks'
  | 'farm'
  | 'pleasureHall'
  | 'infirmary'
  | 'exhibitionGrounds'
  | 'armory'
  | 'bookmakerOffice'
  | 'banquetHall'
  | 'forgeWorkshop';

export interface BuildingState {
  id: BuildingId;
  isPurchased: boolean;
  level: number;
  configuration?: BuildingConfiguration;
  purchasedImprovementIds: string[];
  purchasedSkillIds: string[];
  staffAssignmentIds: string[];
  efficiency: number;
  selectedPolicyId?: string;
}

export type BuildingConfiguration =
  | DormitoryConfiguration
  | TrainingGroundConfiguration
  | PleasureHallConfiguration
  | InfirmaryConfiguration;

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
  staffType?: 'slave' | 'guard' | 'trainer';
  requiredStaffByLevel?: Record<number, number>;
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
  | 'guardBarracks.nightWatch'
  | 'guardBarracks.rebellionProtocol'
  | 'pleasureHall.grandEntertainment'
  | 'domus.profitForecasting'
  | 'domus.championshipBooking'
  | 'farm.marketSurplus'
  | 'farm.exportContracts'
  | 'exhibitionGrounds.localExhibitions'
  | 'exhibitionGrounds.grandSpectacle'
  | 'bookmakerOffice.publicOdds'
  | 'bookmakerOffice.championshipBook'
  | 'banquetHall.nobleDinner'
  | 'banquetHall.grandFeast'
  | 'forgeWorkshop.weaponContracts'
  | 'forgeWorkshop.legionContract';

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
  | 'increaseReputation'
  | 'increaseSecurity'
  | 'increaseHappiness'
  | 'decreaseRebellion'
  | 'increaseIncome'
  | 'reduceExpense'
  | 'increaseProduction'
  | 'increaseStaffEfficiency';

export interface BuildingEffect {
  type: BuildingEffectType;
  value: number;
  target?: 'plannedGladiators' | 'allGladiators' | 'ludus';
}
