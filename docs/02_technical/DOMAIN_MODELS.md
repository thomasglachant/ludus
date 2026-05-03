# Domain Models

This document defines the current persisted game state and major gameplay shapes.

## Save Model

```ts
export interface GameSave {
  schemaVersion: number;
  gameId: string;
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
  economy: EconomyState;
  staff: StaffState;
  events: EventState;
  metadata?: SaveMetadata;
}
```

Only the current `schemaVersion` is supported. Older saves are rejected cleanly rather than migrated.

## Ludus

```ts
export type GameStatus = 'active' | 'lost';

export interface LudusState {
  treasury: number;
  reputation: number;
  security: number;
  happiness: number;
  rebellion: number;
  gameStatus: GameStatus;
}
```

`gameStatus` becomes `lost` when treasury reaches the macro game-over threshold.

## Time

```ts
export type GamePhase = 'planning' | 'simulation' | 'event' | 'arena' | 'report' | 'gameOver';

export interface GameTimeState {
  year: number;
  week: number;
  dayOfWeek: DayOfWeek;
  phase: GamePhase;
}
```

The normal ludus progression uses daily and weekly macro resolvers. Minute-by-minute clock state, pause state and speed state are no longer part of the save model.

## Buildings

```ts
export type BuildingId =
  | 'domus'
  | 'trainingGround'
  | 'canteen'
  | 'dormitory'
  | 'infirmary'
  | 'guardBarracks'
  | 'farm'
  | 'pleasureHall'
  | 'exhibitionGrounds'
  | 'armory'
  | 'bookmakerOffice'
  | 'banquetHall'
  | 'forgeWorkshop';
```

```ts
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
```

Buildings do not have capacity. Their operational strength is represented by `efficiency`, which is recalculated from purchase state, level, assigned staff and staff experience.

## Gladiators

```ts
export interface GladiatorWeeklyInjury {
  reason: 'training' | 'combat' | 'event';
  week: number;
  year: number;
}
```

`Gladiator.weeklyInjury` is optional. When it matches the current `year` and `week`, the gladiator is unavailable for physical macro activities. Weekly injuries are cleared when Sunday arena completion rolls the save to the next week.

```ts
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
```

`unlockedActivities` contains optional building-specific macro activity ids. These ids come from `BUILDING_ACTIVITY_DEFINITIONS` and can be used by planning and simulation code to detect specialized activities unlocked by purchased skills. They do not change `BuildingState` directly; ownership remains represented by `purchasedSkillIds`.

## Weekly Planning

```ts
export interface WeeklyPlanningState {
  week: number;
  year: number;
  days: Record<DayOfWeek, DailyPlan>;
  reports: WeeklyReport[];
  alerts: GameAlert[];
}
```

Weekly planning is global to the ludus. It no longer stores per-gladiator routines,
objectives, intensity settings or manual building overrides. The current app only exposes
`gladiatorTimePoints`; `laborPoints` and `adminPoints` remain in the current schema but are
cleared during planning synchronization and should stay zero.

```ts
export type DailyPlanActivity =
  | 'strengthTraining'
  | 'agilityTraining'
  | 'defenseTraining'
  | 'lifeTraining'
  | 'meals'
  | 'sleep'
  | 'leisure'
  | 'care'
  | 'production'
  | 'security';

export type DailyPlanPoints = Record<DailyPlanActivity, number>;

export type DailyPlanBuildingActivitySelections = Partial<
  Record<DailyPlanActivity, BuildingActivityId>
>;

export interface DailyPlan {
  dayOfWeek: DayOfWeek;
  gladiatorTimePoints: DailyPlanPoints;
  laborPoints: DailyPlanPoints;
  adminPoints: DailyPlanPoints;
  buildingActivitySelections: DailyPlanBuildingActivitySelections;
}
```

```ts
export interface DailySimulationSummary {
  dayOfWeek: DayOfWeek;
  treasuryDelta: number;
  reputationDelta: number;
  happinessDelta: number;
  securityDelta: number;
  rebellionDelta: number;
  injuredGladiatorIds: string[];
  eventIds: string[];
}

export interface WeeklyReport {
  id: string;
  year: number;
  week: number;
  days: DailySimulationSummary[];
  treasuryDelta: number;
  reputationDelta: number;
  happinessDelta: number;
  securityDelta: number;
  rebellionDelta: number;
  injuries: number;
}
```

## Economy

```ts
export type EconomyEntryKind = 'income' | 'expense';

export type EconomyCategory =
  | 'arena'
  | 'contracts'
  | 'production'
  | 'market'
  | 'staff'
  | 'maintenance'
  | 'food'
  | 'medicine'
  | 'loan'
  | 'event'
  | 'building'
  | 'other';
```

```ts
export interface EconomyLedgerEntry {
  id: string;
  year: number;
  week: number;
  dayOfWeek: DayOfWeek;
  kind: EconomyEntryKind;
  category: EconomyCategory;
  amount: number;
  labelKey: string;
  buildingId?: BuildingId;
  relatedId?: string;
}
```

```ts
export type LoanId = 'smallLoan' | 'businessLoan' | 'patronLoan';

export interface ActiveLoan {
  id: string;
  definitionId: LoanId;
  principal: number;
  remainingBalance: number;
  weeklyPayment: number;
  remainingWeeks: number;
  startedYear: number;
  startedWeek: number;
}
```

```ts
export interface EconomyState {
  ledgerEntries: EconomyLedgerEntry[];
  activeLoans: ActiveLoan[];
  currentWeekSummary: WeeklyProjection;
  weeklyProjection: WeeklyProjection;
}
```

Player-facing treasury changes should go through ledger entries. `currentWeekSummary` is derived from ledger entries already recorded for the current year/week. `weeklyProjection` is a forward-looking estimate from the current weekly plan and active loan repayments, so one-shot ledger entries such as taking a loan are not counted as future income.

Current ledger-backed flows include daily macro income and expenses, building activity income, loans, loan buyout and repayment, event treasury choices, arena rewards, staff purchase and sale, gladiator purchase and sale, and building purchase, upgrade, improvement, policy and skill costs.

## Staff

```ts
export type StaffType = 'slave' | 'guard' | 'trainer';

export interface StaffMember {
  id: string;
  name: string;
  type: StaffType;
  weeklyWage: number;
  assignedBuildingId?: BuildingId;
  buildingExperience: Partial<Record<BuildingId, number>>;
}

export interface StaffMarketCandidate extends StaffMember {
  price: number;
}

export interface StaffAssignment {
  buildingId: BuildingId;
  staffIds: string[];
}

export interface StaffState {
  members: StaffMember[];
  marketCandidates: StaffMarketCandidate[];
  assignments: StaffAssignment[];
}
```

`getLudusStaffCapacity` derives the owned staff limit from Domus level. Staff market purchases use `validateStaffMarketPurchase`, which rejects purchases when the capacity is full.

`getRequiredStaffCount(save, buildingId)` derives the building requirement from `requiredStaffByLevel`. `validateStaffAssignment` prevents invalid staff types, unpurchased buildings and assignments beyond the requirement. Unassigning a staff member is valid and clears both the staff member and the mirrored building assignment.

## Arena Rewards

`CombatReward` still stores the explicit split for UI display, but participation is now zero.

```ts
export interface CombatReward {
  totalReward: number;
  winnerReward: number;
  loserReward: number;
  participationReward?: number;
  victoryReward?: number;
  publicStakeModifier?: number;
  playerDecimalOdds?: number;
  opponentDecimalOdds?: number;
}
```

## Events

Existing `EventState` persists pending, resolved and launched event records. `synchronizeMacroEvents(save, plan)` creates blocking events during daily simulation. Definitions with `triggerActivities` require allocated points in at least one matching activity. Definitions with `triggerBuildingActivities` require the specialized activity to be selected in `DailyPlan.buildingActivitySelections` and require allocated points in that activity's parent bucket. Definitions without triggers are global ludus events. Critical definitions, such as rebellion crisis, are selected before the normal weighted pool.
