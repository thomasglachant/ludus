import type { BuildingId } from '../domain/buildings/types';
import type { ArenaRank } from '../domain/combat/types';
import type { GladiatorTrait } from '../domain/gladiators/types';
import type { GladiatorWeeklyObjective, TrainingIntensity } from '../domain/planning/types';
import type { DayOfWeek, GameSpeed } from '../domain/time/types';

export const GAME_BALANCE = {
  economy: {
    // Denarii available when a new ludus save is created.
    initialTreasury: 500,
    // Ludus reputation assigned to a brand-new save.
    initialReputation: 0,
    // Lower clamp for treasury changes from events and actions.
    minimumTreasury: 0,
    // Lower clamp for ludus and gladiator reputation changes.
    minimumReputation: 0,
  },

  progression: {
    // Number of weeks played before the campaign year increments.
    weeksPerYear: 8,
    // Campaign year used when a new save starts.
    startingYear: 1,
    // Campaign week used when a new save starts.
    startingWeek: 1,
    // Weekday used when a new save starts.
    startingDayOfWeek: 'monday' satisfies DayOfWeek,
    // Hour used when a new save starts.
    startingHour: 8,
    // Minute used when a new save starts.
    startingMinute: 0,
    // Default time speed used by new saves and resumed copied saves.
    initialSpeed: 1 satisfies GameSpeed,
    // Pause flag used by new saves and resumed copied saves.
    initialIsPaused: false,
  },

  time: {
    // Game speeds exposed by the player time controls.
    gameSpeeds: [0, 1, 4] as const satisfies readonly GameSpeed[],
    // Game speeds accepted by save validation, including internal fast-forward values.
    supportedGameSpeeds: [0, 1, 4, 8, 16, 32, 48] as const satisfies readonly GameSpeed[],
    // Ordered weekdays used by time progression and weekly systems.
    daysOfWeek: [
      // First playable weekday of a new week.
      'monday',
      // Second playable weekday of a new week.
      'tuesday',
      // Third playable weekday of a new week.
      'wednesday',
      // Fourth playable weekday of a new week.
      'thursday',
      // Fifth playable weekday of a new week.
      'friday',
      // Sixth playable weekday of a new week.
      'saturday',
      // Arena day and final weekday of a new week.
      'sunday',
    ] as const satisfies readonly DayOfWeek[],
    // Real milliseconds required for one game hour at x1 speed.
    realMillisecondsPerGameHour: 5_000,
    // Number of in-game minutes in one in-game hour.
    minutesPerHour: 60,
    // Number of in-game hours in one in-game day.
    hoursPerDay: 24,
    // Hour at which dawn lighting starts.
    dawnStartHour: 6,
    // Hour at which day lighting starts.
    dayStartHour: 8,
    // Hour at which dusk lighting starts.
    duskStartHour: 21,
    // Hour at which night lighting starts.
    nightStartHour: 22,
    // Hour at which the next-day fast-forward stops before dawn routines resume.
    nextDayAdvanceTargetHour: 5,
    // Minute at which the next-day fast-forward stops before dawn routines resume.
    nextDayAdvanceTargetMinute: 45,
    // Hour at which gladiators wake up after night sleep.
    wakeUpHour: 6,
    // Minute at which gladiators wake up after night sleep.
    wakeUpMinute: 30,
    // Hour at which night sleep begins.
    sleepStartHour: 22,
    // Minimum time a gladiator remains on a task before auto reassignment.
    minimumTaskMinutes: 144,
  },

  map: {
    // In-game minutes spent by gladiators when walking from one grid cell to the next.
    movementMinutesPerTile: 1,
  },

  gladiators: {
    gauges: {
      // Minimum value for health, energy, morale and satiety gauges.
      minimum: 0,
      // Maximum value for health, energy, morale and satiety gauges.
      maximum: 100,
      // Minimum health used when a combat participant must remain alive.
      minimumAliveHealth: 1,
    },
    skills: {
      // Skill names that can gain training progress.
      names: ['strength', 'agility', 'defense'] as const,
      // Minimum stored skill value.
      minimum: 0,
      // Maximum stored skill value.
      maximum: 100,
      // Progress points required to gain one effective skill level.
      progressPointsPerLevel: 100,
      // Maximum displayed fractional progress before the next level.
      maximumDisplayedProgress: 99,
    },
    marketDefaults: {
      // Health assigned to newly generated market gladiators.
      health: 100,
      // Energy assigned to newly generated market gladiators.
      energy: 100,
      // Morale assigned to newly generated market gladiators.
      morale: 100,
      // Satiety assigned to newly generated market gladiators.
      satiety: 80,
      // Reputation assigned to newly generated market gladiators.
      reputation: 0,
      // Wins assigned to newly generated market gladiators.
      wins: 0,
      // Losses assigned to newly generated market gladiators.
      losses: 0,
    },
    opponentDefaults: {
      // Energy assigned to generated arena opponents.
      energy: 100,
      // Health assigned to generated arena opponents.
      health: 100,
      // Morale assigned to generated arena opponents.
      morale: 75,
      // Satiety assigned to generated arena opponents.
      satiety: 80,
      // Wins assigned to generated arena opponents.
      wins: 0,
      // Losses assigned to generated arena opponents.
      losses: 0,
    },
  },

  training: {
    intensityEffects: {
      light: {
        // Skill progress multiplier for light training.
        statMultiplier: 1,
        // Energy cost multiplier for light training.
        energyCostMultiplier: 0.5,
        // Morale cost per training hour for light training.
        moraleCost: 0,
      },
      normal: {
        // Skill progress multiplier for normal training.
        statMultiplier: 1,
        // Energy cost multiplier for normal training.
        energyCostMultiplier: 1,
        // Morale cost per training hour for normal training.
        moraleCost: 0,
      },
      hard: {
        // Skill progress multiplier for hard training.
        statMultiplier: 2,
        // Energy cost multiplier for hard training.
        energyCostMultiplier: 1.5,
        // Morale cost per training hour for hard training.
        moraleCost: 0,
      },
      brutal: {
        // Skill progress multiplier for brutal training.
        statMultiplier: 3,
        // Energy cost multiplier for brutal training.
        energyCostMultiplier: 2,
        // Morale cost per training hour for brutal training.
        moraleCost: 1,
      },
    } as const satisfies Record<
      TrainingIntensity,
      { statMultiplier: number; energyCostMultiplier: number; moraleCost: number }
    >,
  },

  buildings: {
    upgradeCost: {
      // Base denarii cost used by the generic building upgrade formula.
      baseCost: 150,
      // Exponential multiplier applied for each target level above level 1.
      growthFactor: 2.2,
    },
    capacity: {
      // Minimum owned gladiator capacity when Domus is available.
      minimumGladiators: 1,
      // Maximum owned gladiator capacity granted by Domus progression.
      maximumGladiators: 6,
    },
    levelEffects: {
      domus: {
        // Ludus capacity granted by Domus level 1.
        1: { capacity: 1 },
        // Ludus capacity granted by Domus level 2.
        2: { capacity: 2 },
        // Ludus capacity granted by Domus level 3.
        3: { capacity: 3 },
        // Ludus capacity granted by Domus level 4.
        4: { capacity: 4 },
        // Ludus capacity granted by Domus level 5.
        5: { capacity: 5 },
        // Ludus capacity granted by Domus level 6.
        6: { capacity: 6 },
      },
      canteen: {
        // Satiety restored per hour by Canteen level 1.
        1: { satietyPerHour: 100 },
        // Satiety restored per hour by Canteen level 2.
        2: { satietyPerHour: 100 },
      },
      dormitory: {
        // Energy restored per hour by Dormitory level 1.
        1: { energyPerHour: 5 },
        // Energy restored per hour by Dormitory level 2.
        2: { energyPerHour: 7 },
      },
      trainingGround: {
        1: {
          // Skill progress points gained per training hour at Training Ground level 1.
          skillProgressPerHour: 1,
          // Energy spent per training hour at Training Ground level 1.
          energyCostPerHour: 4,
        },
        2: {
          // Skill progress points gained per training hour at Training Ground level 2.
          skillProgressPerHour: 2,
          // Energy spent per training hour at Training Ground level 2.
          energyCostPerHour: 4,
        },
      },
      pleasureHall: {
        // Morale restored per hour by Pleasure Hall level 1.
        1: { moralePerHour: 5 },
        // Morale restored per hour by Pleasure Hall level 2.
        2: { moralePerHour: 7 },
      },
      infirmary: {
        // Health restored per hour by Infirmary level 1.
        1: { healthPerHour: 10 },
        2: {
          // Health restored per hour by Infirmary level 2.
          healthPerHour: 10,
          // Injury-risk reduction granted by Infirmary level 2.
          injuryRiskReduction: 5,
        },
      },
    },
    activityNeedsPerHour: {
      domus: {
        // Satiety change per hour while assigned to Domus.
        satiety: -1,
        // Morale change per hour while assigned to Domus.
        morale: 0,
      },
      canteen: {
        // Satiety change per hour while assigned to Canteen.
        satiety: 0,
        // Morale change per hour while assigned to Canteen.
        morale: 1,
      },
      dormitory: {
        // Satiety change per hour while assigned to Dormitory.
        satiety: -1,
        // Morale change per hour while assigned to Dormitory.
        morale: 0,
      },
      trainingGround: {
        // Satiety change per hour while assigned to Training Ground.
        satiety: -6,
        // Morale change per hour while assigned to Training Ground.
        morale: -4,
      },
      pleasureHall: {
        // Satiety change per hour while assigned to Pleasure Hall.
        satiety: -3,
        // Morale change per hour while assigned to Pleasure Hall.
        morale: 0,
      },
      infirmary: {
        // Satiety change per hour while assigned to Infirmary.
        satiety: -1,
        // Morale change per hour while assigned to Infirmary.
        morale: -3,
      },
    } as const satisfies Record<BuildingId, { satiety: number; morale: number }>,
  },

  market: {
    // Number of gladiators offered by the market each week.
    availableGladiatorCount: 5,
    // Minimum age for generated market gladiators.
    minAge: 16,
    // Maximum age for generated market gladiators.
    maxAge: 20,
    // Total strength, agility and defense points distributed on generation.
    totalStatPoints: 20,
    // Minimum generated value for each market gladiator skill.
    minGeneratedStat: 1,
    // Maximum generated value for each market gladiator skill.
    maxGeneratedStat: 10,
    // Flat denarii cost added to every market price.
    basePrice: 100,
    // Denarii added to market price per reputation point.
    reputationPriceMultiplier: 5,
    // Denarii added to market price per effective skill point.
    statPriceMultiplier: 10,
    // Fraction of market price returned when selling a gladiator.
    saleValueMultiplier: 0.5,
    // Trait pool used by generated market gladiators.
    generatedTraitPool: [
      // Trait making the gladiator thematically disciplined.
      'disciplined',
      // Trait making the gladiator thematically lazy.
      'lazy',
      // Trait making the gladiator thematically brave.
      'brave',
      // Trait making the gladiator thematically cowardly.
      'cowardly',
      // Trait making the gladiator thematically ambitious.
      'ambitious',
      // Trait making the gladiator thematically fragile.
      'fragile',
      // Trait making the gladiator thematically popular with crowds.
      'crowdFavorite',
      // Trait making the gladiator thematically prone to rivalry.
      'rivalrous',
      // Trait making the gladiator thematically stoic.
      'stoic',
    ] as const satisfies readonly GladiatorTrait[],
  },

  arena: {
    // Weekday on which arena fights happen.
    dayOfWeek: 'sunday' satisfies DayOfWeek,
    // Hour at which arena day starts and interrupts normal time flow.
    startHour: 6,
    // Hour set when the player completes the arena day summary.
    endHour: 20,
    // Minimum health required for a gladiator to receive a fight.
    minimumEligibleHealth: 1,
    // Base denarii reward used to calculate the odds-based victory bonus for each arena rank.
    rewards: {
      // Base victory reward for the lowest bronze rank.
      bronze3: 80,
      // Base victory reward for the middle bronze rank.
      bronze2: 120,
      // Base victory reward for the highest bronze rank.
      bronze1: 180,
      // Base victory reward for the lowest silver rank.
      silver3: 260,
      // Base victory reward for the middle silver rank.
      silver2: 380,
      // Base victory reward for the highest silver rank.
      silver1: 540,
      // Base victory reward for the lowest gold rank.
      gold3: 760,
      // Base victory reward for the middle gold rank.
      gold2: 1050,
      // Base victory reward for the highest gold rank.
      gold1: 1400,
    } as const satisfies Record<ArenaRank, number>,
    // Fixed participation bonus paid by arena rank.
    participationRewards: {
      // Participation reward for the lowest bronze rank.
      bronze3: 20,
      // Participation reward for the middle bronze rank.
      bronze2: 30,
      // Participation reward for the highest bronze rank.
      bronze1: 45,
      // Participation reward for the lowest silver rank.
      silver3: 65,
      // Participation reward for the middle silver rank.
      silver2: 95,
      // Participation reward for the highest silver rank.
      silver1: 135,
      // Participation reward for the lowest gold rank.
      gold3: 190,
      // Participation reward for the middle gold rank.
      gold2: 260,
      // Participation reward for the highest gold rank.
      gold1: 350,
    } as const satisfies Record<ArenaRank, number>,
    // Fraction of the rank base reward multiplied by decimal odds to create the victory bonus.
    victoryOddsRewardMultiplier: 0.42,
    // Public stake modifier spread applied to the victory bonus, in denarii.
    publicStakeModifierSpread: 20,
    rankThresholds: [
      {
        // Arena rank unlocked by the first reputation threshold.
        rank: 'bronze3',
        // Reputation needed for bronze 3.
        minimumReputation: 0,
      },
      {
        // Arena rank unlocked by the second reputation threshold.
        rank: 'bronze2',
        // Reputation needed for bronze 2.
        minimumReputation: 25,
      },
      {
        // Arena rank unlocked by the third reputation threshold.
        rank: 'bronze1',
        // Reputation needed for bronze 1.
        minimumReputation: 50,
      },
      {
        // Arena rank unlocked by the fourth reputation threshold.
        rank: 'silver3',
        // Reputation needed for silver 3.
        minimumReputation: 100,
      },
      {
        // Arena rank unlocked by the fifth reputation threshold.
        rank: 'silver2',
        // Reputation needed for silver 2.
        minimumReputation: 150,
      },
      {
        // Arena rank unlocked by the sixth reputation threshold.
        rank: 'silver1',
        // Reputation needed for silver 1.
        minimumReputation: 225,
      },
      {
        // Arena rank unlocked by the seventh reputation threshold.
        rank: 'gold3',
        // Reputation needed for gold 3.
        minimumReputation: 325,
      },
      {
        // Arena rank unlocked by the eighth reputation threshold.
        rank: 'gold2',
        // Reputation needed for gold 2.
        minimumReputation: 450,
      },
      {
        // Arena rank unlocked by the ninth reputation threshold.
        rank: 'gold1',
        // Reputation needed for gold 1.
        minimumReputation: 600,
      },
    ] as const,
  },

  combat: {
    // Maximum turns before combat is force-resolved by remaining health.
    maxTurns: 40,
    // Base chance to hit before agility modifiers.
    baseHitChance: 0.65,
    // Hit chance gained per attacker agility point.
    attackerAgilityHitMultiplier: 0.003,
    // Hit chance removed per defender agility point.
    defenderAgilityDodgeMultiplier: 0.002,
    // Lower clamp for hit chance.
    minHitChance: 0.1,
    // Upper clamp for hit chance.
    maxHitChance: 0.95,
    // Base damage before strength modifiers.
    baseDamage: 5,
    // Damage added per attacker strength point.
    strengthDamageMultiplier: 0.4,
    // Damage removed per defender defense point.
    defenseReductionMultiplier: 0.2,
    // Lower clamp for resolved damage.
    minDamage: 1,
    // Upper clamp for resolved damage.
    maxDamage: 40,
    // Portion of lost combat health restored when the player wins.
    winnerHealthRecoveryRatio: 0.25,
    // Minimum final health after losing a combat.
    loserMinimumHealth: 1,
    // Base energy spent by a fight before turn scaling.
    baseEnergyCost: 12,
    // Additional energy spent per combat turn.
    energyCostPerTurn: 0.45,
    // Lower clamp for fight energy cost.
    minEnergyCost: 8,
    // Upper clamp for fight energy cost.
    maxEnergyCost: 34,
    // Morale change applied after a win.
    winnerMoraleChange: 15,
    // Morale change applied after a loss.
    loserMoraleChange: -8,
    // Reputation value of each win.
    winReputationValue: 10,
    // Reputation penalty of each loss.
    lossReputationPenalty: 3,
    opponentByRank: {
      bronze3: {
        // Opponent stat multiplier at bronze 3.
        statMultiplier: 0.9,
        // Opponent reputation at bronze 3.
        reputation: 0,
      },
      bronze2: {
        // Opponent stat multiplier at bronze 2.
        statMultiplier: 0.96,
        // Opponent reputation at bronze 2.
        reputation: 25,
      },
      bronze1: {
        // Opponent stat multiplier at bronze 1.
        statMultiplier: 1.03,
        // Opponent reputation at bronze 1.
        reputation: 50,
      },
      silver3: {
        // Opponent stat multiplier at silver 3.
        statMultiplier: 1.08,
        // Opponent reputation at silver 3.
        reputation: 100,
      },
      silver2: {
        // Opponent stat multiplier at silver 2.
        statMultiplier: 1.14,
        // Opponent reputation at silver 2.
        reputation: 150,
      },
      silver1: {
        // Opponent stat multiplier at silver 1.
        statMultiplier: 1.2,
        // Opponent reputation at silver 1.
        reputation: 225,
      },
      gold3: {
        // Opponent stat multiplier at gold 3.
        statMultiplier: 1.27,
        // Opponent reputation at gold 3.
        reputation: 325,
      },
      gold2: {
        // Opponent stat multiplier at gold 2.
        statMultiplier: 1.34,
        // Opponent reputation at gold 2.
        reputation: 450,
      },
      gold1: {
        // Opponent stat multiplier at gold 1.
        statMultiplier: 1.42,
        // Opponent reputation at gold 1.
        reputation: 600,
      },
    } as const satisfies Record<ArenaRank, { statMultiplier: number; reputation: number }>,
    opponentGeneration: {
      // Random stat offset spread added after rank scaling.
      statRandomOffsetSpread: 3,
      // Minimum generated arena opponent skill.
      minGeneratedStat: 3,
      // Maximum generated arena opponent skill.
      maxGeneratedStat: 100,
      // Minimum generated arena opponent age.
      minAge: 18,
      // Maximum generated arena opponent age.
      maxAge: 34,
    },
    participantRating: {
      // Strength multiplier used by projected win chance.
      strengthWeight: 1.15,
      // Health multiplier used by projected win chance.
      healthWeight: 0.24,
      // Energy multiplier used by projected win chance.
      energyWeight: 0.18,
      // Morale multiplier used by projected win chance.
      moraleWeight: 0.08,
    },
    projectedWinChance: {
      // Lower clamp for projected player win chance shown in betting.
      minimum: 0.15,
      // Upper clamp for projected player win chance shown in betting.
      maximum: 0.85,
    },
  },

  betting: {
    // First weekday on which betting odds are visible.
    firstOddsDay: 'thursday' satisfies DayOfWeek,
    // Weekday from which scouting and betting actions are locked.
    lockDay: 'saturday' satisfies DayOfWeek,
    // Denarii paid to scout an opponent.
    scoutingCost: 25,
    // House edge removed from fair decimal odds.
    houseEdge: 0.08,
    // Minimum decimal odds displayed after house edge.
    minimumDecimalOdds: 1.1,
  },

  planning: {
    // Weekly objectives available in the planning UI.
    weeklyObjectives: [
      // Balanced objective for general training.
      'balanced',
      // Objective focused on strength training.
      'trainStrength',
      // Objective focused on agility training.
      'trainAgility',
      // Objective focused on defense training.
      'trainDefense',
      // Objective focused on recovery.
      'recovery',
      // Objective focused on morale support.
      'moraleBoost',
      // Objective focused on protecting a strong gladiator.
      'protectChampion',
      // Objective focused on improving sale conditions.
      'prepareForSale',
    ] as const satisfies readonly GladiatorWeeklyObjective[],
    // Training intensities available in the planning UI.
    trainingIntensities: [
      // Lowest training intensity.
      'light',
      // Baseline training intensity.
      'normal',
      // High training intensity.
      'hard',
      // Highest training intensity.
      'brutal',
    ] as const satisfies readonly TrainingIntensity[],
    thresholds: {
      // Health value at or below which health is critical.
      criticalHealth: 35,
      // Health value at or below which health is low.
      lowHealth: 55,
      // Energy value at or below which energy is critical.
      criticalEnergy: 30,
      // Energy value at or below which energy is low.
      lowEnergy: 50,
      // Satiety value at or below which satiety is critical.
      criticalSatiety: 25,
      // Satiety value at or below which satiety is low.
      lowSatiety: 50,
      // Morale value at or below which morale is critical.
      criticalMorale: 30,
      // Morale value at or below which morale is low.
      lowMorale: 50,
      // Primary need value at or below which automatic assignment changes activity.
      primaryNeedReassignment: 10,
    },
    defaultRoutine: {
      // Weekly objective assigned to new gladiator routines.
      objective: 'balanced' satisfies GladiatorWeeklyObjective,
      // Training intensity assigned to new gladiator routines.
      intensity: 'normal' satisfies TrainingIntensity,
      // Whether new routines allow automatic building assignment.
      allowAutomaticAssignment: true,
    },
  },

  events: {
    // First hour at which a daily event may appear.
    dailyEventStartHour: 10,
    // Hour at which daily events stop appearing.
    dailyEventEndHour: 19,
    // Maximum pending events generated on a single day.
    maxEventsPerDay: 1,
    // Maximum generated events during a single week.
    maxEventsPerWeek: 3,
    // Default relative weight used when selecting one event definition.
    defaultSelectionWeightPercent: 100,
    // Default game-week cooldown before the same event definition can reappear.
    defaultCooldownWeeks: 4,
    // Number of launched event records kept to enforce cooldowns across saves.
    launchedEventHistoryLimit: 128,
    // Chance that an event appears on each weekday once other limits allow it.
    dailyEventProbabilityByDay: {
      monday: 0.1,
      tuesday: 0.25,
      wednesday: 0.25,
      thursday: 0.25,
      friday: 0.25,
      saturday: 0.1,
      sunday: 0,
    } satisfies Record<DayOfWeek, number>,
    // Health threshold below which a gladiator counts as injured for events.
    injuredHealthThreshold: 80,
    // Number of resolved or expired events kept in save history.
    resolvedEventHistoryLimit: 12,
  },
} as const;
