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
  notifications: GameNotification[];
  metadata?: SaveMetadata;
}
```

New and updated saves are emitted with the current `schemaVersion`. The validator supports only the current save schema. Older schemas are rejected cleanly instead of being migrated.

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

`gameStatus` becomes `lost` when the player abandons a debt crisis or fails to recover before the debt grace deadline.

## Time

```ts
export type GamePhase = 'planning' | 'simulation' | 'event' | 'arena' | 'report' | 'gameOver';

export type PendingActionTrigger = 'startWeek' | 'enterArena';

export interface GameTimeState {
  year: number;
  week: number;
  dayOfWeek: DayOfWeek;
  phase: GamePhase;
  pendingActionTrigger?: PendingActionTrigger;
}
```

The normal ludus progression uses daily and weekly macro resolvers. Minute-by-minute clock state, pause state and speed state are no longer part of the save model. `pendingActionTrigger` persists explicit player-gated actions that temporarily block time until the player starts the week or enters the arena.

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
  selectedPolicyId?: string;
}
```

Buildings do not have a generic operational efficiency percentage. Their contribution comes from level, purchased improvements, selected policies and purchased skills.

Gladiator roster capacity is derived by `src/domain/ludus/capacity.ts` from the Dormitory: one base place when the Dormitory is purchased, plus bought Dormitory `increaseCapacity` improvements, capped by `LUDUS_CAPACITY_CONFIG.maximumGladiators`. Domus level is not part of this capacity calculation.

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
  visualIdentity?: GladiatorVisualIdentity;
}
```

`strength`, `agility`, `defense` and `life` are persisted as integer skills in the 1..10 range.

`experience` is the source of truth for progression. The gladiator level is derived from XP thresholds through domain selectors and should not be persisted as an independent mutable field. Available skill points are derived from the initial point budget plus derived levels minus the sum of allocated skills; spending a point increments one integer skill and clamps it to the 1..10 range.

## Gladiator Traits

```ts
export interface GladiatorTrait {
  traitId: GladiatorTraitId;
  expiresAt?: GameDate;
}

export type GladiatorTraitModifier =
  | { type: 'trainingExperienceMultiplier'; value: number }
  | { type: 'arenaCombatEligibility'; value: boolean }
  | { type: 'activityEligibility'; value: boolean }
  | { type: 'combatMoraleBonus'; value: number }
  | { type: 'combatEnergyBonus'; value: number }
  | { type: 'combatExperienceMultiplier'; value: number }
  | { type: 'injuryRiskMultiplier'; value: number }
  | { type: 'arenaRewardMultiplier'; value: number }
  | { type: 'skillBonus'; skill: GladiatorSkillName; value: number };
```

Gladiator trait catalog declarations live in `src/game-data/gladiators/traits.ts`. `src/domain/gladiators/traits.ts` derives typed definitions from that catalog. Runtime traits live directly in `Gladiator.traits`.

A trait without `expiresAt` is permanent. Permanent traits are part of the gladiator profile and never generate alerts. A trait with `expiresAt` is temporary and stays active while `currentDate < expiresAt`. Durations are exclusive by day: a temporary trait applied on Monday for 1 day expires at the start of Tuesday. Reapplying the same temporary trait to the same gladiator extends `expiresAt` to the later expiration date instead of stacking duplicates.

Trait definitions also declare generation and pricing metadata. See `docs/01_game_design/GAME_DATA.md` for the trait catalog policy and market pricing overview.

Each gladiator stores at most one runtime entry for a given `traitId`. Save normalization deduplicates legacy or malformed trait arrays and keeps the latest expiration when duplicated temporary traits are found.

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

`MarketGladiator.price` is derived from the market pricing rules in `MARKET_PRICING_CONFIG`: base value, effective skill points, floored XP steps, non-negative reputation, combat record and permanent trait price modifiers. Sale value is calculated dynamically from that purchase price and is not persisted on the gladiator.

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

`planning.alerts` is the current storage field for active alerts. The business owner is
`src/domain/alerts`, which derives the active list from the current save and replaces this
field during alert refresh.

## Notifications

```ts
export interface GameNotification {
  id: string;
  occurredAt: GameDate;
  titleKey: string;
  descriptionKey: string;
  params?: Record<string, string | number>;
  target?:
    | { kind: 'building'; buildingId: BuildingId }
    | { kind: 'gladiator'; gladiatorId: string };
  archivedAt?: GameDate;
}
```

Notifications are persisted history for ludus-life events that happened outside a direct player command. They are distinct from alerts: alerts are regenerated from current state, while notifications remain in the save until archived and stay visible in the full notification history.

`occurredAt` and `archivedAt` use game dates. Unarchived notifications appear in the right sidebar. The full notifications surface sorts all notifications by descending game date, then newest insertion first for events on the same day.

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

export type GameAlertActionKind =
  | 'allocateGladiatorSkillPoint'
  | 'openFinance'
  | 'openWeeklyPlanning'
  | 'openMarket';

export interface GameAlert {
  id: string;
  severity: AlertSeverity;
  titleKey: string;
  descriptionKey: string;
  actionKind?: GameAlertActionKind;
  gladiatorId?: string;
  buildingId?: BuildingId;
  traitId?: string;
  createdAt: string;
}
```

`GameAlert.id` is the stable identity used to preserve `createdAt` while the same alert remains active. `titleKey` and `descriptionKey` are i18n keys. `actionKind` is optional and lets the UI route direct actions such as opening weekly planning, opening finances, opening the market or focusing gladiator skill allocation.

Untargeted alerts are global Ludus alerts. `buildingId` attaches an alert to a building and lets UI surfaces badge that building. `gladiatorId` attaches an alert to an owned gladiator. `traitId` references the active temporary gladiator trait so the UI can display the correct icon, color and remaining duration from the gladiator profile.

The central alert engine currently evaluates:

- ludus rules for empty or incomplete weekly planning;
- ludus rules for low treasury, with `warning` below the configured threshold and `critical` below zero;
- building rules for the Dormitory open register when roster capacity and affordable market stock exist;
- gladiator rules for unassigned skill points and visible active gladiator traits.

Future global rules such as low happiness should be added to `ludusAlertRules` in `src/domain/alerts/alert-actions.ts`, then covered with i18n keys and tests. They should not require store or UI changes when they follow the existing `GameAlert` shape.

Skill allocation alerts are generated from owned gladiators whose derived available skill points are greater than zero. They should be attached through `gladiatorId` and regenerated by the central alert engine rather than treated as authoritative progression state.

Gladiator trait alerts are generated only from active temporary gladiator traits whose definitions set `showAlert` to `true`. Permanent traits never generate alerts.

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
export interface DebtCrisisState {
  status: 'grace';
  startedAt: GameDate;
  deadlineAt: GameDate;
}
```

```ts
export interface EconomyState {
  ledgerEntries: EconomyLedgerEntry[];
  activeLoans: ActiveLoan[];
  currentWeekSummary: WeeklyProjection;
  weeklyProjection: WeeklyProjection;
  debtCrisis?: DebtCrisisState;
}
```

All treasury changes must go through `src/domain/economy/treasury-service.ts`. `recordIncome` records positive ledger entries, `recordExpense` validates and blocks voluntary expenses when the treasury cannot pay, and `recordForcedExpense` records automatic obligations that may push the treasury below zero. Feature actions must not mutate `ludus.treasury` directly.

Player-facing treasury changes should go through ledger entries. `currentWeekSummary` is derived from ledger entries already recorded for the current year/week. `weeklyProjection` is a forward-looking estimate from the current weekly plan and active loan repayments, so one-shot ledger entries such as taking a loan are not counted as future income.

Current ledger-backed flows include daily macro income and expenses, building activity income, loans, loan buyout and repayment, event treasury choices, arena rewards, gladiator purchase and sale, and building purchase, upgrade, improvement, policy and skill costs.

`debtCrisis` stores the active grace period after the player chooses to recover from negative treasury. Its deadline is an exact game date computed from `TREASURY_CONFIG.debtGraceDays`. If treasury returns to zero or above, the state is cleared. If the current game date reaches or passes the deadline while treasury is still negative, the game is lost.

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

Existing `EventState` persists pending, resolved and launched event records. `GameEvent.source` is optional for older data and is currently either `daily` or `reactive` on new events.

`synchronizeMacroEvents(save, plan)` creates blocking daily events during daily simulation. Definitions with `triggerActivities` require allocated points in at least one matching activity. Definitions with `triggerBuildingActivities` require the specialized activity to be selected in `DailyPlan.buildingActivitySelections` and require allocated points in that activity's parent bucket. Definitions without triggers are global ludus events. Critical definitions, such as rebellion crisis, are selected before the normal weighted pool.

`synchronizeReactiveEvents(save)` creates state-driven blocking events after player mutations and forced expenses. The current reactive definition is `debtCrisis`: it triggers when `treasury < 0`, no debt event is already pending and no grace period is active. The event is non-dismissible through the existing event modal. Choosing `abandon` sets `gameStatus` to `lost`; choosing `recover` starts `debtCrisis` with an exact `currentGameDate + debtGraceDays` deadline.
