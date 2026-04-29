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
  ludus: LudusState;
  time: GameTimeState;
  map: LudusMapState;
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
  ludusName: string;
  isCloudUser: boolean;
}
```

## Transient Save UI State

Dirty-state information is intentionally not part of `GameSave`.
Language is also intentionally outside `GameSave`; the browser language and any local UI preference determine the current locale.

The store owns transient save UI fields such as:

- `hasUnsavedChanges`: whether the active save has player-driven changes that have not been written;
- `lastSavedAt`: the latest successful save timestamp shown in the HUD for the current session;
- `isSaving`: whether a save write is currently in progress;
- `saveNoticeKey`: the i18n key for the latest save success, error or related save notice.

Loading an existing local save sets `hasUnsavedChanges` to `false`. Creating a
new local save also starts clean because the save is written during creation.
Loading a demo template first creates a normal local save copy; that copy keeps
`metadata.demoSaveId` so the HUD can label it and reset it from the source
template. The demo provider templates remain read-only and are not mutated by
manual saves.

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

## Map

```ts
export interface GridCoord {
  column: number;
  row: number;
}

export interface LudusMapState {
  schemaVersion: number;
  gridId: string;
  placements: LudusMapPlacement[];
  editedTiles: LudusMapTileOverride[];
}
```

`map` stores the player-visible ludus grid state. The initial implementation uses
fixed building placements, road tiles and wall tiles. Future construction should
mutate `placements` and `editedTiles` through domain actions instead of changing
renderer-only coordinates.

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

`purchasedImprovementIds` stores the permanent improvements bought for that building. The array contains only ids from definitions whose `buildingId` matches the building state. Domain validation prevents duplicate purchases, missing prerequisites, insufficient building level, unowned buildings and insufficient treasury.

`selectedPolicyId` stores the currently selected policy for that building when the building supports policies. A policy id must belong to the same building and satisfy the current building level. If a policy has `cost`, that cost is paid once when the policy is selected. Selecting the already active policy is a no-op.

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

Owned gladiator capacity is derived from the Domus level and capped at 6. Legacy save data may still contain dormitory `purchasedBeds` configuration, but domain capacity helpers ignore it.

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

`startsPurchased` is the data-driven source of truth for whether a building is owned in a new save. `startsAtLevel` defines the initial level written into new saves. The six base `BuildingId` values are required at the start of the initial player experience, so their definitions use `startsPurchased: true` and `startsAtLevel: 1`.

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

Building effects can come from three sources:

- the current building level;
- purchased improvements;
- the selected policy.

`perHour: true` is the only signal that an effect may be applied during time advancement. Effects without `perHour` are permanent or contextual modifiers. Time-domain actions must filter to hourly effects before changing gladiator gauges, while non-hourly effects should be exposed through building-effect helpers for capacity, readiness, injury-risk and other contextual calculations.

The default target is `assignedGladiator` when omitted. `allGladiators` affects the full roster or a roster-wide calculation. `ludus` affects school-level values such as capacity.

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
  currentLocationId?: GladiatorLocationId;
  currentBuildingId?: BuildingId;
  currentActivityId?: string;
  mapMovement?: GladiatorMapMovement;
  trainingPlan?: GladiatorTrainingPlan;
  visualIdentity?: GladiatorVisualIdentity;
}
```

```ts
export interface GladiatorMapMovement {
  currentLocation: GladiatorLocationId;
  targetLocation: GladiatorLocationId;
  activity: string;
  route?: GridCoord[];
  movementStartedAt: number;
  movementDuration: number;
  minutesPerTile?: number;
}
```

`route` is a cardinal grid-cell path. Domain/game-data helpers compute it from
the current map occupancy; Pixi only interpolates along the prepared route.

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

`currentCombatId` is a consultation pointer for the arena UI. Domain combat resolution remains deterministic for a save and week: `pendingCombats` describes the current-week queue when resolution is staged, `resolvedCombats` stores the combats whose rewards and consequences have already been applied, and `isArenaDayActive` marks that the Sunday arena panel should show the Sunday flow. Repeated synchronization for the same Sunday must not apply rewards or consequences for a combat more than once.

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

`CombatState.turns` is the full resolved turn log. UI state may reveal the log progressively, but React must not recalculate combat turns or apply consequences. Combat progression controls should only choose which saved turn rows are visible or which `currentCombatId` is being inspected.

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
  consequences: GameEventConsequence[];
}
```

```ts
export type GameEventConsequence =
  | { kind: 'certain'; effects: GameEventEffect[] }
  | {
      kind: 'chance';
      id: string;
      chancePercent: number;
      effects?: GameEventEffect[];
      textKey?: string;
    }
  | { kind: 'oneOf'; outcomes: GameEventOutcome[] };
```

```ts
export interface GameEventOutcome {
  id: string;
  chancePercent: number;
  effects?: GameEventEffect[];
  textKey?: string;
}
```

`certain` consequences always apply. `chance` consequences are independent probability checks. `oneOf` consequences are exclusive outcome groups; exactly one outcome is selected from the group according to cumulative `chancePercent` values, and the percentages must total 100.

```ts
export interface GameEvent {
  id: string;
  definitionId: string;
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
  resolvedOutcomeIds?: string[];
}
```

```ts
export interface EventState {
  pendingEvents: GameEvent[];
  resolvedEvents: GameEvent[];
  launchedEvents: LaunchedGameEventRecord[];
}
```

```ts
export interface LaunchedGameEventRecord {
  eventId: string;
  definitionId: string;
  launchedAtYear: number;
  launchedAtWeek: number;
  launchedAtDay: DayOfWeek;
}
```

`pendingEvents` and `resolvedEvents` are transient UI/domain queues and are not persisted across local save normalization. `launchedEvents` is persisted and stores the minimum launch history needed for game-week cooldowns, daily generation limits and weekly generation limits.

```ts
export type GameEventEffect =
  | { type: 'changeTreasury'; amount: number }
  | { type: 'changeLudusReputation'; amount: number }
  | { type: 'removeGladiator'; gladiatorId: string }
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
