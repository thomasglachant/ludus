import { describe, expect, it } from 'vitest';
import { GAME_BALANCE } from '../../game-data/balance';
import { LOAN_DEFINITIONS } from '../../game-data/economy';
import { takeLoan } from '../economy/economy-actions';
import type { Gladiator } from '../gladiators/types';
import { createInitialSave } from '../saves/create-initial-save';
import type { GameSave } from '../saves/types';
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
    health: 80,
    energy: 80,
    morale: 80,
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

describe('weekly simulation actions', () => {
  it('resolves daily contracts, production and ledger entries from allocated points', () => {
    const save = createTestSave();
    const plan = createDefaultDailyPlan('monday');
    plan.adminPoints.contracts = 3;
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

  it('adds eligible macro events to the daily report and moves into event phase', () => {
    const save = createTestSave();
    const plan = createDefaultDailyPlan('monday');
    plan.gladiatorTimePoints.training = 0;
    plan.gladiatorTimePoints.meals = 0;
    plan.gladiatorTimePoints.sleep = 0;
    plan.gladiatorTimePoints.leisure = 0;
    plan.gladiatorTimePoints.care = 0;
    plan.adminPoints.contracts = 0;
    plan.adminPoints.events = 0;
    plan.laborPoints.production = 2;
    plan.laborPoints.security = 0;
    plan.laborPoints.maintenance = 0;

    const result = resolveDailyPlan(save, plan, () => 0);

    expect(result.summary.eventIds).toHaveLength(1);
    expect(result.save.events.pendingEvents).toHaveLength(1);
    expect(result.save.time.phase).toBe('event');
  });

  it('blocks week progression while a macro event needs a decision', () => {
    const save = createTestSave({
      events: {
        ...createTestSave().events,
        pendingEvents: [
          {
            id: 'event-test',
            definitionId: 'test',
            titleKey: 'events.test.title',
            descriptionKey: 'events.test.description',
            status: 'pending',
            createdAtYear: 1,
            createdAtWeek: 1,
            createdAtDay: 'monday',
            choices: [],
          },
        ],
      },
    });

    const result = resolveWeekStep(save, () => 0);

    expect(result.time.dayOfWeek).toBe('monday');
    expect(result.time.phase).toBe('event');
  });

  it('applies capped need penalties and records injuries for heavy training days', () => {
    const save = createTestSave();
    const plan = createDefaultDailyPlan('monday');
    plan.gladiatorTimePoints.training = 12;
    plan.gladiatorTimePoints.meals = 0;
    plan.gladiatorTimePoints.sleep = 0;
    plan.gladiatorTimePoints.care = 0;

    const result = resolveDailyPlan(save, plan, () => 0);
    const gladiator = result.save.gladiators[0];

    expect(result.summary.injuredGladiatorIds).toContain('gladiator-test');
    expect(gladiator.weeklyInjury).toEqual({ reason: 'training', week: 1, year: 1 });
    expect(gladiator.strength).toBe(8);
    expect(gladiator.health).toBeLessThan(80);
    expect(gladiator.energy).toBeLessThan(80);
    expect(gladiator.morale).toBeLessThan(80);
  });

  it('excludes already injured gladiators from incompatible training gains', () => {
    const save = createTestSave({
      gladiators: [
        createGladiator({
          health: 90,
          strength: 8,
          weeklyInjury: { reason: 'training', week: 1, year: 1 },
        }),
      ],
    });
    const plan = createDefaultDailyPlan('monday');
    plan.gladiatorTimePoints.training = 8;

    const result = resolveDailyPlan(save, plan, () => 1);

    expect(result.summary.injuredGladiatorIds).toEqual([]);
    expect(result.save.gladiators[0].strength).toBe(8);
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

  it('removes injured gladiators from gladiator contract income', () => {
    const save = createTestSave({
      gladiators: [
        createGladiator({ id: 'ready-gladiator', health: 90 }),
        createGladiator({ id: 'injured-gladiator', health: 40 }),
      ],
    });
    const plan = createDefaultDailyPlan('monday');
    plan.adminPoints.contracts = 4;
    plan.laborPoints.production = 0;

    const result = resolveDailyPlan(save, plan, () => 1);

    expect(result.save.economy.ledgerEntries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          amount: 24,
          category: 'contracts',
          kind: 'income',
          labelKey: 'finance.ledger.dailyIncome',
        }),
      ]),
    );
  });

  it('uses macro happiness and security thresholds for rebellion pressure', () => {
    const pressurePlan = createDefaultDailyPlan('monday');
    pressurePlan.gladiatorTimePoints.training = 0;
    pressurePlan.gladiatorTimePoints.meals = 0;
    pressurePlan.gladiatorTimePoints.sleep = 4;
    pressurePlan.gladiatorTimePoints.leisure = 0;
    pressurePlan.gladiatorTimePoints.care = 0;
    pressurePlan.adminPoints.contracts = 0;
    pressurePlan.adminPoints.events = 0;
    pressurePlan.adminPoints.maintenance = 0;
    pressurePlan.laborPoints.production = 0;
    pressurePlan.laborPoints.security = 0;
    pressurePlan.laborPoints.maintenance = 0;

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
    const save = createTestSave({
      staff: {
        ...createTestSave().staff,
        members: createTestSave().staff.members.map((member) =>
          member.id === 'staff-initial-trainer'
            ? {
                ...member,
                buildingExperience: {
                  ...member.buildingExperience,
                  trainingGround: 1_000,
                },
              }
            : member,
        ),
      },
    });

    const plan = createDefaultDailyPlan('monday');
    plan.adminPoints.contracts = 0;
    plan.laborPoints.production = 0;
    const result = resolveDailyPlan(save, plan, () => 1);

    expect(result.save.buildings.trainingGround.efficiency).toBe(120);
  });

  it('uses building staff requirements by level for efficiency', () => {
    const save = createTestSave({
      buildings: {
        ...createTestSave().buildings,
        trainingGround: {
          ...createTestSave().buildings.trainingGround,
          level: 3,
        },
      },
    });
    const plan = createDefaultDailyPlan('monday');
    plan.adminPoints.contracts = 0;
    plan.laborPoints.production = 0;

    const result = resolveDailyPlan(save, plan, () => 1);

    expect(result.save.buildings.trainingGround.efficiency).toBe(61);
  });

  it('applies purchased building effects to macro income and expenses', () => {
    const save = createTestSave();
    const plan = createDefaultDailyPlan('monday');
    plan.adminPoints.contracts = 10;
    plan.laborPoints.production = 0;
    const baseResult = resolveDailyPlan(save, plan, () => 1);
    const boostedSave: GameSave = {
      ...save,
      buildings: {
        ...save.buildings,
        domus: {
          ...save.buildings.domus,
          purchasedSkillIds: [
            'domus.ledger-room',
            'domus.contract-shelf',
            'domus.staff-registry',
            'domus.treasury-lockbox',
            'domus.reception-atrium',
          ],
        },
        exhibitionGrounds: {
          ...save.buildings.exhibitionGrounds,
          isPurchased: true,
          level: 1,
          purchasedSkillIds: [
            'exhibitionGrounds.sand-ring',
            'exhibitionGrounds.practice-stands',
            'exhibitionGrounds.crowd-fence',
          ],
        },
      },
    };

    const boostedResult = resolveDailyPlan(boostedSave, plan, () => 1);

    const baseContractIncome = baseResult.save.economy.ledgerEntries.find(
      (entry) => entry.kind === 'income' && entry.category === 'contracts',
    );
    const boostedContractIncome = boostedResult.save.economy.ledgerEntries.find(
      (entry) => entry.kind === 'income' && entry.category === 'contracts',
    );

    expect(boostedContractIncome?.amount).toBeGreaterThan(baseContractIncome?.amount ?? 0);
  });

  it('counts event points once for reputation building effects', () => {
    const save = createTestSave({
      buildings: {
        ...createTestSave().buildings,
        domus: {
          ...createTestSave().buildings.domus,
          purchasedSkillIds: [
            'domus.reception-atrium',
            'domus.patron-letters',
            'domus.public-seal',
            'domus.provincial-charter',
          ],
        },
      },
    });
    const plan = createDefaultDailyPlan('monday');
    plan.gladiatorTimePoints.training = 0;
    plan.gladiatorTimePoints.meals = 0;
    plan.gladiatorTimePoints.sleep = 0;
    plan.gladiatorTimePoints.leisure = 0;
    plan.gladiatorTimePoints.care = 0;
    plan.adminPoints.contracts = 0;
    plan.adminPoints.events = 12;
    plan.adminPoints.maintenance = 0;
    plan.laborPoints.production = 0;
    plan.laborPoints.security = 0;
    plan.laborPoints.maintenance = 0;

    const result = resolveDailyPlan(save, plan, () => 1);

    expect(result.summary.reputationDelta).toBe(1);
  });

  it('applies planned gladiator building effects during daily resolution', () => {
    const save = createTestSave({
      gladiators: [createGladiator({ energy: 50 })],
    });
    const plan = createDefaultDailyPlan('monday');
    plan.gladiatorTimePoints.training = 0;
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

    expect(boostedResult.save.gladiators[0].energy).toBeGreaterThan(
      baseResult.save.gladiators[0].energy,
    );
  });

  it('applies unlocked building activities to matching planned points', () => {
    const save = createTestSave();
    const plan = createDefaultDailyPlan('monday');
    plan.adminPoints.contracts = 0;
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
    plan.adminPoints.contracts = 4;
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

  it('keeps the starting weekly projection conservative before upgrades', () => {
    const save = createTestSave();
    const projection = projectWeeklyEconomy(save);

    expect(projection.net).toBeGreaterThan(0);
    expect(projection.net).toBeLessThanOrEqual(GAME_BALANCE.economy.initialTreasury * 0.12);
    expect(projection.incomeByCategory.production ?? 0).toBeLessThan(
      (projection.expenseByCategory.maintenance ?? 0) + (projection.expenseByCategory.staff ?? 0),
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
    const result = resolveWeekStep(createTestSave(), () => 1);
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
    plan.adminPoints.contracts = 0;
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
    expect(result.staff.marketCandidates[0].id).toBe('staff-market-1-2-1');
    expect(result.economy.ledgerEntries[0]).toMatchObject({
      kind: 'expense',
      amount: loan.weeklyPayment,
      labelKey: 'finance.ledger.weeklyLoanPayment',
    });
  });

  it('starts a fresh running report when a new week has an older final report', () => {
    const save = createTestSave({
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
    });

    const result = resolveWeekStep(save, () => 1);

    expect(result.planning.reports[0]).toMatchObject({
      id: 'running-1-1',
      week: 1,
    });
    expect(result.planning.reports[0].days).toHaveLength(1);
    expect(result.planning.reports[1].id).toBe('report-1-1');
  });
});
