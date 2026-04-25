export type LanguageCode = 'fr' | 'en';

export type GameSpeed = 0 | 1 | 2 | 4 | 8 | 16;

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type BuildingId =
  | 'domus'
  | 'canteen'
  | 'dormitory'
  | 'trainingGround'
  | 'pleasureHall'
  | 'infirmary';

export type ArenaRank =
  | 'bronze3'
  | 'bronze2'
  | 'bronze1'
  | 'silver3'
  | 'silver2'
  | 'silver1'
  | 'gold3'
  | 'gold2'
  | 'gold1';

export type GladiatorWeeklyObjective =
  | 'balanced'
  | 'fightPreparation'
  | 'trainStrength'
  | 'trainAgility'
  | 'trainDefense'
  | 'recovery'
  | 'moraleBoost'
  | 'protectChampion'
  | 'prepareForSale';

export type TrainingIntensity = 'light' | 'normal' | 'hard' | 'brutal';

export type CombatStrategy =
  | 'balanced'
  | 'aggressive'
  | 'defensive'
  | 'evasive'
  | 'exhaustOpponent'
  | 'protectInjury';

export type GladiatorTrait =
  | 'disciplined'
  | 'lazy'
  | 'brave'
  | 'cowardly'
  | 'ambitious'
  | 'fragile'
  | 'crowdFavorite'
  | 'rivalrous'
  | 'stoic';

export interface PlayerProfile {
  ownerName: string;
  ludusName: string;
  isCloudUser: boolean;
}

export interface GameSettings {
  language: LanguageCode;
}

export interface LudusState {
  treasury: number;
  reputation: number;
}

export interface GameTimeState {
  year: number;
  week: number;
  dayOfWeek: DayOfWeek;
  hour: number;
  minute: number;
  speed: GameSpeed;
  isPaused: boolean;
}

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

export interface Gladiator {
  id: string;
  name: string;
  age: number;
  strength: number;
  agility: number;
  defense: number;
  energy: number;
  health: number;
  morale: number;
  satiety: number;
  reputation: number;
  wins: number;
  losses: number;
  traits: GladiatorTrait[];
  currentBuildingId?: BuildingId;
  currentActivityId?: string;
  trainingPlan?: GladiatorTrainingPlan;
}

export interface GladiatorTrainingPlan {
  gladiatorId: string;
  strength: number;
  agility: number;
  defense: number;
}

export interface GladiatorRoutine {
  gladiatorId: string;
  objective: GladiatorWeeklyObjective;
  intensity: TrainingIntensity;
  allowAutomaticAssignment: boolean;
  lockedBuildingId?: BuildingId;
  combatStrategy?: CombatStrategy;
}

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface GameAlert {
  id: string;
  severity: AlertSeverity;
  titleKey: string;
  descriptionKey: string;
  gladiatorId?: string;
  buildingId?: BuildingId;
  createdAt: string;
}

export interface WeeklyPlanningState {
  week: number;
  year: number;
  routines: GladiatorRoutine[];
  alerts: GameAlert[];
}

export interface MarketState {
  week: number;
  year: number;
  availableGladiators: MarketGladiator[];
}

export interface MarketGladiator extends Gladiator {
  price: number;
}

export interface ArenaState {
  currentCombatId?: string;
  pendingCombats: CombatState[];
  resolvedCombats: CombatState[];
  isArenaDayActive: boolean;
}

export interface CombatState {
  id: string;
  gladiator: Gladiator;
  opponent: Gladiator;
  rank: ArenaRank;
  turns: CombatTurn[];
  winnerId?: string;
  loserId?: string;
  reward: CombatReward;
}

export interface CombatTurn {
  turnNumber: number;
  attackerId: string;
  defenderId: string;
  didHit: boolean;
  damage: number;
  attackerHealthAfterTurn: number;
  defenderHealthAfterTurn: number;
  logKey: string;
  logParams: Record<string, string | number>;
}

export interface CombatReward {
  totalReward: number;
  winnerReward: number;
  loserReward: number;
}

export interface GameSave {
  schemaVersion: number;
  saveId: string;
  createdAt: string;
  updatedAt: string;
  player: PlayerProfile;
  settings: GameSettings;
  ludus: LudusState;
  time: GameTimeState;
  buildings: Record<BuildingId, BuildingState>;
  gladiators: Gladiator[];
  market: MarketState;
  arena: ArenaState;
  planning: WeeklyPlanningState;
}
