import type { ArenaRank } from '../domain/combat/types';
import type { GladiatorTrait } from '../domain/gladiators/types';
import type { StaffType } from '../domain/staff/types';
import type { DayOfWeek } from '../domain/time/types';

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
  },

  time: {
    // First displayed hour of an automatically simulated day.
    dayStartHour: 8,
    // Hour at which the current day is resolved and the next day starts.
    dayEndHour: 20,
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
    // In-game minutes advanced every real-time second while the game is not paused.
    minutesPerRealSecond: 30,
  },

  planning: {
    taskDefaultPoints: {
      strengthTraining: 3,
      agilityTraining: 2,
      defenseTraining: 2,
      lifeTraining: 2,
      leisure: 1,
      care: 1,
    },
  },

  gladiators: {
    gauges: {
      // Minimum value for temporary combat gauges.
      minimum: 0,
      // Maximum value for temporary combat gauges.
      maximum: 100,
      // Minimum health used when a combat participant must remain alive.
      minimumAliveHealth: 1,
    },
    skills: {
      // Skill names that can gain training progress.
      names: ['strength', 'agility', 'defense', 'life'] as const,
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
      // Reputation assigned to newly generated market gladiators.
      reputation: 0,
      // Wins assigned to newly generated market gladiators.
      wins: 0,
      // Losses assigned to newly generated market gladiators.
      losses: 0,
    },
    opponentDefaults: {
      // Wins assigned to generated arena opponents.
      wins: 0,
      // Losses assigned to generated arena opponents.
      losses: 0,
    },
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
      // Minimum staff capacity when Domus is available.
      minimumStaff: 3,
      // Maximum staff capacity granted by Domus progression.
      maximumStaff: 18,
      // Staff places granted per Domus level.
      staffPerDomusLevel: 3,
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
      dormitory: {
        // Passive daily gladiator planning points and happiness support granted by Dormitory level 1.
        1: { dailyGladiatorPoints: 1, happiness: 2 },
        // Passive daily gladiator planning points and happiness support granted by Dormitory level 2.
        2: { dailyGladiatorPoints: 2, happiness: 3 },
        // Passive daily gladiator planning points and happiness support granted by Dormitory level 3.
        3: { dailyGladiatorPoints: 3, happiness: 2 },
        // Passive daily gladiator planning points and rebellion support granted by Dormitory level 4.
        4: { dailyGladiatorPoints: 4, rebellionReduction: 2 },
        // Passive daily gladiator planning points and staff support granted by Dormitory level 5.
        5: { dailyGladiatorPoints: 5, staffEfficiency: 5 },
      },
      canteen: {
        // Passive daily gladiator planning points granted by Canteen level 1.
        1: { dailyGladiatorPoints: 1 },
        // Passive daily gladiator planning points granted by Canteen level 2.
        2: { dailyGladiatorPoints: 2 },
        // Passive daily gladiator planning points and happiness support granted by Canteen level 3.
        3: { dailyGladiatorPoints: 3, happiness: 2 },
        // Passive daily gladiator planning points and expense support granted by Canteen level 4.
        4: { dailyGladiatorPoints: 4, expenseReduction: 5 },
        // Passive daily gladiator planning points and production support granted by Canteen level 5.
        5: { dailyGladiatorPoints: 5, production: 5 },
      },
      trainingGround: {
        1: {
          // Skill progress support granted by Training Ground level 1.
          skillProgressPerPoint: 1,
          // Injury-risk pressure applied by Training Ground level 1.
          injuryRiskPerPoint: 4,
        },
        2: {
          // Skill progress support granted by Training Ground level 2.
          skillProgressPerPoint: 2,
          // Injury-risk pressure applied by Training Ground level 2.
          injuryRiskPerPoint: 4,
        },
      },
      pleasureHall: {
        // Ludus happiness support granted by Pleasure Hall level 1.
        1: { happiness: 5 },
        // Ludus happiness support granted by Pleasure Hall level 2.
        2: { happiness: 7 },
      },
      infirmary: {
        // Injury-risk reduction granted by Infirmary level 1.
        1: { injuryRiskReduction: 4 },
        2: {
          // Injury-risk reduction granted by Infirmary level 2.
          injuryRiskReduction: 5,
        },
      },
    },
  },

  macroSimulation: {
    baseDailyGladiatorPoints: 6,
    baseDailyLaborPoints: 8,
    baseDailyAdminPoints: 0,
    idealTrainingPressurePointsPerGladiator: 4,
    maximumTrainingEfficiencyMultiplier: 1.25,
    trainingInjuryChancePerPoint: 0.015,
    trainingFocus: {
      strength: {
        progressMultiplier: 1.15,
        pressureMultiplier: 1.15,
      },
      agility: {
        progressMultiplier: 1.05,
        pressureMultiplier: 1,
      },
      defense: {
        progressMultiplier: 1,
        pressureMultiplier: 0.9,
      },
      life: {
        progressMultiplier: 0.85,
        pressureMultiplier: 0.75,
      },
    },
    heavyScheduleHappinessPenalty: 2,
    productionIncomePerPoint: 8,
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
  },

  events: {
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
    // Number of resolved or expired events kept in save history.
    resolvedEventHistoryLimit: 12,
  },

  market: {
    // Number of gladiators offered by the market each week.
    availableGladiatorCount: 20,
    // Minimum age for generated market gladiators.
    minAge: 16,
    // Maximum age for generated market gladiators.
    maxAge: 20,
    // Minimum total skill points distributed on generated market gladiators.
    minGeneratedTotalStatPoints: 16,
    // Maximum total skill points distributed on generated market gladiators.
    maxGeneratedTotalStatPoints: 34,
    // Legacy baseline used by tests and docs as the midpoint of generated market stat totals.
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

  staffMarket: {
    // Number of generated candidates for each staff type each week.
    candidatesPerType: 20,
    // Legacy aggregate staff market count retained for older references.
    availableStaffCount: 60,
    // Candidate type rotation used by weekly staff market generation.
    typePool: ['slave', 'slave', 'guard', 'trainer'] as const satisfies readonly StaffType[],
    basePriceByType: {
      slave: 85,
      guard: 150,
      trainer: 220,
    } as const satisfies Record<StaffType, number>,
    weeklyWageByType: {
      slave: 0,
      guard: 32,
      trainer: 48,
    } as const satisfies Record<StaffType, number>,
    // Minimum starting building experience assigned to generated staff.
    minGeneratedExperience: 2,
    // Maximum starting building experience assigned to generated staff.
    maxGeneratedExperience: 10,
    // Denarii added to staff market price per generated building experience point.
    experiencePriceMultiplier: 8,
    // Fraction of weekly wage added to staff market price.
    weeklyWagePriceMultiplier: 2,
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
    // Fraction of the rank base reward multiplied by decimal odds to create the victory bonus.
    victoryOddsRewardMultiplier: 0.42,
    // Public stake modifier spread applied to the victory bonus, in denarii.
    publicStakeModifierSpread: 20,
    odds: {
      // House edge removed from fair decimal odds.
      houseEdge: 0.08,
      // Minimum decimal odds displayed after house edge.
      minimumDecimalOdds: 1.1,
    },
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
    // Base combat health before life aptitude scaling.
    baseHealth: 40,
    // Combat health added per life aptitude point.
    lifeHealthMultiplier: 4,
    // Base combat energy before aptitude scaling.
    baseEnergy: 35,
    // Combat energy added per strength aptitude point.
    strengthEnergyMultiplier: 1.2,
    // Combat energy added per agility aptitude point.
    agilityEnergyMultiplier: 1.6,
    // Combat energy added per life aptitude point.
    lifeEnergyMultiplier: 0.8,
    // Baseline morale used only during combat resolution.
    baseMorale: 70,
    // Reputation value of each win.
    winReputationValue: 10,
    // Reputation penalty of each loss.
    lossReputationPenalty: 3,
    opponentByRank: {
      bronze3: {
        // Opponent reputation at bronze 3.
        reputation: 0,
      },
      bronze2: {
        // Opponent reputation at bronze 2.
        reputation: 25,
      },
      bronze1: {
        // Opponent reputation at bronze 1.
        reputation: 50,
      },
      silver3: {
        // Opponent reputation at silver 3.
        reputation: 100,
      },
      silver2: {
        // Opponent reputation at silver 2.
        reputation: 150,
      },
      silver1: {
        // Opponent reputation at silver 1.
        reputation: 225,
      },
      gold3: {
        // Opponent reputation at gold 3.
        reputation: 325,
      },
      gold2: {
        // Opponent reputation at gold 2.
        reputation: 450,
      },
      gold1: {
        // Opponent reputation at gold 1.
        reputation: 600,
      },
    } as const satisfies Record<ArenaRank, { reputation: number }>,
    opponentGeneration: {
      // Minimum relative multiplier applied to generated opponent skills.
      relativeSkillMultiplierMin: 0.8,
      // Maximum relative multiplier applied to generated opponent skills.
      relativeSkillMultiplierMax: 1.2,
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
      // Combat health multiplier used by projected win chance.
      healthWeight: 0.24,
      // Combat energy multiplier used by projected win chance.
      energyWeight: 0.18,
      // Combat morale multiplier used by projected win chance.
      moraleWeight: 0.08,
    },
    projectedWinChance: {
      // Lower clamp for projected player win chance used by arena odds.
      minimum: 0.15,
      // Upper clamp for projected player win chance used by arena odds.
      maximum: 0.85,
    },
  },
} as const;
