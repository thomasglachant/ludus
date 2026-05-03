import { GAME_BALANCE } from '../../game-data/balance';
import { DAYS_OF_WEEK } from '../../game-data/time';
import {
  calculateBuildingEfficiency,
  updateBuildingEfficiencies,
} from '../buildings/building-staffing';
import { hasActiveWeeklyInjury } from '../gladiators/injuries';
import { addSkillTrainingProgress } from '../gladiators/skills';
import type { Gladiator } from '../gladiators/types';
import { createMarketState } from '../market/market-actions';
import { generateStaffMarketCandidates } from '../staff/staff-actions';
import type { GameSave } from '../saves/types';
import type { DayOfWeek } from '../time/types';
import { startArenaDay } from '../combat/combat-actions';
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
  isWeeklyPlanningComplete,
} from '../planning/planning-actions';
import type {
  DailyPlan,
  DailyPlanActivity,
  DailySimulationSummary,
  WeeklyReport,
} from '../planning/types';

type RandomSource = () => number;
type TrainingFocus = keyof typeof GAME_BALANCE.macroSimulation.trainingFocus;

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
  careEfficiency: number;
  injuryRiskReductionPercent: number;
  trainingAgilityProgressBonusPercent: number;
  trainingDefenseProgressBonusPercent: number;
  trainingEfficiency: number;
  trainingLifeProgressBonusPercent: number;
  trainingStrengthProgressBonusPercent: number;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function getPoints(plan: DailyPlan, activity: DailyPlanActivity) {
  return plan.gladiatorTimePoints[activity] + plan.laborPoints[activity];
}

function getFocusedTrainingPoints(plan: DailyPlan, focus: TrainingFocus) {
  switch (focus) {
    case 'strength':
      return plan.gladiatorTimePoints.strengthTraining;
    case 'agility':
      return plan.gladiatorTimePoints.agilityTraining;
    case 'defense':
      return plan.gladiatorTimePoints.defenseTraining;
    case 'life':
      return plan.gladiatorTimePoints.lifeTraining;
  }
}

function getTrainingPressurePoints(plan: DailyPlan) {
  return (Object.keys(GAME_BALANCE.macroSimulation.trainingFocus) as TrainingFocus[]).reduce(
    (total, focus) =>
      total +
      getFocusedTrainingPoints(plan, focus) *
        GAME_BALANCE.macroSimulation.trainingFocus[focus].pressureMultiplier,
    0,
  );
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

function getFocusedTrainingGain(
  plan: DailyPlan,
  focus: TrainingFocus,
  gladiatorPointDivisor: number,
  trainingLoadScale: number,
) {
  return (
    (getFocusedTrainingPoints(plan, focus) / gladiatorPointDivisor) *
    trainingLoadScale *
    GAME_BALANCE.macroSimulation.trainingFocus[focus].progressMultiplier
  );
}

function getAssignedStaffCount(save: GameSave, type: 'guard' | 'trainer' | 'slave') {
  return save.staff.members.filter(
    (member) =>
      member.type === type &&
      member.assignedBuildingId &&
      save.buildings[member.assignedBuildingId].isPurchased,
  ).length;
}

function getLudusEffectValue(
  save: GameSave,
  type: BuildingEffect['type'],
  options?: Parameters<typeof sumActiveBuildingEffectValues>[2],
) {
  return sumActiveBuildingEffectValues(
    save,
    {
      target: 'ludus',
      type,
    },
    options,
  );
}

function getAllGladiatorsEffectValue(
  save: GameSave,
  type: BuildingEffect['type'],
  options?: Parameters<typeof sumActiveBuildingEffectValues>[2],
) {
  return sumActiveBuildingEffectValues(
    save,
    {
      target: 'allGladiators',
      type,
    },
    options,
  );
}

function getPlannedGladiatorsEffectValue(
  save: GameSave,
  type: BuildingEffect['type'],
  options?: Parameters<typeof sumActiveBuildingEffectValues>[2],
) {
  return sumActiveBuildingEffectValues(
    save,
    {
      target: 'plannedGladiators',
      type,
    },
    options,
  );
}

function getPercentMultiplier(percent: number) {
  return Math.max(0, 1 + percent / 100);
}

function canGladiatorPerformPhysicalActivities(gladiator: Gladiator, year: number, week: number) {
  return !hasActiveWeeklyInjury(gladiator, year, week);
}

function getExpenseMultiplier(reductionPercent: number) {
  return clamp(1 - reductionPercent / 100, 0.45, 1);
}

function getFinanceCategoryForActivity(activity: DailyPlanActivity): EconomyCategory {
  if (activity === 'production') {
    return activity;
  }

  if (activity === 'security') {
    return 'event';
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

function getPurchasedBuildingMaxEfficiency(
  save: GameSave,
  buildingIds: BuildingId[],
  fallback = 1,
) {
  const efficiencies = buildingIds
    .filter((buildingId) => save.buildings[buildingId].isPurchased)
    .map((buildingId) => calculateBuildingEfficiency(save, buildingId));

  return efficiencies.length > 0 ? Math.max(fallback, ...efficiencies) : fallback;
}

function applyDailyGladiatorEffects(
  gladiator: Gladiator,
  plan: DailyPlan,
  modifiers: DailyGladiatorModifiers,
  random: RandomSource,
  year: number,
  week: number,
  gladiatorPointDivisor: number,
): DailyGladiatorResolutionResult {
  const canTrain = canGladiatorPerformPhysicalActivities(gladiator, year, week);
  const trainingLoadScale = getTrainingLoadScale(plan, gladiatorPointDivisor);
  const trainingPoints = canTrain
    ? getAverageTrainingPressurePoints(plan, gladiatorPointDivisor)
    : 0;
  const carePoints = plan.gladiatorTimePoints.care / gladiatorPointDivisor;
  const overtrainingPenalty = Math.max(
    0,
    trainingPoints - GAME_BALANCE.macroSimulation.idealTrainingPressurePointsPerGladiator,
  );
  const injuryChance =
    trainingPoints *
    GAME_BALANCE.macroSimulation.trainingInjuryChancePerPoint *
    Math.max(0.35, 1 - carePoints * 0.08 * modifiers.careEfficiency) *
    Math.max(0.1, 1 - modifiers.injuryRiskReductionPercent / 100);
  const isInjured = trainingPoints > 0 && random() < injuryChance;
  const focusedSkillGain = canTrain && !isInjured ? modifiers.trainingEfficiency : 0;
  const strengthGain =
    getFocusedTrainingGain(plan, 'strength', gladiatorPointDivisor, trainingLoadScale) *
    focusedSkillGain *
    getPercentMultiplier(modifiers.trainingStrengthProgressBonusPercent);
  const agilityGain =
    getFocusedTrainingGain(plan, 'agility', gladiatorPointDivisor, trainingLoadScale) *
    focusedSkillGain *
    getPercentMultiplier(modifiers.trainingAgilityProgressBonusPercent);
  const defenseGain =
    getFocusedTrainingGain(plan, 'defense', gladiatorPointDivisor, trainingLoadScale) *
    focusedSkillGain *
    getPercentMultiplier(modifiers.trainingDefenseProgressBonusPercent);
  const lifeGain =
    getFocusedTrainingGain(plan, 'life', gladiatorPointDivisor, trainingLoadScale) *
    focusedSkillGain *
    getPercentMultiplier(modifiers.trainingLifeProgressBonusPercent);
  const lifePenalty = overtrainingPenalty * 4 + (isInjured ? 16 : 0);

  return {
    gladiator: {
      ...gladiator,
      weeklyInjury: isInjured ? { reason: 'training', week, year } : gladiator.weeklyInjury,
      strength: addSkillTrainingProgress(gladiator.strength, strengthGain),
      agility: addSkillTrainingProgress(gladiator.agility, agilityGain),
      defense: addSkillTrainingProgress(gladiator.defense, defenseGain),
      life: addSkillTrainingProgress(gladiator.life, lifeGain - lifePenalty),
    },
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
    securityDelta: days.reduce((total, day) => total + day.securityDelta, 0),
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
  const operationalSave = updateBuildingEfficiencies(save);
  const buildingActivityContributions = getBuildingActivityContributions(operationalSave, plan);
  const buildingActivityImpact = calculateBuildingActivityImpact(operationalSave, plan);
  const trainingEfficiency =
    1 +
    getAssignedStaffCount(operationalSave, 'trainer') * 0.08 +
    calculateBuildingEfficiency(operationalSave, 'trainingGround') * 0.1;
  const modifiers: DailyGladiatorModifiers = {
    careEfficiency: getPurchasedBuildingMaxEfficiency(operationalSave, ['infirmary']),
    injuryRiskReductionPercent:
      getAllGladiatorsEffectValue(operationalSave, 'reduceInjuryRisk') +
      buildingActivityImpact.injuryRiskReductionPercent,
    trainingAgilityProgressBonusPercent: getPlannedGladiatorsEffectValue(
      operationalSave,
      'increaseAgility',
    ),
    trainingDefenseProgressBonusPercent: getPlannedGladiatorsEffectValue(
      operationalSave,
      'increaseDefense',
    ),
    trainingEfficiency,
    trainingLifeProgressBonusPercent: getPlannedGladiatorsEffectValue(
      operationalSave,
      'increaseLife',
    ),
    trainingStrengthProgressBonusPercent: getPlannedGladiatorsEffectValue(
      operationalSave,
      'increaseStrength',
    ),
  };
  const gladiatorResults = operationalSave.gladiators.map((gladiator) =>
    applyDailyGladiatorEffects(
      gladiator,
      plan,
      modifiers,
      random,
      operationalSave.time.year,
      operationalSave.time.week,
      Math.max(1, operationalSave.gladiators.length),
    ),
  );
  const productionEfficiency = getPurchasedBuildingMaxEfficiency(operationalSave, [
    'canteen',
    'farm',
    'armory',
    'forgeWorkshop',
  ]);
  const productionBonusPercent = getLudusEffectValue(operationalSave, 'increaseProduction');
  const expenseReductionPercent = getLudusEffectValue(operationalSave, 'reduceExpense');
  const productionIncome = Math.round(
    getPoints(plan, 'production') *
      GAME_BALANCE.macroSimulation.productionIncomePerPoint *
      productionEfficiency *
      getPercentMultiplier(productionBonusPercent),
  );
  const staffCost = operationalSave.staff.members.reduce(
    (total, member) => total + member.weeklyWage / 7,
    0,
  );
  const guardCount = getAssignedStaffCount(operationalSave, 'guard');
  const targetGuards = Math.ceil(
    operationalSave.gladiators.length * GAME_BALANCE.macroSimulation.targetGuardRatio,
  );
  const securityEfficiency = getPurchasedBuildingMaxEfficiency(operationalSave, ['guardBarracks']);
  const securityBuildingBonus = Math.round(
    getLudusEffectValue(operationalSave, 'increaseSecurity') / 2,
  );
  const gladiatorPointDivisor = Math.max(1, operationalSave.gladiators.length);
  const totalTrainingPressurePoints = getTrainingPressurePoints(plan);
  const averageGladiatorTrainingPoints = getAverageTrainingPressurePoints(
    plan,
    gladiatorPointDivisor,
  );
  const securityDelta = Math.round(
    guardCount * GAME_BALANCE.macroSimulation.securityPerGuard * securityEfficiency -
      targetGuards * 10 +
      getPoints(plan, 'security') * securityEfficiency +
      securityBuildingBonus +
      buildingActivityImpact.securityDelta,
  );
  const happinessBuildingBonus = Math.round(
    getLudusEffectValue(operationalSave, 'increaseHappiness') / 5,
  );
  const happinessDelta =
    plan.gladiatorTimePoints.leisure / gladiatorPointDivisor +
    -Math.max(
      0,
      averageGladiatorTrainingPoints -
        GAME_BALANCE.macroSimulation.idealTrainingPressurePointsPerGladiator,
    ) *
      GAME_BALANCE.macroSimulation.heavyScheduleHappinessPenalty +
    happinessBuildingBonus +
    Math.round(buildingActivityImpact.happinessDelta);
  const rebellionReduction = Math.round(
    getLudusEffectValue(operationalSave, 'decreaseRebellion') / 5,
  );
  const isUnderRebellionPressure =
    operationalSave.ludus.happiness + happinessDelta <
      GAME_BALANCE.macroSimulation.rebellionPressureHappinessThreshold ||
    operationalSave.ludus.security + securityDelta <
      GAME_BALANCE.macroSimulation.rebellionPressureSecurityThreshold;
  const rebellionDelta =
    (isUnderRebellionPressure
      ? GAME_BALANCE.macroSimulation.rebellionPressureDailyIncrease
      : -GAME_BALANCE.macroSimulation.rebellionCalmDailyReduction) -
    rebellionReduction +
    Math.round(buildingActivityImpact.rebellionDelta);
  const reputationBonusPoints = totalTrainingPressurePoints;
  const reputationDelta =
    (averageGladiatorTrainingPoints > 0 ? 1 : 0) +
    Math.floor(
      (reputationBonusPoints * getLudusEffectValue(operationalSave, 'increaseReputation')) / 12,
    ) +
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
  const staffExpense = Math.round(staffCost * getExpenseMultiplier(expenseReductionPercent));
  const expenseEntries: DailyLedgerDraft[] = [
    {
      amount: staffExpense,
      category: 'staff' as EconomyCategory,
      labelKey: 'finance.ledger.dailyExpenses',
    },
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
    securityDelta,
    rebellionDelta,
    injuredGladiatorIds: gladiatorResults
      .filter((result) => result.isInjured)
      .map((result) => result.gladiator.id),
    eventIds: [],
  };
  let nextSave: GameSave = updateBuildingEfficiencies({
    ...operationalSave,
    ludus: {
      ...operationalSave.ludus,
      reputation: Math.max(0, operationalSave.ludus.reputation + summary.reputationDelta),
      happiness: clamp(operationalSave.ludus.happiness + happinessDelta, 0, 100),
      security: clamp(operationalSave.ludus.security + securityDelta, 0, 100),
      rebellion: clamp(operationalSave.ludus.rebellion + rebellionDelta, 0, 100),
    },
    gladiators: gladiatorResults.map((result) => result.gladiator),
    staff: {
      ...operationalSave.staff,
      members: operationalSave.staff.members.map((member) =>
        member.assignedBuildingId
          ? {
              ...member,
              buildingExperience: {
                ...member.buildingExperience,
                [member.assignedBuildingId]:
                  (member.buildingExperience[member.assignedBuildingId] ?? 0) +
                  GAME_BALANCE.macroSimulation.staffExperiencePerAssignedDay,
              },
            }
          : member,
      ),
    },
  });

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

  return {
    expenseEntries,
    incomeEntries,
    save:
      eventResult.createdEventIds.length > 0
        ? { ...eventResult.save, time: { ...eventResult.save.time, phase: 'event' } }
        : eventResult.save,
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

export function resolveSundayArena(save: GameSave, random: RandomSource = Math.random): GameSave {
  return {
    ...startArenaDay(
      {
        ...save,
        time: {
          ...save.time,
          dayOfWeek: 'sunday',
          phase: 'arena',
        },
      },
      random,
    ),
    time: {
      ...save.time,
      dayOfWeek: 'sunday',
      phase: 'arena',
    },
  };
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
      currentCombatId: undefined,
      isArenaDayActive: false,
    },
  };
  const paidLoans = resolveWeeklyLoanPayments(closedArenaSave);

  if (paidLoans.ludus.gameStatus === 'lost') {
    return paidLoans;
  }

  return {
    ...paidLoans,
    gladiators: paidLoans.gladiators.map((gladiator) => ({
      ...gladiator,
      weeklyInjury: undefined,
    })),
    time: {
      ...paidLoans.time,
      ...nextWeek,
      dayOfWeek: 'monday',
      phase: 'report',
    },
    market: createMarketState(nextWeek.year, nextWeek.week, random),
    staff: {
      ...paidLoans.staff,
      marketCandidates: generateStaffMarketCandidates(nextWeek.year, nextWeek.week, random),
    },
    planning: {
      ...createDefaultWeeklyPlan(nextWeek.year, nextWeek.week),
      reports: [report, ...archivedReports].slice(0, 8),
    },
  };
}

export function resolveWeekStep(save: GameSave, random: RandomSource = Math.random): GameSave {
  if (save.ludus.gameStatus === 'lost') {
    return { ...save, time: { ...save.time, phase: 'gameOver' } };
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

    return resolveSundayArena(save, random);
  }

  if (!isWeeklyPlanningComplete(save)) {
    return { ...save, time: { ...save.time, phase: 'planning' } };
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

  return {
    ...result.save,
    time: {
      ...result.save.time,
      dayOfWeek: nextDay,
      phase:
        result.save.time.phase === 'event' ? 'event' : nextDay === 'sunday' ? 'arena' : 'planning',
    },
    planning: {
      ...result.save.planning,
      reports: [runningReport, ...existingReports],
    },
  };
}
