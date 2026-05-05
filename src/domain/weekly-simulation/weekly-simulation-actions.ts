import { GAME_BALANCE } from '../../game-data/balance';
import { DAYS_OF_WEEK } from '../../game-data/time';
import { refreshGameAlerts } from '../alerts/alert-actions';
import { addGladiatorExperience } from '../gladiators/progression';
import type { Gladiator } from '../gladiators/types';
import { createMarketState } from '../market/market-actions';
import {
  addGameNotification,
  addGladiatorLevelUpNotifications,
} from '../notifications/notification-actions';
import type { GameSave } from '../saves/types';
import type { DayOfWeek, GameTimeState, PendingActionTrigger } from '../time/types';
import { getCombatInjuryChance, startArenaDay } from '../combat/combat-actions';
import { synchronizeMacroEvents } from '../events/event-actions';
import {
  calculateBuildingActivityImpact,
  getBuildingActivityContributions,
} from '../buildings/building-activities';
import { sumActiveBuildingEffectValues } from '../buildings/building-effects';
import {
  addLedgerEntry,
  createLedgerEntry,
  createEmptyProjection,
  updateCurrentWeekSummary,
} from '../economy/economy-actions';
import type { BuildingEffect, BuildingId } from '../buildings/types';
import type { EconomyCategory, WeeklyProjection } from '../economy/types';
import {
  createDefaultWeeklyPlan,
  getRemainingPlanningDays,
  synchronizePlanning,
} from '../planning/planning-actions';
import {
  applyGladiatorTrait,
  getRandomCombatInjuryDuration,
  getGladiatorInjuryRiskMultiplier,
  getGladiatorTrainingExperienceMultiplier,
  pruneExpiredTraits,
} from '../gladiator-traits/gladiator-trait-actions';
import type {
  DailyPlan,
  DailyPlanActivity,
  DailySimulationSummary,
  WeeklyReport,
} from '../planning/types';

type RandomSource = () => number;

export { createDefaultDailyPlan, createDefaultWeeklyPlan } from '../planning/planning-actions';

export interface RemainingWeeklyPlanProjection {
  expense: number;
  income: number;
  net: number;
  remainingDays: DayOfWeek[];
  report: WeeklyReport;
}

interface DailyLedgerDraft {
  amount: number;
  category: EconomyCategory;
  labelKey: string;
  buildingId?: BuildingId;
  relatedId?: string;
}

interface DailyResolutionOptions {
  createEvents: boolean;
  recordLedger: boolean;
}

interface DailyResolutionResult {
  expenseEntries: DailyLedgerDraft[];
  incomeEntries: DailyLedgerDraft[];
  save: GameSave;
  summary: DailySimulationSummary;
}

interface DailyGladiatorResolutionResult {
  gladiator: Gladiator;
  isInjured: boolean;
  isUnavailableForPhysicalActivities: boolean;
}

interface DailyGladiatorModifiers {
  injuryRiskMultiplier: number;
  injuryRiskReductionPercent: number;
  traitTrainingExperienceMultiplier: number;
  trainingExperienceBonusPercent: number;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function getPoints(plan: DailyPlan, activity: DailyPlanActivity) {
  return plan.gladiatorTimePoints[activity] + plan.laborPoints[activity];
}

function getTrainingPressurePoints(plan: DailyPlan) {
  return plan.gladiatorTimePoints.training;
}

function getAverageTrainingPressurePoints(plan: DailyPlan, gladiatorPointDivisor: number) {
  return getTrainingPressurePoints(plan) / gladiatorPointDivisor;
}

function getTrainingLoadScale(plan: DailyPlan, gladiatorPointDivisor: number) {
  const averageTrainingPressurePoints = getAverageTrainingPressurePoints(
    plan,
    gladiatorPointDivisor,
  );
  const maximumTrainingPressurePoints =
    GAME_BALANCE.macroSimulation.idealTrainingPressurePointsPerGladiator *
    GAME_BALANCE.macroSimulation.maximumTrainingEfficiencyMultiplier;

  if (averageTrainingPressurePoints <= maximumTrainingPressurePoints) {
    return 1;
  }

  return maximumTrainingPressurePoints / averageTrainingPressurePoints;
}

function getTrainingExperiencePoints(
  plan: DailyPlan,
  gladiatorPointDivisor: number,
  trainingLoadScale: number,
) {
  return (getTrainingPressurePoints(plan) / gladiatorPointDivisor) * trainingLoadScale;
}

function getLudusEffectValue(save: GameSave, type: BuildingEffect['type']) {
  return sumActiveBuildingEffectValues(save, {
    target: 'ludus',
    type,
  });
}

function getAllGladiatorsEffectValue(save: GameSave, type: BuildingEffect['type']) {
  return sumActiveBuildingEffectValues(save, {
    target: 'allGladiators',
    type,
  });
}

function getPlannedGladiatorsEffectValue(save: GameSave, type: BuildingEffect['type']) {
  return sumActiveBuildingEffectValues(save, {
    target: 'plannedGladiators',
    type,
  });
}

function getPercentMultiplier(percent: number) {
  return Math.max(0, 1 + percent / 100);
}

function canGladiatorGainTrainingExperience(modifiers: DailyGladiatorModifiers) {
  return modifiers.traitTrainingExperienceMultiplier > 0;
}

function getFinanceCategoryForActivity(activity: DailyPlanActivity): EconomyCategory {
  if (activity === 'production') {
    return activity;
  }

  return 'other';
}

function addDailyDraftsToProjection(
  projection: WeeklyProjection,
  kind: 'income' | 'expense',
  entries: DailyLedgerDraft[],
): WeeklyProjection {
  const categoryKey = kind === 'income' ? 'incomeByCategory' : 'expenseByCategory';
  const categoryTotals = entries.reduce<Partial<Record<EconomyCategory, number>>>(
    (totals, entry) => {
      totals[entry.category] = (totals[entry.category] ?? 0) + entry.amount;
      return totals;
    },
    { ...projection[categoryKey] },
  );
  const total = entries.reduce((sum, entry) => sum + entry.amount, 0);

  return {
    ...projection,
    [categoryKey]: categoryTotals,
    net: kind === 'income' ? projection.net + total : projection.net - total,
  };
}

function createProjectionFromDailyDrafts(
  incomeEntries: DailyLedgerDraft[],
  expenseEntries: DailyLedgerDraft[],
) {
  return addDailyDraftsToProjection(
    addDailyDraftsToProjection(createEmptyProjection(), 'income', incomeEntries),
    'expense',
    expenseEntries,
  );
}

function addGladiatorInjuryNotification(save: GameSave, gladiatorId: string): GameSave {
  const gladiator = save.gladiators.find((candidate) => candidate.id === gladiatorId);

  if (!gladiator) {
    return save;
  }

  return addGameNotification(save, {
    titleKey: 'notifications.injury.title',
    descriptionKey: 'notifications.injury.description',
    params: { name: gladiator.name },
    target: { kind: 'gladiator', gladiatorId },
  });
}

function applyDailyGladiatorEffects(
  gladiator: Gladiator,
  plan: DailyPlan,
  modifiers: DailyGladiatorModifiers,
  random: RandomSource,
  gladiatorPointDivisor: number,
): DailyGladiatorResolutionResult {
  const canTrain = canGladiatorGainTrainingExperience(modifiers);
  const trainingLoadScale = getTrainingLoadScale(plan, gladiatorPointDivisor);
  const trainingPoints = canTrain
    ? getAverageTrainingPressurePoints(plan, gladiatorPointDivisor)
    : 0;
  const injuryChance =
    trainingPoints *
    GAME_BALANCE.macroSimulation.trainingInjuryChancePerPoint *
    Math.max(0.1, 1 - modifiers.injuryRiskReductionPercent / 100) *
    modifiers.injuryRiskMultiplier;
  const isInjured = trainingPoints > 0 && random() < injuryChance;
  const trainingExperience =
    canTrain && !isInjured
      ? getTrainingExperiencePoints(plan, gladiatorPointDivisor, trainingLoadScale) *
        GAME_BALANCE.gladiators.training.experiencePerPoint *
        getPercentMultiplier(modifiers.trainingExperienceBonusPercent) *
        modifiers.traitTrainingExperienceMultiplier
      : 0;

  return {
    gladiator: addGladiatorExperience(gladiator, trainingExperience),
    isInjured,
    isUnavailableForPhysicalActivities: !canTrain || isInjured,
  };
}

export function createWeeklyReport(save: GameSave, days: DailySimulationSummary[]): WeeklyReport {
  return {
    id: `report-${save.time.year}-${save.time.week}`,
    year: save.time.year,
    week: save.time.week,
    days,
    treasuryDelta: days.reduce((total, day) => total + day.treasuryDelta, 0),
    reputationDelta: days.reduce((total, day) => total + day.reputationDelta, 0),
    happinessDelta: days.reduce((total, day) => total + day.happinessDelta, 0),
    rebellionDelta: days.reduce((total, day) => total + day.rebellionDelta, 0),
    injuries: days.reduce((total, day) => total + day.injuredGladiatorIds.length, 0),
  };
}

function resolveDailyPlanInternal(
  save: GameSave,
  plan = save.planning.days[save.time.dayOfWeek],
  random: RandomSource = Math.random,
  options: DailyResolutionOptions,
): DailyResolutionResult {
  const buildingActivityContributions = getBuildingActivityContributions(save, plan);
  const buildingActivityImpact = calculateBuildingActivityImpact(save, plan);
  const baseModifiers = {
    injuryRiskReductionPercent:
      getAllGladiatorsEffectValue(save, 'reduceInjuryRisk') +
      buildingActivityImpact.injuryRiskReductionPercent,
    trainingExperienceBonusPercent: getPlannedGladiatorsEffectValue(
      save,
      'increaseTrainingExperience',
    ),
  };
  const gladiatorResults = save.gladiators.map((gladiator) =>
    applyDailyGladiatorEffects(
      gladiator,
      plan,
      {
        ...baseModifiers,
        injuryRiskMultiplier: getGladiatorInjuryRiskMultiplier(save, gladiator.id),
        traitTrainingExperienceMultiplier: getGladiatorTrainingExperienceMultiplier(
          save,
          gladiator.id,
        ),
      },
      random,
      Math.max(1, save.gladiators.length),
    ),
  );
  const productionBonusPercent = getLudusEffectValue(save, 'increaseProduction');
  const productionIncome = Math.round(
    getPoints(plan, 'production') *
      GAME_BALANCE.macroSimulation.productionIncomePerPoint *
      getPercentMultiplier(productionBonusPercent),
  );
  const gladiatorPointDivisor = Math.max(1, save.gladiators.length);
  const totalTrainingPressurePoints = getTrainingPressurePoints(plan);
  const averageGladiatorTrainingPoints = getAverageTrainingPressurePoints(
    plan,
    gladiatorPointDivisor,
  );
  const happinessBuildingBonus = Math.round(getLudusEffectValue(save, 'increaseHappiness') / 5);
  const happinessDelta =
    -Math.max(
      0,
      averageGladiatorTrainingPoints -
        GAME_BALANCE.macroSimulation.idealTrainingPressurePointsPerGladiator,
    ) *
      GAME_BALANCE.macroSimulation.heavyScheduleHappinessPenalty +
    happinessBuildingBonus +
    Math.round(buildingActivityImpact.happinessDelta);
  const rebellionReduction = Math.round(getLudusEffectValue(save, 'decreaseRebellion') / 5);
  const isUnderRebellionPressure =
    save.ludus.happiness + happinessDelta <
    GAME_BALANCE.macroSimulation.rebellionPressureHappinessThreshold;
  const rebellionDelta =
    (isUnderRebellionPressure
      ? GAME_BALANCE.macroSimulation.rebellionPressureDailyIncrease
      : -GAME_BALANCE.macroSimulation.rebellionCalmDailyReduction) -
    rebellionReduction +
    Math.round(buildingActivityImpact.rebellionDelta);
  const reputationBonusPoints = totalTrainingPressurePoints;
  const reputationDelta =
    (averageGladiatorTrainingPoints > 0 ? 1 : 0) +
    Math.floor((reputationBonusPoints * getLudusEffectValue(save, 'increaseReputation')) / 12) +
    Math.round(buildingActivityImpact.reputationDelta);
  const buildingActivityLedgerEntries: DailyLedgerDraft[] = buildingActivityContributions
    .map<DailyLedgerDraft | null>((contribution) => {
      const amount = Math.round(contribution.treasuryDelta);

      if (amount === 0) {
        return null;
      }

      return {
        amount,
        buildingId: contribution.buildingId,
        category: getFinanceCategoryForActivity(contribution.activity),
        labelKey:
          amount >= 0
            ? 'finance.ledger.buildingActivityIncome'
            : 'finance.ledger.buildingActivityExpense',
        relatedId: contribution.activityId,
      };
    })
    .filter((entry): entry is DailyLedgerDraft => entry !== null);
  const incomeEntries: DailyLedgerDraft[] = [
    {
      amount: productionIncome,
      category: 'production' as EconomyCategory,
      labelKey: 'finance.ledger.dailyIncome',
    },
    ...buildingActivityLedgerEntries
      .filter((entry) => entry.amount > 0)
      .map((entry) => ({ ...entry, amount: entry.amount })),
  ].filter((entry) => entry.amount > 0);
  const expenseEntries: DailyLedgerDraft[] = [
    ...buildingActivityLedgerEntries
      .filter((entry) => entry.amount < 0)
      .map((entry) => ({ ...entry, amount: Math.abs(entry.amount) })),
  ].filter((entry) => entry.amount > 0);
  const income = incomeEntries.reduce((total, entry) => total + entry.amount, 0);
  const expense = expenseEntries.reduce((total, entry) => total + entry.amount, 0);
  const treasuryDelta = income - expense;
  const summary: DailySimulationSummary = {
    dayOfWeek: plan.dayOfWeek,
    treasuryDelta,
    reputationDelta,
    happinessDelta,
    rebellionDelta,
    injuredGladiatorIds: gladiatorResults
      .filter((result) => result.isInjured)
      .map((result) => result.gladiator.id),
    eventIds: [],
  };
  let nextSave: GameSave = {
    ...save,
    ludus: {
      ...save.ludus,
      reputation: Math.max(0, save.ludus.reputation + summary.reputationDelta),
      happiness: clamp(save.ludus.happiness + happinessDelta, 0, 100),
      rebellion: clamp(save.ludus.rebellion + rebellionDelta, 0, 100),
    },
    gladiators: gladiatorResults.map((result) => result.gladiator),
  };

  if (options.recordLedger) {
    nextSave = addGladiatorLevelUpNotifications(nextSave, save.gladiators);
  }

  for (const gladiatorId of summary.injuredGladiatorIds) {
    const injuredSave = applyGladiatorTrait(
      nextSave,
      'injury',
      GAME_BALANCE.traits.injury.trainingDurationDays,
      gladiatorId,
    );

    nextSave = options.recordLedger
      ? addGladiatorInjuryNotification(injuredSave, gladiatorId)
      : injuredSave;
  }

  if (options.recordLedger) {
    for (const entry of incomeEntries) {
      nextSave = addLedgerEntry(
        nextSave,
        createLedgerEntry(nextSave, {
          kind: 'income',
          category: entry.category,
          amount: entry.amount,
          labelKey: entry.labelKey,
          buildingId: entry.buildingId,
          relatedId: entry.relatedId,
        }),
      );
    }

    for (const entry of expenseEntries) {
      nextSave = addLedgerEntry(
        nextSave,
        createLedgerEntry(nextSave, {
          kind: 'expense',
          category: entry.category,
          amount: entry.amount,
          labelKey: entry.labelKey,
          buildingId: entry.buildingId,
          relatedId: entry.relatedId,
        }),
      );
    }
  } else if (treasuryDelta !== 0) {
    nextSave = {
      ...nextSave,
      ludus: {
        ...nextSave.ludus,
        treasury: nextSave.ludus.treasury + treasuryDelta,
      },
    };
  }

  const isLost = nextSave.ludus.treasury <= GAME_BALANCE.macroSimulation.gameOverTreasuryThreshold;
  const phaseSave: GameSave = {
    ...nextSave,
    ludus: {
      ...nextSave.ludus,
      gameStatus: isLost ? 'lost' : nextSave.ludus.gameStatus,
    },
    time: {
      ...nextSave.time,
      phase: isLost ? 'gameOver' : 'simulation',
    },
  };
  const summarizedSave = options.recordLedger ? updateCurrentWeekSummary(phaseSave) : phaseSave;
  const eventResult =
    isLost || !options.createEvents
      ? { save: summarizedSave, createdEventIds: [] }
      : synchronizeMacroEvents(summarizedSave, plan, random);

  const resultSave =
    eventResult.createdEventIds.length > 0
      ? { ...eventResult.save, time: { ...eventResult.save.time, phase: 'event' as const } }
      : eventResult.save;
  const synchronizedSave = options.recordLedger
    ? refreshGameAlerts(synchronizePlanning(resultSave))
    : resultSave;

  return {
    expenseEntries,
    incomeEntries,
    save: synchronizedSave,
    summary: {
      ...summary,
      eventIds: eventResult.createdEventIds,
    },
  };
}

export function resolveDailyPlan(
  save: GameSave,
  plan = save.planning.days[save.time.dayOfWeek],
  random: RandomSource = Math.random,
): { save: GameSave; summary: DailySimulationSummary } {
  const result = resolveDailyPlanInternal(save, plan, random, {
    createEvents: true,
    recordLedger: true,
  });

  return {
    save: result.save,
    summary: result.summary,
  };
}

export function projectDailyPlan(
  save: GameSave,
  plan = save.planning.days[save.time.dayOfWeek],
): DailySimulationSummary {
  return resolveDailyPlanInternal(save, plan, () => 1, {
    createEvents: false,
    recordLedger: false,
  }).summary;
}

export function projectWeeklyPlan(save: GameSave): WeeklyReport {
  let projectedSave = {
    ...save,
    events: {
      ...save.events,
      pendingEvents: [],
    },
  };
  const days: DailySimulationSummary[] = [];

  for (const dayOfWeek of DAYS_OF_WEEK) {
    if (dayOfWeek === GAME_BALANCE.arena.dayOfWeek) {
      continue;
    }

    const result = resolveDailyPlanInternal(
      {
        ...projectedSave,
        time: {
          ...projectedSave.time,
          dayOfWeek,
          phase: 'planning',
        },
      },
      save.planning.days[dayOfWeek],
      () => 1,
      {
        createEvents: false,
        recordLedger: false,
      },
    );

    days.push({
      ...result.summary,
      eventIds: [],
    });
    projectedSave = {
      ...result.save,
      events: {
        ...result.save.events,
        pendingEvents: [],
      },
    };

    if (projectedSave.ludus.gameStatus === 'lost') {
      break;
    }
  }

  return {
    ...createWeeklyReport(save, days),
    id: `projection-${save.time.year}-${save.time.week}`,
  };
}

export function projectRemainingWeeklyPlan(save: GameSave): RemainingWeeklyPlanProjection {
  let projectedSave: GameSave = {
    ...save,
    events: {
      ...save.events,
      pendingEvents: [],
    },
  };
  const days: DailySimulationSummary[] = [];
  let income = 0;
  let expense = 0;
  const remainingDays = getRemainingPlanningDays(save);

  for (const dayOfWeek of remainingDays) {
    const result = resolveDailyPlanInternal(
      {
        ...projectedSave,
        time: {
          ...projectedSave.time,
          dayOfWeek,
          phase: 'planning',
        },
      },
      save.planning.days[dayOfWeek],
      () => 1,
      {
        createEvents: false,
        recordLedger: false,
      },
    );

    income += result.incomeEntries.reduce((total, entry) => total + entry.amount, 0);
    expense += result.expenseEntries.reduce((total, entry) => total + entry.amount, 0);
    days.push({
      ...result.summary,
      eventIds: [],
    });
    projectedSave = {
      ...result.save,
      events: {
        ...result.save.events,
        pendingEvents: [],
      },
    };

    if (projectedSave.ludus.gameStatus === 'lost') {
      break;
    }
  }

  const report = {
    ...createWeeklyReport(save, days),
    id: `remaining-projection-${save.time.year}-${save.time.week}`,
  };

  return {
    expense,
    income,
    net: income - expense,
    remainingDays,
    report,
  };
}

function addProjectionExpense(
  projection: WeeklyProjection,
  category: EconomyCategory,
  amount: number,
): WeeklyProjection {
  if (amount <= 0) {
    return projection;
  }

  const expenseByCategory = {
    ...projection.expenseByCategory,
    [category]: (projection.expenseByCategory[category] ?? 0) + amount,
  };

  return {
    ...projection,
    expenseByCategory,
    net: projection.net - amount,
  };
}

export function projectWeeklyEconomy(save: GameSave): WeeklyProjection {
  let projectedSave: GameSave = {
    ...save,
    economy: {
      ...save.economy,
      ledgerEntries: [],
      currentWeekSummary: createEmptyProjection(),
      weeklyProjection: createEmptyProjection(),
    },
    events: {
      ...save.events,
      pendingEvents: [],
    },
  };
  const projectedExpenseEntries: DailyLedgerDraft[] = [];
  const projectedIncomeEntries: DailyLedgerDraft[] = [];

  for (const dayOfWeek of DAYS_OF_WEEK) {
    if (dayOfWeek === GAME_BALANCE.arena.dayOfWeek) {
      continue;
    }

    const result = resolveDailyPlanInternal(
      {
        ...projectedSave,
        time: {
          ...projectedSave.time,
          dayOfWeek,
          phase: 'planning',
        },
      },
      save.planning.days[dayOfWeek],
      () => 1,
      {
        createEvents: false,
        recordLedger: false,
      },
    );

    projectedExpenseEntries.push(...result.expenseEntries);
    projectedIncomeEntries.push(...result.incomeEntries);
    projectedSave = {
      ...result.save,
      events: {
        ...result.save.events,
        pendingEvents: [],
      },
    };

    if (projectedSave.ludus.gameStatus === 'lost') {
      break;
    }
  }

  const projectedLoanPayment = save.economy.activeLoans.reduce(
    (total, loan) => total + Math.min(loan.weeklyPayment, loan.remainingBalance),
    0,
  );

  return addProjectionExpense(
    createProjectionFromDailyDrafts(projectedIncomeEntries, projectedExpenseEntries),
    'loan',
    projectedLoanPayment,
  );
}

export function synchronizeEconomyProjection(save: GameSave): GameSave {
  const saveWithSummary = updateCurrentWeekSummary(save);

  return {
    ...saveWithSummary,
    economy: {
      ...saveWithSummary.economy,
      weeklyProjection: projectWeeklyEconomy(saveWithSummary),
    },
  };
}

function resolveWeeklyLoanPayments(save: GameSave): GameSave {
  const paymentAmount = save.economy.activeLoans.reduce(
    (total, loan) => total + Math.min(loan.weeklyPayment, loan.remainingBalance),
    0,
  );

  if (paymentAmount <= 0) {
    return save;
  }

  const activeLoans = save.economy.activeLoans
    .map((loan) => {
      const paidAmount = Math.min(loan.weeklyPayment, loan.remainingBalance);

      return {
        ...loan,
        remainingBalance: loan.remainingBalance - paidAmount,
        remainingWeeks: Math.max(0, loan.remainingWeeks - 1),
      };
    })
    .filter((loan) => loan.remainingBalance > 0 && loan.remainingWeeks > 0);
  const nextSave = addLedgerEntry(
    {
      ...save,
      economy: {
        ...save.economy,
        activeLoans,
      },
    },
    createLedgerEntry(save, {
      kind: 'expense',
      category: 'loan',
      amount: paymentAmount,
      labelKey: 'finance.ledger.weeklyLoanPayment',
    }),
  );
  const isLost = nextSave.ludus.treasury <= GAME_BALANCE.macroSimulation.gameOverTreasuryThreshold;

  return updateCurrentWeekSummary({
    ...nextSave,
    ludus: {
      ...nextSave.ludus,
      gameStatus: isLost ? 'lost' : nextSave.ludus.gameStatus,
    },
    time: {
      ...nextSave.time,
      phase: isLost ? 'gameOver' : nextSave.time.phase,
    },
  });
}

function getNextDay(dayOfWeek: DayOfWeek) {
  const currentIndex = DAYS_OF_WEEK.indexOf(dayOfWeek);
  return DAYS_OF_WEEK[(currentIndex + 1) % DAYS_OF_WEEK.length];
}

function getNextWeek(year: number, week: number) {
  const nextWeek = week + 1;

  if (nextWeek > GAME_BALANCE.progression.weeksPerYear) {
    return { year: year + 1, week: 1 };
  }

  return { year, week: nextWeek };
}

function getRunningReportId(year: number, week: number) {
  return `running-${year}-${week}`;
}

function getRunningReportDays(save: GameSave) {
  const runningReportId = getRunningReportId(save.time.year, save.time.week);
  const runningReport = save.planning.reports.find((report) => report.id === runningReportId);

  return runningReport?.days ?? [];
}

function getCurrentWeekCombatPrefix(save: GameSave) {
  return `combat-${save.time.year}-${save.time.week}-`;
}

function applyPostArenaTraits(save: GameSave, sourceSave: GameSave, random: RandomSource) {
  const combatIdPrefix = getCurrentWeekCombatPrefix(sourceSave);

  return sourceSave.arena.resolvedCombats
    .filter((combat) => combat.id.startsWith(combatIdPrefix))
    .reduce((nextSave, combat) => {
      let traitSave = nextSave;

      if (combat.consequence.didPlayerWin) {
        traitSave = applyGladiatorTrait(
          traitSave,
          'victoryAura',
          GAME_BALANCE.traits.victoryAura.durationDays,
          combat.gladiator.id,
        );
      }

      const injuryChance =
        getCombatInjuryChance(combat.consequence.didPlayerWin) *
        getGladiatorInjuryRiskMultiplier(traitSave, combat.gladiator.id);

      if (random() < injuryChance) {
        const injuredSave = applyGladiatorTrait(
          traitSave,
          'injury',
          getRandomCombatInjuryDuration(random),
          combat.gladiator.id,
        );

        traitSave =
          injuredSave === traitSave
            ? traitSave
            : addGladiatorInjuryNotification(injuredSave, combat.gladiator.id);
      }

      return traitSave;
    }, save);
}

function clearPendingActionTrigger(time: GameTimeState): GameTimeState {
  const { pendingActionTrigger, ...timeWithoutTrigger } = time;

  void pendingActionTrigger;

  return timeWithoutTrigger;
}

function withPendingActionTrigger(save: GameSave, trigger: PendingActionTrigger): GameSave {
  return {
    ...save,
    time: {
      ...save.time,
      pendingActionTrigger: trigger,
    },
  };
}

export function resolveSundayArena(save: GameSave, random: RandomSource = Math.random): GameSave {
  const time = clearPendingActionTrigger(save.time);

  return {
    ...startArenaDay(
      {
        ...save,
        time: {
          ...time,
          dayOfWeek: 'sunday',
          phase: 'arena',
        },
      },
      random,
    ),
    time: {
      ...time,
      dayOfWeek: 'sunday',
      phase: 'arena',
    },
  };
}

export function resolvePendingGameAction(
  save: GameSave,
  trigger: PendingActionTrigger | undefined = save.time.pendingActionTrigger,
  random: RandomSource = Math.random,
): GameSave {
  if (!trigger || save.time.pendingActionTrigger !== trigger) {
    return save;
  }

  const time = clearPendingActionTrigger(save.time);

  if (trigger === 'startWeek') {
    return refreshGameAlerts(
      synchronizePlanning({
        ...save,
        time: {
          ...time,
          phase: save.ludus.gameStatus === 'lost' ? 'gameOver' : 'planning',
        },
      }),
    );
  }

  if (save.time.dayOfWeek !== GAME_BALANCE.arena.dayOfWeek) {
    return save;
  }

  if (save.arena.arenaDay) {
    return {
      ...save,
      time: {
        ...time,
        phase: 'arena',
      },
    };
  }

  return resolveSundayArena(
    {
      ...save,
      time,
    },
    random,
  );
}

export function completeSundayArenaDay(
  save: GameSave,
  random: RandomSource = Math.random,
): GameSave {
  if (!save.arena.arenaDay) {
    return save;
  }

  const report = createWeeklyReport(save, getRunningReportDays(save));
  const runningReportId = getRunningReportId(save.time.year, save.time.week);
  const archivedReports = save.planning.reports.filter(
    (existingReport) => existingReport.id !== runningReportId,
  );
  const nextWeek = getNextWeek(save.time.year, save.time.week);
  const closedArenaSave: GameSave = {
    ...save,
    arena: {
      ...save.arena,
      arenaDay: undefined,
      isArenaDayActive: false,
    },
  };
  const paidLoans = resolveWeeklyLoanPayments(closedArenaSave);

  if (paidLoans.ludus.gameStatus === 'lost') {
    return paidLoans;
  }

  const nextWeekSave: GameSave = {
    ...paidLoans,
    time: {
      ...paidLoans.time,
      ...nextWeek,
      dayOfWeek: 'monday',
      phase: 'planning',
      pendingActionTrigger: 'startWeek',
    },
    market: createMarketState(nextWeek.year, nextWeek.week, random),
    planning: {
      ...createDefaultWeeklyPlan(nextWeek.year, nextWeek.week),
      reports: [report, ...archivedReports].slice(0, 8),
    },
  };

  return refreshGameAlerts(
    synchronizePlanning(pruneExpiredTraits(applyPostArenaTraits(nextWeekSave, save, random))),
  );
}

export function resolveWeekStep(save: GameSave, random: RandomSource = Math.random): GameSave {
  if (save.ludus.gameStatus === 'lost') {
    return { ...save, time: { ...save.time, phase: 'gameOver' } };
  }

  if (save.time.pendingActionTrigger) {
    return save;
  }

  if (save.events.pendingEvents.length > 0) {
    return { ...save, time: { ...save.time, phase: 'event' } };
  }

  if (save.time.dayOfWeek === 'sunday') {
    if (save.arena.arenaDay) {
      return {
        ...save,
        time: {
          ...save.time,
          phase: 'arena',
        },
      };
    }

    return withPendingActionTrigger(
      {
        ...save,
        time: {
          ...save.time,
          dayOfWeek: 'sunday',
          phase: 'arena',
        },
      },
      'enterArena',
    );
  }

  const plan = save.planning.days[save.time.dayOfWeek];
  const result = resolveDailyPlan(save, plan, random);
  const nextDay = getNextDay(save.time.dayOfWeek);
  const runningReportId = getRunningReportId(save.time.year, save.time.week);
  const existingReports = save.planning.reports.filter((report) => report.id !== runningReportId);
  const runningReportDays = [...getRunningReportDays(save), result.summary];
  const runningReport = {
    ...createWeeklyReport(save, runningReportDays),
    id: runningReportId,
  };

  const steppedSave = refreshGameAlerts(
    synchronizePlanning(
      pruneExpiredTraits({
        ...result.save,
        time: {
          ...clearPendingActionTrigger(result.save.time),
          dayOfWeek: nextDay,
          phase:
            result.save.time.phase === 'event'
              ? 'event'
              : nextDay === GAME_BALANCE.arena.dayOfWeek
                ? 'arena'
                : 'planning',
          ...(result.save.time.phase !== 'event' && nextDay === GAME_BALANCE.arena.dayOfWeek
            ? { pendingActionTrigger: 'enterArena' as const }
            : {}),
        },
        planning: {
          ...result.save.planning,
          reports: [runningReport, ...existingReports],
        },
      }),
    ),
  );

  return steppedSave;
}
