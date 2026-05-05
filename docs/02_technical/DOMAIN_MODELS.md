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
  buildings: Record<BuildingId, BuildingState>;
  gladiators: Gladiator[];
  market: MarketState;
  arena: ArenaState;
  planning: WeeklyPlanningState;
  economy: EconomyState;
  events: EventState;
  metadata?: SaveMetadata;
}
```

New and updated saves are emitted with the current `schemaVersion`. The validator supports only the current save schema and rejects older schema versions cleanly.

## Ludus

```ts
export type GameStatus = 'active' | 'lost';

export interface LudusState {
  treasury: number;
  reputation: number;
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
export type BuildingId = 'domus' | 'trainingGround' | 'canteen' | 'dormitory';
```

```ts
export interface BuildingState {
  id: BuildingId;
  isPurchased: boolean;
  level: number;
  configuration?: BuildingConfiguration;
  purchasedImprovementIds: string[];
  purchasedSkillIds: string[];
  efficiency: number;
  selectedPolicyId?: string;
}
```

Buildings do not have capacity. Their operational strength is represented by `efficiency`, which is recalculated from purchase state and level.

## Gladiators

```ts
export type GladiatorSkillName = 'strength' | 'agility' | 'defense' | 'life';

export interface Gladiator {
  id: string;
  name: string;
  age: number;
  strength: number;
  agility: number;
  defense: number;
  life: number;
  experience: number;
  reputation: number;
  wins: number;
  losses: number;
  traits: GladiatorTrait[];
  weeklyInjury?: GladiatorWeeklyInjury;
  visualIdentity?: GladiatorVisualIdentity;
}
```

`strength`, `agility`, `defense` and `life` are persisted as integer skills in the 1..10 range.

`experience` is the source of truth for progression. The gladiator level is derived from XP thresholds through domain selectors and should not be persisted as an independent mutable field. Available skill points are derived from the initial point budget plus derived levels minus the sum of allocated skills; spending a point increments one integer skill and clamps it to the 1..10 range.

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

`MarketGladiator.price` is derived exclusively from the candidate's accumulated XP. Sale value is calculated dynamically from that purchase price and is not persisted on the gladiator.

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
export type DailyPlanActivity = 'training' | 'meals' | 'sleep' | 'production';

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
  rebellionDelta: number;
  injuries: number;
}
```

```ts
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface GameAlert {
  id: string;
  severity: AlertSeverity;
  titleKey: string;
  descriptionKey: string;
  actionKind?: 'allocateGladiatorSkillPoint';
  gladiatorId?: string;
  buildingId?: BuildingId;
  createdAt: string;
}
```

Skill allocation alerts are generated from owned gladiators whose derived available skill points are greater than zero. They should be attached through `gladiatorId` and regenerated during planning synchronization rather than treated as authoritative progression state.

Training and combat XP awards update `Gladiator.experience`. Reports may summarize XP gains for UI explanation, but the persisted source of truth remains the gladiator's total XP and allocated integer skills.

## Economy

```ts
export type EconomyEntryKind = 'income' | 'expense';

export type EconomyCategory =
  | 'arena'
  | 'contracts'
  | 'production'
  | 'market'
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

Current ledger-backed flows include daily macro income and expenses, building activity income, loans, loan buyout and repayment, event treasury choices, arena rewards, gladiator purchase and sale, and building purchase, upgrade, improvement, policy and skill costs.

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
