# Game Data

## Role

This document describes current gameplay data and tunable rules implemented in the codebase.

Numeric balance values live in `src/game-data/balance.ts` under `GAME_BALANCE`. Larger content tables live in dedicated modules such as `buildings.ts`, `building-skills.ts`, `economy.ts` and demo saves.

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
  baseDailyGladiatorPoints: 6,
  baseDailyLaborPoints: 8,
  baseDailyAdminPoints: 0,
  idealTrainingPressurePointsPerGladiator: 4,
  maximumTrainingEfficiencyMultiplier: 1.25,
  trainingInjuryChancePerPoint: 0.015,
  trainingFocus: {
    strength: { progressMultiplier: 1.15, pressureMultiplier: 1.15 },
    agility: { progressMultiplier: 1.05, pressureMultiplier: 1 },
    defense: { progressMultiplier: 1, pressureMultiplier: 0.9 },
    life: { progressMultiplier: 0.85, pressureMultiplier: 0.75 },
  },
  heavyScheduleHappinessPenalty: 2,
  productionIncomePerPoint: 8,
  rebellionPressureHappinessThreshold: 40,
  rebellionPressureDailyIncrease: 8,
  rebellionCalmDailyReduction: 4,
  rebellionCriticalThreshold: 80,
  gameOverTreasuryThreshold: -1000,
};
```

Only `baseDailyGladiatorPoints` is active in the current player-facing planner. `baseDailyLaborPoints` and `baseDailyAdminPoints` are legacy schema-facing values and should not be reintroduced as visible planning buckets without an intentional design update.

## Buildings

Current `BuildingId` values:

```ts
type BuildingId = 'domus' | 'trainingGround' | 'canteen' | 'dormitory';
```

Initial owned buildings:

- `domus`;
- `trainingGround`;
- `canteen`;
- `dormitory`.

There are no optional building purchases in the current build.

Buildings must not include a generic `budget` property. They now track:

- `purchasedSkillIds`;
- `efficiency`.

## Building Skills

`src/game-data/building-skills.ts` generates 20 skills for each current building from the design skill lists.

Tree rule:

- 4 tiers;
- 5 skills per tier;
- tier 2 requires the first three tier 1 skills;
- tier 3 requires the first tier 2 key skill and building level 3;
- tier 4 requires the first tier 3 key skill and building level 5.

Skill effects currently map to the building's primary macro purpose, such as income, production, happiness, injury risk, reputation or expense reduction.

Some skills also expose `unlockedActivities` ids from `src/game-data/building-activities.ts`. These ids use the owning building prefix and are meant for building-specific macro planning options. They are not standalone balance knobs; any resulting simulation benefit should still come from the activity definition, purchased skill state, explicit daily plan selection and current building efficiency.

Daily simulation applies active macro effects from levels, improvements, policies and skills. Effect values are scaled by `BuildingState.efficiency`.

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
