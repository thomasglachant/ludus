# Domain Models

This document defines the TypeScript vocabulary for persisted game state and major gameplay contracts.

Implementation source lives under `src/domain`. This document should stay aligned with the current save schema.

## Common Types

```ts
export type LanguageCode = 'fr' | 'en';
export type GameSpeed = 0 | 1 | 2 | 4 | 8 | 16;
```

```ts
export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';
```

## Save Model

```ts
export type DemoSaveId = 'demo-early-ludus' | 'demo-mid-ludus' | 'demo-advanced-ludus';

export interface SaveMetadata {
  isDemo?: boolean;
  demoSaveId?: DemoSaveId;
}
```

```ts
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
  contracts: ContractState;
  events: EventState;
  metadata?: SaveMetadata;
}
```

```ts
export interface GameSaveMetadata {
  saveId: string;
  ownerName: string;
  ludusName: string;
  createdAt?: string;
  updatedAt: string;
  schemaVersion: number;
  isDemo?: boolean;
  demoSaveId?: DemoSaveId;
}
```

```ts
export interface PlayerProfile {
  ownerName: string;
  ludusName: string;
  isCloudUser: boolean;
}

export interface GameSettings {
  language: LanguageCode;
}
```

## Ludus and Time

```ts
export interface LudusState {
  treasury: number;
  reputation: number;
}
```

```ts
export interface GameTimeState {
  year: number;
  week: number;
  dayOfWeek: DayOfWeek;
  hour: number;
  minute: number;
  speed: GameSpeed;
  isPaused: boolean;
}
```

```ts
export interface GameTickContext {
  elapsedRealMilliseconds: number;
  speed: GameSpeed;
  currentSave: GameSave;
  effectAccumulatorMinutes?: number;
  random?: () => number;
}
```

## Buildings

```ts
export type BuildingId =
  | 'domus'
  | 'canteen'
  | 'dormitory'
  | 'trainingGround'
  | 'pleasureHall'
  | 'infirmary';
```

```ts
export interface BuildingState {
  id: BuildingId;
  isPurchased: boolean;
  level: number;
  configuration?: BuildingConfiguration;
  purchasedImprovementIds: string[];
  selectedPolicyId?: string;
}
```

```ts
export type BuildingConfiguration =
  | CanteenConfiguration
  | DormitoryConfiguration
  | TrainingGroundConfiguration
  | PleasureHallConfiguration
  | InfirmaryConfiguration;
```

```ts
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
```

`DormitoryConfiguration.purchasedBeds` stores only beds explicitly bought by the player. It does not include the free bed granted by the level 1 Dormitory. Domain helpers combine `purchasedBeds` with `DORMITORY_BED_CONFIG.freeBedsAtLevelOne` and the Dormitory level to compute total capacity.

Building state must not contain a generic `budget` field.

## Building Definitions

```ts
export interface BuildingDefinition {
  id: BuildingId;
  nameKey: string;
  descriptionKey: string;
  startsPurchased: boolean;
  startsAtLevel: number;
  levels: BuildingLevelDefinition[];
  improvementIds: string[];
}
```

`startsPurchased` is the data-driven source of truth for whether a building is owned in a new save. `startsAtLevel` defines the initial level written into new saves. The six base `BuildingId` values are required at the start of the MVP experience, so their definitions use `startsPurchased: true` and `startsAtLevel: 1`.

Future optional buildings can use `startsPurchased: false` and `startsAtLevel: 0` without adding a new save field. The purchase domain logic remains available for those buildings.

```ts
export interface BuildingLevelDefinition {
  level: number;
  purchaseCost?: number;
  upgradeCost?: number;
  requiredDomusLevel: number;
  effects: BuildingEffect[];
}
```

```ts
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
```

```ts
export interface BuildingPolicyDefinition {
  id: string;
  buildingId: BuildingId;
  nameKey: string;
  descriptionKey: string;
  requiredBuildingLevel: number;
  effects: BuildingEffect[];
  cost?: number;
}
```

```ts
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
```

```ts
export interface BuildingEffect {
  type: BuildingEffectType;
  value: number;
  perHour?: boolean;
  target?: 'assignedGladiator' | 'allGladiators' | 'ludus';
}
```

## Gladiators

```ts
export interface GladiatorVisualIdentity {
  portraitAssetId: string;
  spriteAssetId: string;
  paletteId?: string;
  bodyType?: string;
  hairStyle?: string;
  armorStyle?: string;
}
```

```ts
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
  visualIdentity?: GladiatorVisualIdentity;
}
```

```ts
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
```

```ts
export interface GladiatorTrainingPlan {
  gladiatorId: string;
  strength: number;
  agility: number;
  defense: number;
}
```

## Weekly Planning

```ts
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
```

```ts
export type TrainingIntensity = 'light' | 'normal' | 'hard' | 'brutal';
```

```ts
export interface GladiatorRoutine {
  gladiatorId: string;
  objective: GladiatorWeeklyObjective;
  intensity: TrainingIntensity;
  allowAutomaticAssignment: boolean;
  lockedBuildingId?: BuildingId;
  combatStrategy?: CombatStrategy;
}
```

```ts
export interface WeeklyPlanningState {
  week: number;
  year: number;
  routines: GladiatorRoutine[];
  alerts: GameAlert[];
}
```

```ts
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
```

## Market

```ts
export interface MarketState {
  week: number;
  year: number;
  availableGladiators: MarketGladiator[];
}

export interface MarketGladiator extends Gladiator {
  price: number;
}
```

## Arena and Combat

```ts
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
```

```ts
export type CombatStrategy =
  | 'balanced'
  | 'aggressive'
  | 'defensive'
  | 'evasive'
  | 'exhaustOpponent'
  | 'protectInjury';
```

```ts
export interface ArenaState {
  currentCombatId?: string;
  pendingCombats: CombatState[];
  resolvedCombats: CombatState[];
  isArenaDayActive: boolean;
  betting?: BettingState;
}
```

```ts
export interface CombatState {
  id: string;
  gladiator: Gladiator;
  opponent: Gladiator;
  rank: ArenaRank;
  strategy: CombatStrategy;
  turns: CombatTurn[];
  winnerId?: string;
  loserId?: string;
  reward: CombatReward;
  consequence: CombatConsequence;
}
```

```ts
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
```

```ts
export interface CombatReward {
  totalReward: number;
  winnerReward: number;
  loserReward: number;
}
```

```ts
export interface CombatConsequence {
  didPlayerWin: boolean;
  playerReward: number;
  healthChange: number;
  energyChange: number;
  moraleChange: number;
  reputationChange: number;
  finalHealth: number;
  finalEnergy: number;
  finalMorale: number;
  finalReputation: number;
}
```

## Betting and Scouting

```ts
export interface BettingState {
  year: number;
  week: number;
  odds: BettingOdds[];
  scoutingReports: ScoutingReport[];
  areBetsLocked: boolean;
}
```

```ts
export interface BettingOdds {
  id: string;
  gladiatorId: string;
  opponent: Gladiator;
  rank: ArenaRank;
  playerWinChance: number;
  playerDecimalOdds: number;
  opponentDecimalOdds: number;
  isScouted: boolean;
  createdAtDay: DayOfWeek;
}
```

```ts
export interface ScoutingReport {
  id: string;
  gladiatorId: string;
  opponentId: string;
  opponentStrength: number;
  opponentAgility: number;
  opponentDefense: number;
  summaryKey: string;
  createdAtYear: number;
  createdAtWeek: number;
  createdAtDay: DayOfWeek;
}
```

## Contracts

```ts
export type ContractStatus = 'available' | 'accepted' | 'completed' | 'failed' | 'expired';
```

```ts
export interface WeeklyContract {
  id: string;
  titleKey: string;
  descriptionKey: string;
  status: ContractStatus;
  rewardTreasury: number;
  rewardReputation?: number;
  issuedAtYear: number;
  issuedAtWeek: number;
  expiresAtYear: number;
  expiresAtWeek: number;
  objective: ContractObjective;
}
```

```ts
export type ContractObjective =
  | { type: 'winFightCount'; count: number }
  | { type: 'winWithRank'; rank: ArenaRank }
  | { type: 'winWithLowHealth'; maxHealth: number }
  | { type: 'earnTreasuryFromArena'; amount: number }
  | { type: 'sellGladiatorForAtLeast'; amount: number };
```

```ts
export interface ContractState {
  availableContracts: WeeklyContract[];
  acceptedContracts: WeeklyContract[];
}

export interface ContractProgress {
  current: number;
  target: number;
  isComplete: boolean;
}
```

## Events

```ts
export type GameEventStatus = 'pending' | 'resolved' | 'expired';
```

```ts
export interface GameEventChoice {
  id: string;
  labelKey: string;
  consequenceKey: string;
  effects: GameEventEffect[];
}
```

```ts
export interface GameEvent {
  id: string;
  titleKey: string;
  descriptionKey: string;
  status: GameEventStatus;
  createdAtYear: number;
  createdAtWeek: number;
  createdAtDay: DayOfWeek;
  gladiatorId?: string;
  buildingId?: BuildingId;
  choices: GameEventChoice[];
  selectedChoiceId?: string;
}
```

```ts
export interface EventState {
  pendingEvents: GameEvent[];
  resolvedEvents: GameEvent[];
}
```

```ts
export type GameEventEffect =
  | { type: 'changeTreasury'; amount: number }
  | { type: 'changeLudusReputation'; amount: number }
  | { type: 'changeGladiatorHealth'; gladiatorId: string; amount: number }
  | { type: 'changeGladiatorEnergy'; gladiatorId: string; amount: number }
  | { type: 'changeGladiatorMorale'; gladiatorId: string; amount: number }
  | { type: 'changeGladiatorSatiety'; gladiatorId: string; amount: number }
  | {
      type: 'changeGladiatorStat';
      gladiatorId: string;
      stat: 'strength' | 'agility' | 'defense';
      amount: number;
    };
```

## Demo Save Definition

```ts
export interface DemoSaveDefinition {
  id: DemoSaveId;
  nameKey: string;
  descriptionKey: string;
  stageKey: string;
  tags: string[];
  save: GameSave;
  preferredRoute?: string;
  preferredCameraTarget?: 'ludus' | 'market' | 'arena';
}
```
