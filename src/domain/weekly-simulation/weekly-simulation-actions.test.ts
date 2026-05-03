import { describe, expect, it } from 'vitest';
import { GAME_BALANCE } from '../../game-data/balance';
import { LOAN_DEFINITIONS } from '../../game-data/economy';
import { takeLoan } from '../economy/economy-actions';
import type { Gladiator } from '../gladiators/types';
import { createInitialSave } from '../saves/create-initial-save';
import type { GameSave } from '../saves/types';
import { synchronizeStaffAssignments } from '../staff/staff-actions';
import {
  completeSundayArenaDay,
  createDefaultDailyPlan,
  projectDailyPlan,
  projectWeeklyEconomy,
  projectWeeklyPlan,
  resolveDailyPlan,
  resolveWeekStep,
  synchronizeEconomyProjection,
} from './weekly-simulation-actions';

function createGladiator(overrides: Partial<Gladiator> = {}): Gladiator {
  return {
    id: 'gladiator-test',
    name: 'Aulus',
    age: 20,
    strength: 8,
    agility: 7,
    defense: 6,
    life: 80,
    reputation: 0,
    wins: 0,
    losses: 0,
    traits: [],
    ...overrides,
  };
}

function createTestSave(overrides: Partial<GameSave> = {}): GameSave {
  const save = createInitialSave({
    ludusName: 'Ludus Magnus',
    saveId: 'save-test',
    createdAt: '2026-04-25T12:00:00.000Z',
  });

  return {
    ...save,
    gladiators: [createGladiator()],
    ...overrides,
  };
}

function withAssignedTrainer(save: GameSave, trainingGroundExperience = 10): GameSave {
  return synchronizeStaffAssignments({
    ...save,
    staff: {
      ...save.staff,
      members: [
        {
          id: 'staff-test-trainer',
          name: 'Titus',
          type: 'trainer',
          visualId: 'trainer-01',
          weeklyWage: 35,
          assignedBuildingId: 'trainingGround',
          buildingExperience: { trainingGround: trainingGroundExperience },
        },
      ],
    },
  });
}

function withCompleteWeeklyPlanning(save: GameSave): GameSave {
  const gladiatorCount = save.gladiators.length;
  const plannedDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  const days = { ...save.planning.days };

  for (const dayOfWeek of plannedDays) {
    days[dayOfWeek] = {
      ...days[dayOfWeek],
      gladiatorTimePoints: {
        ...days[dayOfWeek].gladiatorTimePoints,
        strengthTraining: 3 * gladiatorCount,
        meals: 0,
        sleep: 0,
        leisure: 2 * gladiatorCount,
        care: 2 * gladiatorCount,
      },
      laborPoints: {
        ...days[dayOfWeek].laborPoints,
        production: 4,
        security: 4,
      },
    };
  }

  return {
    ...save,
    planning: {
      ...save.planning,
      days,
    },
  };
}

describe('weekly simulation actions', () => {
  it('resolves daily production and ledger entries from allocated points', () => {
    const save = createTestSave();
    const plan = createDefaultDailyPlan('monday');
    plan.laborPoints.production = 2;

    const result = resolveDailyPlan(save, plan, () => 1);

    expect(result.summary.treasuryDelta).not.toBe(0);
    expect(result.save.economy.ledgerEntries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'income', labelKey: 'finance.ledger.dailyIncome' }),
        expect.objectContaining({ kind: 'expense', labelKey: 'finance.ledger.dailyExpenses' }),
      ]),
    );
    expect(result.save.economy.currentWeekSummary.net).toBe(result.summary.treasuryDelta);
  });

  it('applies capped need penalties and records injuries for heavy training days', () => {
    const save = createTestSave();
    const plan = createDefaultDailyPlan('monday');
    plan.gladiatorTimePoints.strengthTraining = 12;
    plan.gladiatorTimePoints.meals = 0;
    plan.gladiatorTimePoints.sleep = 0;
    plan.gladiatorTimePoints.care = 0;

    const result = resolveDailyPlan(save, plan, () => 0);
    const gladiator = result.save.gladiators[0];

    expect(result.summary.injuredGladiatorIds).toContain('gladiator-test');
    expect(result.summary.happinessDelta).toBeLessThan(0);
    expect(gladiator.weeklyInjury).toEqual({ reason: 'training', week: 1, year: 1 });
    expect(gladiator.strength).toBe(8);
    expect(gladiator.life).toBeLessThan(80);
    expect(gladiator.life).toBeLessThan(80);
    expect(gladiator.life).toBeLessThan(80);
  });

  it('excludes already injured gladiators from incompatible training gains', () => {
    const save = createTestSave({
      gladiators: [
        createGladiator({
          life: 90,
          strength: 8,
          weeklyInjury: { reason: 'training', week: 1, year: 1 },
        }),
      ],
    });
    const plan = createDefaultDailyPlan('monday');
    plan.gladiatorTimePoints.strengthTraining = 8;

    const result = resolveDailyPlan(save, plan, () => 1);

    expect(result.summary.injuredGladiatorIds).toEqual([]);
    expect(result.save.gladiators[0].strength).toBe(8);
  });

  it('applies focused training gains only to the targeted aptitude', () => {
    const save = createTestSave();
    const plan = createDefaultDailyPlan('monday');
    plan.gladiatorTimePoints.strengthTraining = 3;

    const result = resolveDailyPlan(save, plan, () => 1);
    const gladiator = result.save.gladiators[0];

    expect(gladiator.strength).toBeGreaterThan(8);
    expect(gladiator.agility).toBe(7);
    expect(gladiator.defense).toBe(6);
    expect(gladiator.life).toBe(80);
  });

  it('normalizes training gains per available gladiator', () => {
    const oneGladiatorSave = createTestSave();
    const oneGladiatorPlan = createDefaultDailyPlan('monday');
    oneGladiatorPlan.gladiatorTimePoints.strengthTraining = 3;
    const manyGladiatorSave = createTestSave({
      gladiators: Array.from({ length: 10 }, (_, index) =>
        createGladiator({ id: `gladiator-test-${index}` }),
      ),
    });
    const manyGladiatorPlan = createDefaultDailyPlan('monday');
    manyGladiatorPlan.gladiatorTimePoints.strengthTraining = 30;

    const oneGladiatorResult = resolveDailyPlan(oneGladiatorSave, oneGladiatorPlan, () => 1);
    const manyGladiatorResult = resolveDailyPlan(manyGladiatorSave, manyGladiatorPlan, () => 1);

    expect(manyGladiatorResult.save.gladiators[0].strength).toBeCloseTo(
      oneGladiatorResult.save.gladiators[0].strength,
    );
  });

  it('caps excessive training gains above the daily realistic ceiling', () => {
    const normalPlan = createDefaultDailyPlan('monday');
    normalPlan.gladiatorTimePoints.strengthTraining =
      GAME_BALANCE.macroSimulation.idealTrainingPressurePointsPerGladiator;
    const excessivePlan = createDefaultDailyPlan('monday');
    excessivePlan.gladiatorTimePoints.strengthTraining = 12;

    const normalResult = resolveDailyPlan(createTestSave(), normalPlan, () => 1);
    const excessiveResult = resolveDailyPlan(createTestSave(), excessivePlan, () => 1);
    const normalGain =
      normalResult.save.gladiators[0].strength - createTestSave().gladiators[0].strength;
    const excessiveGain =
      excessiveResult.save.gladiators[0].strength - createTestSave().gladiators[0].strength;

    expect(excessiveGain).toBeGreaterThan(normalGain);
    expect(excessiveGain).toBeLessThan(normalGain * 3);
  });

  it('clears weekly injury status when Sunday arena is completed', () => {
    const sundaySave: GameSave = {
      ...createTestSave({
        gladiators: [
          createGladiator({
            weeklyInjury: { reason: 'training', week: 1, year: 1 },
          }),
        ],
      }),
      arena: {
        ...createTestSave().arena,
        arenaDay: {
          year: 1,
          week: 1,
          phase: 'summary',
          presentedCombatIds: [],
        },
        isArenaDayActive: true,
      },
      time: {
        ...createTestSave().time,
        dayOfWeek: 'sunday',
        phase: 'arena',
      },
    };

    const result = completeSundayArenaDay(sundaySave, () => 1);

    expect(result.time).toMatchObject({ week: 2, dayOfWeek: 'monday', phase: 'report' });
    expect(result.gladiators[0].weeklyInjury).toBeUndefined();
  });

  it('uses macro happiness and security thresholds for rebellion pressure', () => {
    const pressurePlan = createDefaultDailyPlan('monday');
    pressurePlan.gladiatorTimePoints.meals = 0;
    pressurePlan.gladiatorTimePoints.sleep = 4;
    pressurePlan.gladiatorTimePoints.leisure = 0;
    pressurePlan.gladiatorTimePoints.care = 0;
    pressurePlan.laborPoints.production = 0;
    pressurePlan.laborPoints.security = 0;

    const unhappyResult = resolveDailyPlan(
      createTestSave({
        ludus: {
          ...createTestSave().ludus,
          happiness: GAME_BALANCE.macroSimulation.rebellionPressureHappinessThreshold - 1,
          security: GAME_BALANCE.macroSimulation.rebellionPressureSecurityThreshold + 20,
        },
      }),
      pressurePlan,
      () => 1,
    );
    const unsafeResult = resolveDailyPlan(
      createTestSave({
        ludus: {
          ...createTestSave().ludus,
          happiness: GAME_BALANCE.macroSimulation.rebellionPressureHappinessThreshold + 20,
          security: GAME_BALANCE.macroSimulation.rebellionPressureSecurityThreshold - 1,
        },
        staff: {
          ...createTestSave().staff,
          members: [],
          assignments: [],
        },
      }),
      pressurePlan,
      () => 1,
    );
    const stableResult = resolveDailyPlan(
      createTestSave({
        ludus: {
          ...createTestSave().ludus,
          happiness: GAME_BALANCE.macroSimulation.rebellionPressureHappinessThreshold,
          security: GAME_BALANCE.macroSimulation.rebellionPressureSecurityThreshold + 20,
        },
      }),
      pressurePlan,
      () => 1,
    );

    expect(unhappyResult.summary.rebellionDelta).toBe(
      GAME_BALANCE.macroSimulation.rebellionPressureDailyIncrease,
    );
    expect(unsafeResult.summary.rebellionDelta).toBe(
      GAME_BALANCE.macroSimulation.rebellionPressureDailyIncrease,
    );
    expect(stableResult.summary.rebellionDelta).toBe(
      -GAME_BALANCE.macroSimulation.rebellionCalmDailyReduction,
    );
  });

  it('caps staff experience efficiency at twenty percent', () => {
    const save = withAssignedTrainer(createTestSave(), 1_000);

    const plan = createDefaultDailyPlan('monday');
    plan.laborPoints.production = 0;
    const result = resolveDailyPlan(save, plan, () => 1);

    expect(result.save.buildings.trainingGround.efficiency).toBe(120);
  });

  it('uses building staff requirements by level for efficiency', () => {
    const baseSave = createTestSave();
    const save = withAssignedTrainer({
      ...baseSave,
      buildings: {
        ...baseSave.buildings,
        trainingGround: {
          ...baseSave.buildings.trainingGround,
          level: 3,
        },
      },
    });
    const plan = createDefaultDailyPlan('monday');
    plan.laborPoints.production = 0;

    const result = resolveDailyPlan(save, plan, () => 1);

    expect(result.save.buildings.trainingGround.efficiency).toBe(61);
  });

  it('applies planned gladiator building effects during daily resolution', () => {
    const save = createTestSave({
      gladiators: [createGladiator({ life: 50 })],
    });
    const plan = createDefaultDailyPlan('monday');
    plan.gladiatorTimePoints.sleep = 4;
    plan.gladiatorTimePoints.care = 0;
    plan.gladiatorTimePoints.leisure = 0;
    const boostedSave: GameSave = {
      ...save,
      buildings: {
        ...save.buildings,
        dormitory: {
          ...save.buildings.dormitory,
          purchasedImprovementIds: ['strawBeds'],
        },
      },
    };

    const baseResult = resolveDailyPlan(save, plan, () => 1);
    const boostedResult = resolveDailyPlan(boostedSave, plan, () => 1);

    expect(boostedResult.save.gladiators[0].life).toBe(baseResult.save.gladiators[0].life);
    expect(boostedResult.save.ludus.happiness).toBeGreaterThanOrEqual(
      baseResult.save.ludus.happiness,
    );
  });

  it('applies unlocked building activities to matching planned points', () => {
    const save = createTestSave();
    const plan = createDefaultDailyPlan('monday');
    plan.laborPoints.production = 4;
    plan.buildingActivitySelections.production = 'farm.marketSurplus';
    const farmSave: GameSave = {
      ...save,
      buildings: {
        ...save.buildings,
        farm: {
          ...save.buildings.farm,
          isPurchased: true,
          level: 1,
        },
      },
    };
    const unlockedFarmSave: GameSave = {
      ...farmSave,
      buildings: {
        ...farmSave.buildings,
        farm: {
          ...farmSave.buildings.farm,
          purchasedSkillIds: ['farm.market-surplus'],
        },
      },
    };

    const baseResult = resolveDailyPlan(farmSave, plan, () => 1);
    const unlockedResult = resolveDailyPlan(unlockedFarmSave, plan, () => 1);

    expect(unlockedResult.summary.treasuryDelta).toBeGreaterThan(baseResult.summary.treasuryDelta);
    expect(unlockedResult.save.economy.ledgerEntries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          buildingId: 'farm',
          category: 'production',
          kind: 'income',
          labelKey: 'finance.ledger.buildingActivityIncome',
          relatedId: 'farm.marketSurplus',
        }),
      ]),
    );
  });

  it('projects a daily plan without mutating the save', () => {
    const save = createTestSave();
    const plan = createDefaultDailyPlan('monday');
    plan.laborPoints.production = 4;
    const projection = projectDailyPlan(save, plan);

    expect(projection.treasuryDelta).not.toBe(0);
    expect(projection.eventIds).toEqual([]);
    expect(save.economy.ledgerEntries).toEqual([]);
    expect(save.gladiators[0].strength).toBe(8);
  });

  it('projects the planned week with aggregated macro deltas', () => {
    const save = createTestSave();
    const projection = projectWeeklyPlan(save);

    expect(projection.id).toBe('projection-1-1');
    expect(projection.days).toHaveLength(6);
    expect(projection.treasuryDelta).toBe(
      projection.days.reduce((total, day) => total + day.treasuryDelta, 0),
    );
    expect(projection.securityDelta).toBe(
      projection.days.reduce((total, day) => total + day.securityDelta, 0),
    );
    expect(save.economy.ledgerEntries).toEqual([]);
  });

  it('projects weekly economy without counting current ledger one-shots', () => {
    const loanedSave = takeLoan(createTestSave(), 'smallLoan').save;
    const projection = projectWeeklyEconomy(loanedSave);

    expect(projection.incomeByCategory.loan).toBeUndefined();
    expect(projection.expenseByCategory.loan).toBe(LOAN_DEFINITIONS[0].weeklyPayment);
    expect(loanedSave.economy.ledgerEntries).toHaveLength(1);
    expect(loanedSave.economy.ledgerEntries[0]).toMatchObject({
      category: 'loan',
      kind: 'income',
    });
  });

  it('keeps the starting weekly projection costly before manual planning', () => {
    const save = createTestSave();
    const projection = projectWeeklyEconomy(save);

    expect(projection.net).toBeLessThan(0);
    expect(projection.incomeByCategory.production ?? 0).toBeLessThan(
      projection.expenseByCategory.staff ?? 0,
    );
  });

  it('does not let default production carry an empty ludus', () => {
    const save = createInitialSave({
      ludusName: 'Ludus Magnus',
      saveId: 'empty-save-test',
      createdAt: '2026-04-25T12:00:00.000Z',
    });
    const projection = projectWeeklyEconomy(save);

    expect(projection.net).toBeLessThan(0);
  });

  it('keeps small loan repayments meaningful for the starting weekly plan', () => {
    const loanedSave = takeLoan(createTestSave(), 'smallLoan').save;
    const projection = projectWeeklyEconomy(loanedSave);

    expect(projection.net).toBeLessThanOrEqual(0);
  });

  it('keeps actual current week summary separate from the weekly projection', () => {
    const loanedSave = takeLoan(createTestSave(), 'smallLoan').save;
    const synchronizedSave = synchronizeEconomyProjection(loanedSave);

    expect(synchronizedSave.economy.currentWeekSummary.incomeByCategory.loan).toBe(
      LOAN_DEFINITIONS[0].amount,
    );
    expect(synchronizedSave.economy.weeklyProjection.incomeByCategory.loan).toBeUndefined();
    expect(synchronizedSave.economy.weeklyProjection.expenseByCategory.loan).toBe(
      LOAN_DEFINITIONS[0].weeklyPayment,
    );
  });

  it('keeps running weekly report aggregates up to date', () => {
    const result = resolveWeekStep(withCompleteWeeklyPlanning(createTestSave()), () => 1);
    const runningReport = result.planning.reports[0];

    expect(runningReport).toMatchObject({
      id: 'running-1-1',
      treasuryDelta: runningReport.days[0].treasuryDelta,
      happinessDelta: runningReport.days[0].happinessDelta,
      securityDelta: runningReport.days[0].securityDelta,
      rebellionDelta: runningReport.days[0].rebellionDelta,
    });
  });

  it('marks the game lost when treasury reaches the defeat threshold', () => {
    const save = createTestSave({
      ludus: {
        ...createTestSave().ludus,
        treasury: GAME_BALANCE.macroSimulation.gameOverTreasuryThreshold,
      },
    });

    const plan = createDefaultDailyPlan('monday');
    plan.laborPoints.production = 0;
    const result = resolveDailyPlan(save, plan, () => 1);

    expect(result.save.ludus.gameStatus).toBe('lost');
    expect(result.save.time.phase).toBe('gameOver');
  });

  it('starts Sunday arena without rolling the week forward', () => {
    const sundaySave: GameSave = {
      ...createTestSave(),
      gladiators: [],
      time: {
        ...createTestSave().time,
        dayOfWeek: 'sunday',
        phase: 'arena',
      },
    };

    const result = resolveWeekStep(sundaySave, () => 1);

    expect(result.time).toMatchObject({ week: 1, dayOfWeek: 'sunday', phase: 'arena' });
    expect(result.arena.arenaDay).toMatchObject({
      year: 1,
      week: 1,
      phase: 'intro',
    });
  });

  it('repays active loans when Sunday arena is completed', () => {
    const loanedSave = takeLoan(createTestSave(), 'smallLoan').save;
    const loan = LOAN_DEFINITIONS.find((definition) => definition.id === 'smallLoan')!;
    const sundaySave: GameSave = {
      ...loanedSave,
      gladiators: [],
      time: {
        ...loanedSave.time,
        dayOfWeek: 'sunday',
        phase: 'arena',
      },
    };

    const arenaSave = resolveWeekStep(sundaySave, () => 1);
    const result = completeSundayArenaDay(arenaSave, () => 1);

    expect(result.time).toMatchObject({ week: 2, dayOfWeek: 'monday', phase: 'report' });
    expect(result.arena.arenaDay).toBeUndefined();
    expect(result.economy.activeLoans[0]).toMatchObject({
      remainingBalance: loan.weeklyPayment * loan.durationWeeks - loan.weeklyPayment,
      remainingWeeks: loan.durationWeeks - 1,
    });
    expect(result.staff.marketCandidates[0].id).toBe('staff-market-1-2-slave-1');
    expect(result.economy.ledgerEntries[0]).toMatchObject({
      kind: 'expense',
      amount: loan.weeklyPayment,
      labelKey: 'finance.ledger.weeklyLoanPayment',
    });
  });

  it('starts a fresh running report when a new week has an older final report', () => {
    const save = withCompleteWeeklyPlanning(
      createTestSave({
        planning: {
          ...createTestSave().planning,
          reports: [
            {
              id: 'report-1-1',
              year: 1,
              week: 1,
              days: [
                {
                  dayOfWeek: 'friday',
                  treasuryDelta: 10,
                  reputationDelta: 0,
                  happinessDelta: 0,
                  securityDelta: 0,
                  rebellionDelta: 0,
                  injuredGladiatorIds: [],
                  eventIds: [],
                },
              ],
              treasuryDelta: 10,
              reputationDelta: 0,
              happinessDelta: 0,
              securityDelta: 0,
              rebellionDelta: 0,
              injuries: 0,
            },
          ],
        },
      }),
    );

    const result = resolveWeekStep(save, () => 1);

    expect(result.planning.reports[0]).toMatchObject({
      id: 'running-1-1',
      week: 1,
    });
    expect(result.planning.reports[0].days).toHaveLength(1);
    expect(result.planning.reports[1].id).toBe('report-1-1');
  });
});
