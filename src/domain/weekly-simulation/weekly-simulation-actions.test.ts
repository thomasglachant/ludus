import { describe, expect, it } from 'vitest';
import { GAME_BALANCE } from '../../game-data/balance';
import { LOAN_DEFINITIONS } from '../../game-data/economy';
import { takeLoan } from '../economy/economy-actions';
import type { Gladiator } from '../gladiators/types';
import { createInitialSave } from '../saves/create-initial-save';
import type { GameSave } from '../saves/types';
import {
  applyGladiatorTrait,
  applyGladiatorTraitAtDate,
} from '../gladiator-traits/gladiator-trait-actions';
import {
  completeSundayArenaDay,
  createDefaultDailyPlan,
  projectDailyPlan,
  projectWeeklyEconomy,
  projectWeeklyPlan,
  resolveDailyPlan,
  resolvePendingGameAction,
  resolveWeekStep,
  synchronizeEconomyProjection,
} from './weekly-simulation-actions';

function createGladiator(overrides: Partial<Gladiator> = {}): Gladiator {
  return {
    id: 'gladiator-test',
    name: 'Aulus',
    age: 20,
    experience: 0,
    strength: 3,
    agility: 3,
    defense: 2,
    life: 2,
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
  const { pendingActionTrigger, ...time } = save.time;

  void pendingActionTrigger;

  return {
    ...save,
    time,
    gladiators: [createGladiator()],
    ...overrides,
  };
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
        training: 8 * gladiatorCount,
        meals: 0,
        sleep: 0,
      },
      laborPoints: {
        ...days[dayOfWeek].laborPoints,
        production: 4,
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
      ]),
    );
    expect(result.save.economy.currentWeekSummary.net).toBe(result.summary.treasuryDelta);
  });

  it('applies capped need penalties and records injuries for heavy training days', () => {
    const save = createTestSave();
    const plan = createDefaultDailyPlan('monday');
    plan.gladiatorTimePoints.training = 12;
    plan.gladiatorTimePoints.meals = 0;
    plan.gladiatorTimePoints.sleep = 0;

    const result = resolveDailyPlan(save, plan, () => 0);
    const gladiator = result.save.gladiators[0];

    expect(result.summary.injuredGladiatorIds).toContain('gladiator-test');
    expect(result.summary.happinessDelta).toBeLessThan(0);
    expect(gladiator.traits).toEqual([
      {
        traitId: 'injury',
        expiresAt: { dayOfWeek: 'wednesday', week: 1, year: 1 },
      },
    ]);
    expect(gladiator.experience).toBe(save.gladiators[0].experience);
    expect(gladiator.strength).toBe(save.gladiators[0].strength);
    expect(gladiator.life).toBe(save.gladiators[0].life);
  });

  it('excludes already injured gladiators from incompatible training gains', () => {
    const save = applyGladiatorTrait(
      createTestSave({
        gladiators: [
          createGladiator({
            life: 2,
            strength: 3,
          }),
        ],
      }),
      'injury',
      2,
      'gladiator-test',
    );
    const plan = createDefaultDailyPlan('monday');
    plan.gladiatorTimePoints.training = 8;

    const result = resolveDailyPlan(save, plan, () => 1);

    expect(result.summary.injuredGladiatorIds).toEqual([]);
    expect(result.save.gladiators[0].experience).toBe(save.gladiators[0].experience);
    expect(result.save.gladiators[0].strength).toBe(save.gladiators[0].strength);
  });

  it('applies focused training as experience without directly changing skills', () => {
    const save = createTestSave();
    const plan = createDefaultDailyPlan('monday');
    plan.gladiatorTimePoints.training = 3;

    const result = resolveDailyPlan(save, plan, () => 1);
    const gladiator = result.save.gladiators[0];

    expect(gladiator.experience).toBeGreaterThan(save.gladiators[0].experience);
    expect(gladiator.strength).toBe(save.gladiators[0].strength);
    expect(gladiator.agility).toBe(save.gladiators[0].agility);
    expect(gladiator.defense).toBe(save.gladiators[0].defense);
    expect(gladiator.life).toBe(save.gladiators[0].life);
  });

  it('applies victory aura as a training experience bonus', () => {
    const baseSave = createTestSave();
    const boostedSave = applyGladiatorTrait(baseSave, 'victoryAura', 3, 'gladiator-test');
    const plan = createDefaultDailyPlan('monday');
    plan.gladiatorTimePoints.training = 3;

    const baseResult = resolveDailyPlan(baseSave, plan, () => 1);
    const boostedResult = resolveDailyPlan(boostedSave, plan, () => 1);
    const baseGain = baseResult.save.gladiators[0].experience - baseSave.gladiators[0].experience;
    const boostedGain =
      boostedResult.save.gladiators[0].experience - boostedSave.gladiators[0].experience;

    expect(boostedGain).toBeGreaterThan(baseGain);
    expect(boostedGain / baseGain).toBeCloseTo(1.1, 1);
  });

  it('regenerates skill allocation alerts when daily training grants a level', () => {
    const save = createTestSave({
      gladiators: [createGladiator({ experience: 90 })],
    });
    const plan = createDefaultDailyPlan('monday');
    plan.gladiatorTimePoints.training = 2;

    const result = resolveDailyPlan(save, plan, () => 1);

    expect(result.save.gladiators[0].experience).toBeGreaterThanOrEqual(100);
    expect(result.save.planning.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionKind: 'allocateGladiatorSkillPoint',
          gladiatorId: 'gladiator-test',
        }),
      ]),
    );
  });

  it('normalizes training gains per available gladiator', () => {
    const oneGladiatorSave = createTestSave();
    const oneGladiatorPlan = createDefaultDailyPlan('monday');
    oneGladiatorPlan.gladiatorTimePoints.training = 3;
    const manyGladiatorSave = createTestSave({
      gladiators: Array.from({ length: 10 }, (_, index) =>
        createGladiator({ id: `gladiator-test-${index}` }),
      ),
    });
    const manyGladiatorPlan = createDefaultDailyPlan('monday');
    manyGladiatorPlan.gladiatorTimePoints.training = 30;

    const oneGladiatorResult = resolveDailyPlan(oneGladiatorSave, oneGladiatorPlan, () => 1);
    const manyGladiatorResult = resolveDailyPlan(manyGladiatorSave, manyGladiatorPlan, () => 1);

    expect(manyGladiatorResult.save.gladiators[0].experience).toBeCloseTo(
      oneGladiatorResult.save.gladiators[0].experience,
    );
  });

  it('caps excessive training gains above the daily realistic ceiling', () => {
    const normalPlan = createDefaultDailyPlan('monday');
    normalPlan.gladiatorTimePoints.training =
      GAME_BALANCE.macroSimulation.idealTrainingPressurePointsPerGladiator;
    const excessivePlan = createDefaultDailyPlan('monday');
    excessivePlan.gladiatorTimePoints.training = 12;

    const normalResult = resolveDailyPlan(createTestSave(), normalPlan, () => 1);
    const excessiveResult = resolveDailyPlan(createTestSave(), excessivePlan, () => 1);
    const normalGain =
      normalResult.save.gladiators[0].experience - createTestSave().gladiators[0].experience;
    const excessiveGain =
      excessiveResult.save.gladiators[0].experience - createTestSave().gladiators[0].experience;

    expect(excessiveGain).toBeGreaterThan(normalGain);
    expect(excessiveGain).toBeLessThan(normalGain * 3);
  });

  it('clears expired gladiator traits when Sunday arena is completed', () => {
    const sundaySave: GameSave = {
      ...applyGladiatorTraitAtDate(createTestSave(), 'injury', 2, 'gladiator-test', {
        dayOfWeek: 'saturday',
        week: 1,
        year: 1,
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

    expect(result.time).toMatchObject({
      week: 2,
      dayOfWeek: 'monday',
      phase: 'planning',
      pendingActionTrigger: 'startWeek',
    });
    expect(result.gladiators[0].traits).toEqual([]);
  });

  it('regenerates next-week skill alerts after Sunday completion', () => {
    const sundaySave: GameSave = {
      ...createTestSave({
        gladiators: [createGladiator({ experience: 100 })],
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

    expect(result.time).toMatchObject({ week: 2, dayOfWeek: 'monday' });
    expect(result.planning.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionKind: 'allocateGladiatorSkillPoint',
          gladiatorId: 'gladiator-test',
        }),
      ]),
    );
  });

  it('uses the macro happiness threshold for rebellion pressure', () => {
    const pressurePlan = createDefaultDailyPlan('monday');
    pressurePlan.gladiatorTimePoints.meals = 0;
    pressurePlan.gladiatorTimePoints.sleep = 4;
    pressurePlan.laborPoints.production = 0;

    const unhappyResult = resolveDailyPlan(
      createTestSave({
        ludus: {
          ...createTestSave().ludus,
          happiness: GAME_BALANCE.macroSimulation.rebellionPressureHappinessThreshold - 1,
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
        },
      }),
      pressurePlan,
      () => 1,
    );

    expect(unhappyResult.summary.rebellionDelta).toBe(
      GAME_BALANCE.macroSimulation.rebellionPressureDailyIncrease,
    );
    expect(stableResult.summary.rebellionDelta).toBe(
      -GAME_BALANCE.macroSimulation.rebellionCalmDailyReduction,
    );
  });

  it('applies planned gladiator building effects during daily resolution', () => {
    const save = createTestSave({
      gladiators: [createGladiator({ life: 2 })],
    });
    const plan = createDefaultDailyPlan('monday');
    plan.gladiatorTimePoints.sleep = 4;
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
    plan.buildingActivitySelections.production = 'canteen.supplyContracts';
    const canteenSave: GameSave = {
      ...save,
      buildings: {
        ...save.buildings,
        canteen: {
          ...save.buildings.canteen,
          isPurchased: true,
          level: 1,
        },
      },
    };
    const unlockedCanteenSave: GameSave = {
      ...canteenSave,
      buildings: {
        ...canteenSave.buildings,
        canteen: {
          ...canteenSave.buildings.canteen,
          purchasedSkillIds: ['canteen.supply-contracts'],
        },
      },
    };

    const baseResult = resolveDailyPlan(canteenSave, plan, () => 1);
    const unlockedResult = resolveDailyPlan(unlockedCanteenSave, plan, () => 1);

    expect(unlockedResult.summary.treasuryDelta).toBeGreaterThan(baseResult.summary.treasuryDelta);
    expect(unlockedResult.save.economy.ledgerEntries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          buildingId: 'canteen',
          category: 'production',
          kind: 'income',
          labelKey: 'finance.ledger.buildingActivityIncome',
          relatedId: 'canteen.supplyContracts',
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
    expect(save.gladiators[0].experience).toBe(0);
    expect(save.gladiators[0].strength).toBe(3);
  });

  it('projects the planned week with aggregated macro deltas', () => {
    const save = createTestSave();
    const projection = projectWeeklyPlan(save);

    expect(projection.id).toBe('projection-1-1');
    expect(projection.days).toHaveLength(6);
    expect(projection.treasuryDelta).toBe(
      projection.days.reduce((total, day) => total + day.treasuryDelta, 0),
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

  it('keeps the starting weekly projection neutral before manual planning', () => {
    const save = createTestSave();
    const projection = projectWeeklyEconomy(save);

    expect(projection.net).toBe(0);
  });

  it('keeps an empty ludus neutral before manual planning', () => {
    const save = createInitialSave({
      ludusName: 'Ludus Magnus',
      saveId: 'empty-save-test',
      createdAt: '2026-04-25T12:00:00.000Z',
    });
    const projection = projectWeeklyEconomy(save);

    expect(projection.net).toBe(0);
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
      rebellionDelta: runningReport.days[0].rebellionDelta,
    });
  });

  it('advances the week step even when weekly planning is incomplete', () => {
    const result = resolveWeekStep(createTestSave(), () => 1);

    expect(result.time).toMatchObject({ dayOfWeek: 'tuesday', phase: 'planning' });
    expect(result.planning.reports[0].days).toHaveLength(1);
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

  it('queues Sunday arena without rolling the week forward', () => {
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

    expect(result.time).toMatchObject({
      week: 1,
      dayOfWeek: 'sunday',
      phase: 'arena',
      pendingActionTrigger: 'enterArena',
    });
    expect(result.arena.arenaDay).toBeUndefined();
  });

  it('queues Sunday arena after Saturday resolution', () => {
    const baseSave = createTestSave();
    const saturdaySave = withCompleteWeeklyPlanning({
      ...baseSave,
      time: {
        ...baseSave.time,
        dayOfWeek: 'saturday',
        phase: 'planning',
      },
    });

    const result = resolveWeekStep(saturdaySave, () => 1);

    expect(result.time).toMatchObject({
      week: 1,
      dayOfWeek: 'sunday',
      phase: 'arena',
      pendingActionTrigger: 'enterArena',
    });
    expect(result.arena.arenaDay).toBeUndefined();
    expect(result.arena.isArenaDayActive).toBe(false);
    expect(result.arena.resolvedCombats).toHaveLength(0);
  });

  it('starts Sunday arena only when the pending arena action is resolved', () => {
    const queuedSave = resolveWeekStep(
      withCompleteWeeklyPlanning({
        ...createTestSave(),
        time: {
          ...createTestSave().time,
          dayOfWeek: 'saturday',
          phase: 'planning',
        },
      }),
      () => 1,
    );

    const result = resolvePendingGameAction(queuedSave, 'enterArena', () => 1);

    expect(result.time.pendingActionTrigger).toBeUndefined();
    expect(result.arena.arenaDay).toMatchObject({
      year: 1,
      week: 1,
      phase: 'summary',
    });
    expect(result.arena.isArenaDayActive).toBe(true);
    expect(result.arena.resolvedCombats).toHaveLength(1);
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

    const arenaSave = resolvePendingGameAction(
      resolveWeekStep(sundaySave, () => 1),
      'enterArena',
      () => 1,
    );
    const result = completeSundayArenaDay(arenaSave, () => 1);

    expect(result.time).toMatchObject({
      week: 2,
      dayOfWeek: 'monday',
      phase: 'planning',
      pendingActionTrigger: 'startWeek',
    });
    expect(result.arena.arenaDay).toBeUndefined();
    expect(result.economy.activeLoans[0]).toMatchObject({
      remainingBalance: loan.weeklyPayment * loan.durationWeeks - loan.weeklyPayment,
      remainingWeeks: loan.durationWeeks - 1,
    });
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
                  rebellionDelta: 0,
                  injuredGladiatorIds: [],
                  eventIds: [],
                },
              ],
              treasuryDelta: 10,
              reputationDelta: 0,
              happinessDelta: 0,
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
