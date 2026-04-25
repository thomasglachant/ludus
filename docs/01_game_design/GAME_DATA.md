# Game Data

## Role

This document is the long-term source of truth for gameplay data, balance values and tunable rules.

Implementation constants live in `src/game-data`. When a balance value changes, update both the source module and this document so design intent and implementation stay aligned.

React components must not hardcode balancing values or gameplay formulas.

## Economy

Currency: denarius.

The ludus money reserve is named `treasury` in code.

```ts
export const INITIAL_TREASURY = 500;
```

## Time and Progression

```ts
export const PROGRESSION_CONFIG = {
  weeksPerYear: 8,
  startingYear: 1,
  startingWeek: 1,
  startingHour: 8,
  startingMinute: 0,
} as const;
```

```ts
export const GAME_SPEEDS = [0, 1, 2, 4, 8, 16] as const;
```

```ts
export const TIME_CONFIG = {
  realMillisecondsPerGameHour: 30_000,
  minutesPerHour: 60,
  hoursPerDay: 24,
} as const;
```

Days of week:

- `monday`;
- `tuesday`;
- `wednesday`;
- `thursday`;
- `friday`;
- `saturday`;
- `sunday`.

## Buildings

### Building IDs

```ts
export type BuildingId =
  | 'domus'
  | 'canteen'
  | 'dormitory'
  | 'trainingGround'
  | 'pleasureHall'
  | 'infirmary';
```

### Building State

Buildings must not include a generic `budget` property.

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

### Initial Building State

All base buildings start purchased at level 1:

- `domus`: purchased, level 1.
- `canteen`: purchased, level 1, default policy `balancedMeals`.
- `dormitory`: purchased, level 1, `purchasedBeds: 0`.
- `trainingGround`: purchased, level 1, default policy `balancedTraining`.
- `pleasureHall`: purchased, level 1, default policy `quietEvenings`.
- `infirmary`: purchased, level 1, default policy `basicCare`.

The dormitory starts with `purchasedBeds: 0`, but level 1 provides one free bed through `DORMITORY_BED_CONFIG.freeBedsAtLevelOne`.

### Purchase and Upgrade Values

Current MVP building definitions include levels 1 and 2.

Level 1 purchase costs on base buildings are not used when creating a new game because those buildings start owned. Purchase costs remain part of building data so future optional buildings can start unpurchased and be bought later.

| Building        | Starts purchased | Level 1 purchase | Level 1 effect                                               | Level 2 requirement | Level 2 effect                                         |
| --------------- | ---------------- | ---------------: | ------------------------------------------------------------ | ------------------- | ------------------------------------------------------ |
| Domus           | Yes              |              n/a | `increaseCapacity +1` for `ludus`                            | Domus level 1       | `increaseCapacity +2` for `ludus`                      |
| Canteen         | Yes              |              120 | `increaseSatiety +6` per hour for assigned gladiator         | Domus level 2       | `increaseSatiety +8` per hour                          |
| Dormitory       | Yes              |              140 | `increaseEnergy +5` per hour and `increaseCapacity +1`       | Domus level 2       | `increaseEnergy +7` per hour and `increaseCapacity +2` |
| Training Ground | Yes              |              180 | `increaseStrength +1` per hour, `decreaseEnergy +4` per hour | Domus level 2       | `increaseStrength +2`, `decreaseEnergy +4` per hour    |
| Pleasure Hall   | Yes              |              160 | `increaseMorale +5` per hour                                 | Domus level 2       | `increaseMorale +7` per hour                           |
| Infirmary       | Yes              |              200 | `increaseHealth +5` per hour                                 | Domus level 2       | `increaseHealth +7` per hour and `reduceInjuryRisk +5` |

### Upgrade Cost Formula

```ts
export const BUILDING_UPGRADE_COST_CONFIG = {
  baseCost: 150,
  growthFactor: 2.2,
} as const;
```

```ts
upgradeCost = Math.round(baseCost * growthFactor ** (targetLevel - 1));
```

Per-building level costs may replace this formula later.

### Dormitory Beds

```ts
export const DORMITORY_BED_CONFIG = {
  freeBedsAtLevelOne: 1,
  purchasableBedsPerLevel: 2,
  baseBedCost: 80,
  bedCostGrowthFactor: 1.4,
} as const;
```

```ts
bedCost = Math.round(baseBedCost * bedCostGrowthFactor ** purchasedBeds);
```

## Building Improvements

Improvements are one of the main replacements for the removed budget system.

| ID                     | Building        | Cost | Required level | Required improvements | Effects                                   |
| ---------------------- | --------------- | ---: | -------------: | --------------------- | ----------------------------------------- |
| `betterKitchen`        | Canteen         |   90 |              1 | n/a                   | `increaseSatiety +2` assigned gladiator   |
| `proteinRations`       | Canteen         |  130 |              1 | n/a                   | `increaseStrength +1` assigned gladiator  |
| `grainStorage`         | Canteen         |  110 |              1 | n/a                   | `increaseSatiety +1` all gladiators       |
| `strawBeds`            | Dormitory       |   70 |              1 | n/a                   | `increaseCapacity +1` ludus               |
| `woodenBeds`           | Dormitory       |  130 |              1 | `strawBeds`           | `increaseEnergy +2` assigned gladiator    |
| `quietQuarters`        | Dormitory       |  150 |              1 | n/a                   | `increaseMorale +1` assigned gladiator    |
| `woodenWeapons`        | Training Ground |  100 |              1 | n/a                   | `increaseReadiness +2` assigned gladiator |
| `sparringRing`         | Training Ground |  160 |              1 | n/a                   | `increaseAgility +1` assigned gladiator   |
| `advancedDoctoreTools` | Training Ground |  220 |              2 | n/a                   | `reduceInjuryRisk +3` assigned gladiator  |
| `gameTables`           | Pleasure Hall   |   90 |              1 | n/a                   | `increaseMorale +2` assigned gladiator    |
| `musicians`            | Pleasure Hall   |  160 |              1 | n/a                   | `increaseMorale +1` all gladiators        |
| `privateRooms`         | Pleasure Hall   |  210 |              2 | n/a                   | `increaseReadiness +3` assigned gladiator |
| `cleanBandages`        | Infirmary       |  100 |              1 | n/a                   | `increaseHealth +2` assigned gladiator    |
| `herbalStock`          | Infirmary       |  150 |              1 | n/a                   | `increaseHealth +1` all gladiators        |
| `surgicalTools`        | Infirmary       |  240 |              2 | n/a                   | `reduceInjuryRisk +8` all gladiators      |

## Weekly Policies

Policies are explicit weekly choices, not hidden numeric budgets.

| ID                    | Building        | Required level | Cost | Effects                                                        |
| --------------------- | --------------- | -------------: | ---: | -------------------------------------------------------------- |
| `economicalMeals`     | Canteen         |              1 |   10 | `increaseSatiety +3`, `decreaseMorale +1` assigned gladiator   |
| `balancedMeals`       | Canteen         |              1 |   20 | `increaseSatiety +5` assigned gladiator                        |
| `richMeals`           | Canteen         |              1 |   40 | `increaseSatiety +7`, `increaseMorale +1` assigned gladiator   |
| `proteinFocusedMeals` | Canteen         |              1 |   30 | `increaseSatiety +4`, `increaseStrength +1` assigned gladiator |
| `balancedTraining`    | Training Ground |              1 |  n/a | `increaseReadiness +1` assigned gladiator                      |
| `strengthDoctrine`    | Training Ground |              1 |  n/a | `increaseStrength +1` assigned gladiator                       |
| `agilityDoctrine`     | Training Ground |              1 |  n/a | `increaseAgility +1` assigned gladiator                        |
| `defensiveDoctrine`   | Training Ground |              1 |  n/a | `increaseDefense +1` assigned gladiator                        |
| `brutalDiscipline`    | Training Ground |              2 |  n/a | `increaseStrength +2`, `decreaseMorale +2` assigned gladiator  |
| `quietEvenings`       | Pleasure Hall   |              1 |  n/a | `increaseMorale +3` assigned gladiator                         |
| `gamesAndSongs`       | Pleasure Hall   |              1 |   25 | `increaseMorale +5` assigned gladiator                         |
| `grandEntertainment`  | Pleasure Hall   |              2 |   60 | `increaseMorale +8` all gladiators                             |
| `basicCare`           | Infirmary       |              1 |  n/a | `increaseHealth +3` assigned gladiator                         |
| `preventiveCare`      | Infirmary       |              1 |   30 | `reduceInjuryRisk +4` all gladiators                           |
| `intensiveTreatment`  | Infirmary       |              2 |   70 | `increaseHealth +8` assigned gladiator                         |

## Market

```ts
export const MARKET_CONFIG = {
  availableGladiatorCount: 5,
  minAge: 16,
  maxAge: 20,
  totalStatPoints: 20,
  minGeneratedStat: 1,
  maxGeneratedStat: 10,
  basePrice: 100,
  reputationPriceMultiplier: 5,
  statPriceMultiplier: 10,
  saleValueMultiplier: 0.5,
} as const;
```

Market price formula:

```ts
price = basePrice + reputation * reputationPriceMultiplier + totalStats * statPriceMultiplier;
```

Sale value:

```ts
saleValue = Math.round(price * saleValueMultiplier);
```

## Weekly Planning

### Objectives

```ts
export const WEEKLY_OBJECTIVES = [
  'balanced',
  'fightPreparation',
  'trainStrength',
  'trainAgility',
  'trainDefense',
  'recovery',
  'moraleBoost',
  'protectChampion',
  'prepareForSale',
] as const;
```

### Training Intensities

```ts
export const TRAINING_INTENSITIES = ['light', 'normal', 'hard', 'brutal'] as const;
```

```ts
export const TRAINING_INTENSITY_EFFECTS = {
  light: { statMultiplier: 1, energyCostMultiplier: 0.5, moraleCost: 0 },
  normal: { statMultiplier: 1, energyCostMultiplier: 1, moraleCost: 0 },
  hard: { statMultiplier: 2, energyCostMultiplier: 1.5, moraleCost: 0 },
  brutal: { statMultiplier: 3, energyCostMultiplier: 2, moraleCost: 1 },
} as const;
```

### Planning Thresholds

```ts
export const PLANNING_THRESHOLDS = {
  criticalHealth: 35,
  lowHealth: 55,
  criticalEnergy: 30,
  lowEnergy: 50,
  criticalSatiety: 25,
  lowSatiety: 50,
  criticalMorale: 30,
  lowMorale: 50,
} as const;
```

### Readiness Weights

```ts
export const READINESS_WEIGHTS = {
  health: 0.35,
  energy: 0.25,
  morale: 0.15,
  satiety: 0.15,
  reputationStability: 0.1,
} as const;
```

## Arena

### Ranks and Rewards

```ts
export const ARENA_REWARDS = {
  bronze3: 80,
  bronze2: 120,
  bronze1: 180,
  silver3: 260,
  silver2: 380,
  silver1: 540,
  gold3: 760,
  gold2: 1050,
  gold1: 1400,
};
```

```ts
export const ARENA_REWARD_SPLIT = {
  winner: 0.75,
  loser: 0.25,
} as const;
```

### Rank Thresholds

```ts
export const ARENA_RANK_THRESHOLDS = [
  { rank: 'bronze3', minimumReputation: 0 },
  { rank: 'bronze2', minimumReputation: 25 },
  { rank: 'bronze1', minimumReputation: 50 },
  { rank: 'silver3', minimumReputation: 100 },
  { rank: 'silver2', minimumReputation: 150 },
  { rank: 'silver1', minimumReputation: 225 },
  { rank: 'gold3', minimumReputation: 325 },
  { rank: 'gold2', minimumReputation: 450 },
  { rank: 'gold1', minimumReputation: 600 },
] as const;
```

### Combat Strategies

```ts
export const COMBAT_STRATEGIES = [
  'balanced',
  'aggressive',
  'defensive',
  'evasive',
  'exhaustOpponent',
  'protectInjury',
] as const;
```

### Combat Constants

```ts
export const COMBAT_CONFIG = {
  maxTurns: 40,
  baseHitChance: 0.65,
  attackerAgilityHitMultiplier: 0.003,
  defenderAgilityDodgeMultiplier: 0.002,
  minHitChance: 0.1,
  maxHitChance: 0.95,
  baseDamage: 5,
  strengthDamageMultiplier: 0.4,
  defenseReductionMultiplier: 0.2,
  minDamage: 1,
  maxDamage: 40,
  winnerHealthRecoveryRatio: 0.25,
  loserMinimumHealth: 1,
  baseEnergyCost: 12,
  energyCostPerTurn: 0.45,
  minEnergyCost: 8,
  maxEnergyCost: 34,
  winnerMoraleChange: 8,
  loserMoraleChange: -10,
  winReputationValue: 10,
  lossReputationPenalty: 3,
} as const;
```

### Strategy Modifiers

| Strategy          | Hit chance bonus | Damage multiplier | Defense multiplier | Energy cost multiplier |
| ----------------- | ---------------: | ----------------: | -----------------: | ---------------------: |
| `balanced`        |                0 |                 1 |                  1 |                      1 |
| `aggressive`      |             0.05 |              1.18 |               0.85 |                   1.15 |
| `defensive`       |            -0.03 |               0.9 |               1.25 |                    0.9 |
| `evasive`         |             0.02 |              0.85 |                1.1 |                   1.05 |
| `exhaustOpponent` |            -0.01 |              0.95 |               1.05 |                      1 |
| `protectInjury`   |            -0.05 |               0.8 |               1.35 |                    0.8 |

### Opponent Scaling

| Rank      | Stat multiplier | Opponent reputation |
| --------- | --------------: | ------------------: |
| `bronze3` |             0.9 |                   0 |
| `bronze2` |            0.96 |                  25 |
| `bronze1` |            1.03 |                  50 |
| `silver3` |            1.08 |                 100 |
| `silver2` |            1.14 |                 150 |
| `silver1` |             1.2 |                 225 |
| `gold3`   |            1.27 |                 325 |
| `gold2`   |            1.34 |                 450 |
| `gold1`   |            1.42 |                 600 |

## Betting

```ts
export const BETTING_CONFIG = {
  firstOddsDay: 'thursday',
  lockDay: 'saturday',
  scoutingCost: 25,
  houseEdge: 0.08,
} as const;
```

## Contracts

```ts
export const CONTRACT_CONFIG = {
  availableContractsPerWeek: 3,
} as const;
```

Initial weekly contract definitions:

| ID                  | Reward treasury | Reward reputation | Objective                         |
| ------------------- | --------------: | ----------------: | --------------------------------- |
| `localChampion`     |              90 |                 2 | win 1 fight                       |
| `crowdRevenue`      |              70 |                 1 | earn 120 treasury from arena      |
| `bronzeSpotlight`   |             110 |                 2 | win with rank `bronze3`           |
| `dangerousRecovery` |             130 |                 3 | win with health at or below 60    |
| `profitableSale`    |              80 |                 1 | sell a gladiator for at least 220 |

## Events

```ts
export const EVENT_CONFIG = {
  maxEventsPerDay: 1,
} as const;
```

Initial event definitions:

- `trainingRefusal`: rest improves morale and energy, strict drill improves strength but hurts morale and energy.
- `patricianVisit`: hosting costs treasury and improves ludus reputation, keeping routine reduces reputation.
- `medicusOffer`: paying improves selected injured gladiator health, declining reduces morale.
- `rivalRumors`: public response costs treasury and improves reputation, ignoring reduces reputation.
- `youngPromise`: extra coaching improves agility but costs energy, public praise improves morale and reputation.

## Time-of-Day Visuals

```ts
export type TimeOfDayPhase = 'dawn' | 'day' | 'dusk' | 'night';
```

Current hour mapping:

- `dawn`: 05:00 to 08:00;
- `day`: 08:00 to 18:00;
- `dusk`: 18:00 to 21:00;
- `night`: 21:00 to 05:00.

Visual themes are defined in `src/game-data/time-of-day.ts` with sky, terrain, overlay, light, shadow, torch opacity and sprite brightness values.

## Demo Saves

Demo save definitions live under `src/game-data/demo-saves`.

Current baseline scenarios:

- `demo-early-ludus`;
- `demo-mid-ludus`;
- `demo-advanced-ludus`.

Demo saves must follow the current save schema, remain deterministic and include stable visual identities for gladiators.

## Visual Data

Map layout, building visuals, decorations, gladiator visuals, animations and time-of-day data are game data.

They should remain centralized in modules such as:

- `src/game-data/map.ts`;
- `src/game-data/map-layout.ts`;
- `src/game-data/building-visuals.ts`;
- `src/game-data/decorations.ts`;
- `src/game-data/gladiator-visuals.ts`;
- `src/game-data/gladiator-animations.ts`;
- `src/game-data/time-of-day.ts`.
