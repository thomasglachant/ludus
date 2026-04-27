# Game Data

## Role

This document is the long-term source of truth for gameplay data, balance values and tunable rules.

Implementation balance constants live in `src/game-data/balance.ts` under `GAME_BALANCE`. When a balance value changes, update both `GAME_BALANCE` and this document so design intent and implementation stay aligned.

All future gameplay variables that affect economy, progression, training, combat, arena, market, planning, contracts, events, gauges, skills or building tuning must be added to `GAME_BALANCE` first. Other `src/game-data` modules may re-export slices of `GAME_BALANCE` or combine them with content definitions, but `src/domain`, `src/state`, `src/ui`, persistence and renderer code must not introduce new hardcoded balance values.

React components must not hardcode balancing values or gameplay formulas.

Large content tables such as event definitions, contract definitions, building definitions and visual layout data may stay in their dedicated `src/game-data` modules. Their reusable numeric tuning values should still come from `GAME_BALANCE` when they are expected to be adjusted during balancing.

## Economy

Currency: denarius.

The ludus money reserve is named `treasury` in code.

```ts
GAME_BALANCE.economy.initialTreasury = 500;
```

## Time and Progression

```ts
export const PROGRESSION_CONFIG = {
  weeksPerYear: 8,
  startingYear: 1,
  startingWeek: 1,
  startingDayOfWeek: 'monday',
  startingHour: 8,
  startingMinute: 0,
  initialSpeed: 1,
  initialIsPaused: false,
} as const;
```

```ts
GAME_BALANCE.time.gameSpeeds = [0, 1, 2, 4];
GAME_BALANCE.time.supportedGameSpeeds = [0, 1, 2, 4, 8, 16];
```

```ts
export const TIME_CONFIG = {
  realMillisecondsPerGameHour: 5_000,
  minutesPerHour: 60,
  hoursPerDay: 24,
  wakeUpHour: 6,
  sleepStartHour: 22,
  minimumTaskMinutes: 144,
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
- `dormitory`: purchased, level 1.
- `trainingGround`: purchased, level 1, default policy `balancedTraining`.
- `pleasureHall`: purchased, level 1, default policy `quietEvenings`.
- `infirmary`: purchased, level 1, default policy `basicCare`.

The Domus level is the source of truth for owned gladiator capacity. Each Domus level grants one roster place, capped at 6.

### Purchase and Upgrade Values

Current MVP building definitions include levels 1 and 2 for most buildings. Domus includes levels 1 through 6 because it drives global ludus capacity.

Level 1 purchase costs on base buildings are not used when creating a new game because those buildings start owned. Purchase costs remain part of building data so future optional buildings can start unpurchased and be bought later.

| Building        | Starts purchased | Level 1 purchase | Level 1 effect                                               | Level 2 requirement | Level 2 effect                                         |
| --------------- | ---------------- | ---------------: | ------------------------------------------------------------ | ------------------- | ------------------------------------------------------ |
| Domus           | Yes              |              n/a | `increaseCapacity +1` for `ludus`                            | Domus level 1       | `increaseCapacity +2` for `ludus`                      |
| Canteen         | Yes              |              120 | `increaseSatiety +6` per hour for assigned gladiator         | Domus level 2       | `increaseSatiety +8` per hour                          |
| Dormitory       | Yes              |              140 | `increaseEnergy +5` per hour                                 | Domus level 2       | `increaseEnergy +7` per hour                           |
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

### Ludus Capacity

The player cannot buy individual beds. Capacity comes only from the Domus level:

- Domus level 1 allows 1 owned gladiator.
- Each Domus upgrade adds 1 owned gladiator slot.
- Capacity is capped at 6 gladiators.
- Other buildings use the same global capacity direction; if the ludus can hold another gladiator, building assignment surfaces can support that larger roster.

```ts
export const LUDUS_CAPACITY_CONFIG = {
  minimumGladiators: 1,
  maximumGladiators: 6,
} as const;
```

Capacity formula:

```ts
capacity = Math.min(Math.max(domusLevel, minimumGladiators), maximumGladiators);
```

Dormitory upgrades and improvements can improve recovery, but they do not increase roster capacity.

## Building Improvements

Improvements are one of the main replacements for the removed budget system.

Improvement effects are permanent or contextual unless an effect explicitly declares `perHour: true`. Current improvement data has no hourly effects; purchased improvements instead expose persistent modifiers such as capacity, readiness support, stat focus or injury-risk reduction through domain helpers.

| ID                     | Building        | Cost | Required level | Required improvements | Effects                                   |
| ---------------------- | --------------- | ---: | -------------: | --------------------- | ----------------------------------------- |
| `betterKitchen`        | Canteen         |   90 |              1 | n/a                   | `increaseSatiety +2` assigned gladiator   |
| `proteinRations`       | Canteen         |  130 |              1 | n/a                   | `increaseStrength +1` assigned gladiator  |
| `grainStorage`         | Canteen         |  110 |              1 | n/a                   | `increaseSatiety +1` all gladiators       |
| `strawBeds`            | Dormitory       |   70 |              1 | n/a                   | `increaseEnergy +1` assigned gladiator    |
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

Policy `cost` is a selection cost paid immediately when the player changes to that policy. The cost is not a recurring hourly or daily budget. Selecting the already active policy is a no-op and does not charge treasury.

Policy effects are permanent or contextual unless an effect explicitly declares `perHour: true`. Current policy data has no hourly effects; selected policies expose contextual modifiers through domain helpers and are displayed in building panels.

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

## Building Effect Semantics

Building effects use a shared model across levels, improvements and policies.

```ts
export interface BuildingEffect {
  type: BuildingEffectType;
  value: number;
  perHour?: boolean;
  target?: 'assignedGladiator' | 'allGladiators' | 'ludus';
}
```

Effect timing convention:

- `perHour: true` means the effect is applied by the hourly game tick.
- absence of `perHour` means the effect is permanent or contextual and must not be applied by the hourly tick.

Effect source convention:

- building level effects are usually hourly operational effects, such as the Canteen restoring satiety for assigned gladiators;
- improvement effects are purchased permanent/contextual effects unless explicitly marked hourly;
- policy effects are selected permanent/contextual weekly modifiers unless explicitly marked hourly.

Effect target convention:

- `assignedGladiator`: affects gladiators assigned to the building or modifies their contextual scoring;
- `allGladiators`: affects the full roster or provides a roster-wide contextual modifier;
- `ludus`: affects school-level values such as capacity.

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

Gladiator skills store fractional training progress. A gladiator gains one effective visible skill level after `100` training progress points.

Training Ground level effects currently grant:

| Training Ground level | Skill progress per hour | Energy cost per hour |
| --------------------: | ----------------------: | -------------------: |
|                     1 |                       1 |                    4 |
|                     2 |                       2 |                    4 |

At level 1 and normal intensity, one hour of training gives `1` progress point, so a full effective skill level requires `100` hours before intensity and other modifiers.

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
  winnerMoraleChange: 15,
  loserMoraleChange: -8,
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
  dailyEventStartHour: 10,
  maxEventsPerDay: 1,
  injuredHealthThreshold: 80,
  resolvedEventHistoryLimit: 12,
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

- `dawn`: 06:00 to 08:00;
- `day`: 08:00 to 21:00;
- `dusk`: 21:00 to 22:00;
- `night`: 22:00 to 06:00.

The player-facing HUD presents these phases as a day-night cycle gauge instead
of an exact clock. Hour and minute values remain internal timing data for rules
that still need precise advancement.

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
