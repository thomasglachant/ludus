# Game Data

## Role

This document describes current gameplay data and tunable rules implemented in the codebase.

Numeric balance values live in `src/game-data/balance.ts` under `GAME_BALANCE`. Larger content tables live in dedicated modules such as `buildings.ts`, `building-skills.ts`, `economy.ts`, demo saves and map layout data.

## Economy

Currency: denarius.

The ludus money reserve is named `treasury`.

```ts
GAME_BALANCE.economy.initialTreasury = 500;
GAME_BALANCE.economy.initialReputation = 0;
```

Loans are defined in `src/game-data/economy.ts`:

| Loan           | Domus level | Amount | Weekly payment | Duration |
| -------------- | ----------: | -----: | -------------: | -------: |
| `smallLoan`    |           1 |    500 |             65 | 10 weeks |
| `businessLoan` |           2 |   1400 |            145 | 12 weeks |
| `patronLoan`   |           4 |   3500 |            260 | 18 weeks |

Weekly loan repayment is resolved during the Sunday week step.

## Progression and Time

The target game phase model is macro-based:

```ts
type GamePhase = 'planning' | 'simulation' | 'event' | 'arena' | 'report' | 'gameOver';
```

Current initial progression:

```ts
GAME_BALANCE.progression = {
  weeksPerYear: 8,
  startingYear: 1,
  startingWeek: 1,
  startingDayOfWeek: 'monday',
};
```

The normal ludus loop is resolved through daily and weekly macro actions. Hour, minute, pause and speed values are no longer save data.

## Macro Simulation

```ts
GAME_BALANCE.macroSimulation = {
  baseDailyGladiatorPoints: 12,
  baseDailyLaborPoints: 8,
  baseDailyAdminPoints: 6,
  minimumMealPoints: 2,
  idealMealPoints: 3,
  maximumMealBonusPoints: 4,
  minimumSleepPoints: 3,
  idealSleepPoints: 4,
  maximumSleepBonusPoints: 5,
  insufficientFoodPenalty: 6,
  insufficientSleepPenalty: 8,
  heavyScheduleHappinessPenalty: 2,
  trainingInjuryChancePerPoint: 0.015,
  physicalActivityHealthThreshold: 55,
  contractIncomePerPoint: 12,
  productionIncomePerPoint: 8,
  maintenanceCostPerBuilding: 7,
  staffExperiencePerAssignedDay: 1,
  maximumStaffExperienceBonusPercent: 20,
  targetGuardRatio: 0.5,
  securityPerGuard: 12,
  rebellionPressureHappinessThreshold: 40,
  rebellionPressureSecurityThreshold: 45,
  rebellionPressureDailyIncrease: 8,
  rebellionCalmDailyReduction: 4,
  rebellionCriticalThreshold: 80,
  gameOverTreasuryThreshold: -1000,
};
```

## Buildings

Current `BuildingId` values:

```ts
type BuildingId =
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

Initial owned buildings:

- `domus`;
- `trainingGround`;
- `canteen`;
- `dormitory`;
- `infirmary`;
- `guardBarracks`.

Other buildings start as map-ready future purchases with Domus requirements and purchase costs.

Buildings must not include a generic `budget` property. They now track:

- `purchasedSkillIds`;
- `staffAssignmentIds`;
- `efficiency`.

## Building Skills

`src/game-data/building-skills.ts` generates 20 skills for each building from the design skill lists.

Tree rule:

- 4 tiers;
- 5 skills per tier;
- tier 2 requires the first three tier 1 skills;
- tier 3 requires the first tier 2 key skill and building level 3;
- tier 4 requires the first tier 3 key skill and building level 5.

Skill effects currently map to the building's primary macro purpose, such as income, production, happiness, security, injury risk, reputation or expense reduction.

Some skills also expose `unlockedActivities` ids from `src/game-data/building-activities.ts`. These ids use the owning building prefix and are meant for building-specific macro planning options. They are not standalone balance knobs; any resulting simulation benefit should still come from the activity definition, purchased skill state, explicit daily plan selection and current building efficiency.

Daily simulation applies active macro effects from levels, improvements, policies and skills. Effect values are scaled by `BuildingState.efficiency`, so a building operating at 75% staff efficiency only contributes 75% of its building-driven macro benefit.

## Staff

Initial staff:

- one trainer assigned to `trainingGround`;
- one slave assigned to `canteen`;
- one guard assigned to `guardBarracks`.

The staff market generates slave, guard and trainer candidates each week. Buying staff moves a candidate into `staff.members`, selling staff removes assignments and returns a calculated sale value. Staff and gladiator market transactions are recorded in the economy ledger.

```ts
GAME_BALANCE.staffMarket.availableStaffCount = 4;
GAME_BALANCE.staffMarket.typePool = ['slave', 'slave', 'guard', 'trainer'];
GAME_BALANCE.staffMarket.weeklyWageByType = {
  slave: 0,
  guard: 32,
  trainer: 48,
};
```

Staff type rules:

- slaves can work anywhere;
- guards only work in `guardBarracks`;
- trainers only work in `trainingGround`.

Experience in an assigned building grows by `staffExperiencePerAssignedDay` and contributes up to a 20% efficiency bonus.

Staff assignments are mirrored in `StaffState.assignments` and `BuildingState.staffAssignmentIds`. Simulation efficiency reads `requiredStaffByLevel` from `BUILDING_DEFINITIONS`; buildings without staff requirements remain fully efficient when purchased.

Staff capacity is governed by Domus level:

```ts
GAME_BALANCE.buildings.capacity.minimumStaff = 3;
GAME_BALANCE.buildings.capacity.staffPerDomusLevel = 3;
GAME_BALANCE.buildings.capacity.maximumStaff = 18;
```

The staff market rejects purchases when no staff place remains.

## Events

`src/game-data/events.ts` defines daily event content. Events may set `triggerActivities`; those definitions can only appear when the matching daily plan activity has at least one allocated point. Definitions without `triggerActivities` are global ludus events and remain eligible through the normal probability, cooldown and weekly-limit rules.

Events may also set `triggerBuildingActivities` with ids from `src/game-data/building-activities.ts`. Those definitions require the matching specialized activity to be selected in `DailyPlan.buildingActivitySelections` and require allocated points in the parent activity bucket.

`rebellionCrisis` is a critical global event unlocked by high rebellion. Critical definitions are selected before the normal weighted event pool.

## Arena Rewards

Arena rewards no longer include a participation payout.

`calculateArenaCombatReward` returns:

- `participationReward = 0`;
- `loserReward = 0`;
- `winnerReward = victoryReward`;
- `totalReward = victoryReward`.

The victory reward still uses arena rank, decimal odds and public stake modifier.
