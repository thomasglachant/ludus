import { describe, expect, it } from 'vitest';
import { CURRENT_SCHEMA_VERSION, createInitialSave } from './create-initial-save';
import { isGameSave, parseGameSave } from './save-validation';

function createTestSave() {
  return createInitialSave({
    ludusName: 'Ludus Magnus',
    saveId: 'save-test',
    createdAt: '2026-04-25T12:00:00.000Z',
  });
}

function createJsonClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

describe('save validation', () => {
  it('rejects current schema saves without launched event history', () => {
    const save = createTestSave();
    const incompleteSave = {
      ...save,
      events: {
        pendingEvents: [],
        resolvedEvents: [],
      },
    };

    expect(isGameSave(incompleteSave)).toBe(false);
    expect(parseGameSave(JSON.stringify(incompleteSave))).toBeNull();
  });

  it('accepts a valid arena day checkpoint', () => {
    const save = createTestSave();
    const arenaDaySave = {
      ...save,
      arena: {
        ...save.arena,
        arenaDay: {
          year: save.time.year,
          week: save.time.week,
          phase: 'intro',
          presentedCombatIds: [],
        },
      },
    };

    expect(isGameSave(arenaDaySave)).toBe(true);
    expect(parseGameSave(JSON.stringify(arenaDaySave))?.arena.arenaDay).toMatchObject({
      phase: 'intro',
      presentedCombatIds: [],
    });
  });

  it('preserves valid pending action triggers', () => {
    const save = {
      ...createTestSave(),
      time: {
        ...createTestSave().time,
        pendingActionTrigger: 'enterArena' as const,
      },
    };

    expect(isGameSave(save)).toBe(true);
    expect(parseGameSave(JSON.stringify(save))?.time.pendingActionTrigger).toBe('enterArena');
  });

  it('rejects legacy arena market saves through the current schema gate', () => {
    const save = createTestSave();
    const legacySave = {
      ...save,
      schemaVersion: 6,
      arena: {
        ...save.arena,
        betting: {
          legacy: true,
        },
        pendingCombats: [],
      },
    };
    const parsed = parseGameSave(JSON.stringify(legacySave));

    expect(parsed).toBeNull();
  });

  it('rejects legacy satiety and canteen meal saves through the current schema gate', () => {
    const save = createTestSave();
    const legacySave = {
      ...save,
      schemaVersion: 7,
      buildings: {
        ...save.buildings,
        canteen: {
          ...save.buildings.canteen,
          configuration: { mealPlanId: 'balancedMeals' },
          purchasedImprovementIds: ['betterKitchen'],
          selectedPolicyId: 'balancedMeals',
        },
      },
      gladiators: [
        {
          id: 'gladiator-test',
          name: 'Aulus',
          age: 18,
          strength: 7,
          agility: 6,
          defense: 7,
          life: 85,
          satiety: 80,
          reputation: 0,
          wins: 0,
          losses: 0,
          traits: [],
        },
      ],
    };
    const parsed = parseGameSave(JSON.stringify(legacySave));

    expect(parsed).toBeNull();
  });

  it('rejects previous-schema saves through the current schema gate', () => {
    const save = createJsonClone(createTestSave());
    const legacySave = {
      ...save,
      schemaVersion: CURRENT_SCHEMA_VERSION - 1,
      ludus: {
        ...save.ludus,
        glory: 4,
      },
    };
    const parsed = parseGameSave(JSON.stringify(legacySave));

    expect(parsed).toBeNull();
  });

  it('strips obsolete real-time fields from current-schema transitional saves', () => {
    const save = createJsonClone(createTestSave());
    const transitionalSave = {
      ...save,
      time: {
        ...save.time,
        hour: 8,
        isPaused: false,
        minute: 30,
        speed: 1,
      },
      gladiators: [
        {
          id: 'gladiator-test',
          name: 'Aulus',
          age: 18,
          experience: 0,
          strength: 3,
          agility: 3,
          defense: 2,
          life: 2,
          reputation: 0,
          wins: 0,
          losses: 0,
          traits: [],
          currentActivityId: 'training',
          currentBuildingId: 'trainingGround',
          currentLocationId: 'trainingGround',
          currentTaskStartedAt: { year: 1, week: 1, dayOfWeek: 'monday', hour: 8, minute: 0 },
          mapMovement: {
            destination: { column: 1, row: 1 },
            path: [{ column: 0, row: 0 }],
          },
        },
      ],
    };

    const parsed = parseGameSave(JSON.stringify(transitionalSave));

    expect(parsed).not.toBeNull();
    expect(parsed?.time).toEqual({
      dayOfWeek: save.time.dayOfWeek,
      pendingActionTrigger: 'startWeek',
      phase: 'planning',
      week: save.time.week,
      year: save.time.year,
    });
    expect(parsed?.time).not.toHaveProperty('hour');
    expect(parsed?.time).not.toHaveProperty('minute');
    expect(parsed?.time).not.toHaveProperty('speed');
    expect(parsed?.time).not.toHaveProperty('isPaused');
    expect(parsed?.gladiators[0]).not.toHaveProperty('currentActivityId');
    expect(parsed?.gladiators[0]).not.toHaveProperty('currentBuildingId');
    expect(parsed?.gladiators[0]).not.toHaveProperty('currentLocationId');
    expect(parsed?.gladiators[0]).not.toHaveProperty('currentTaskStartedAt');
    expect(parsed?.gladiators[0]).not.toHaveProperty('mapMovement');
  });

  it('migrates removed office and noble training building references', () => {
    const save = createJsonClone(createTestSave());
    const transitionalSave = {
      ...save,
      buildings: {
        ...save.buildings,
        office: {
          ...save.buildings.domus,
          id: 'office',
          isPurchased: true,
          purchasedSkillIds: ['office.profit-forecasting'],
        },
        nobleTraining: {
          ...save.buildings.trainingGround,
          id: 'nobleTraining',
          isPurchased: true,
          purchasedSkillIds: ['nobleTraining.patron-sessions'],
        },
      },
      planning: {
        ...save.planning,
        days: {
          ...save.planning.days,
          monday: {
            ...save.planning.days.monday,
            buildingActivitySelections: {
              contracts: 'nobleTraining.patronSessions',
              maintenance: 'office.profitForecasting',
            },
          },
        },
      },
    };

    const parsed = parseGameSave(JSON.stringify(transitionalSave));

    expect(parsed).not.toBeNull();
    expect(parsed?.buildings).not.toHaveProperty('office');
    expect(parsed?.buildings).not.toHaveProperty('nobleTraining');
    expect(parsed?.planning.days.monday.buildingActivitySelections).toEqual({});
  });

  it('rejects malformed arena day checkpoints', () => {
    const save = createTestSave();
    const malformedArenaDays = [
      {},
      { year: save.time.year, week: save.time.week, phase: 'combats', presentedCombatIds: [] },
      { year: save.time.year, week: save.time.week, phase: 'summary', presentedCombatIds: [42] },
      { year: save.time.year, week: save.time.week, phase: 'summary' },
    ];

    for (const arenaDay of malformedArenaDays) {
      const malformedSave = {
        ...save,
        arena: {
          ...save.arena,
          arenaDay,
        },
      };

      expect(isGameSave(malformedSave)).toBe(false);
      expect(parseGameSave(JSON.stringify(malformedSave))).toBeNull();
    }
  });

  it('rejects malformed macro planning days', () => {
    const save = createTestSave();
    const malformedSave = {
      ...save,
      planning: {
        ...save.planning,
        days: {
          ...save.planning.days,
          monday: {
            ...save.planning.days.monday,
            buildingActivitySelections: {
              production: 'trainingGround.nobleTraining',
            },
          },
        },
      },
    };

    expect(isGameSave(malformedSave)).toBe(false);
    expect(parseGameSave(JSON.stringify(malformedSave))).toBeNull();
  });

  it('rejects legacy weekly injury state and accepts current gladiator traits', () => {
    const save = createTestSave();
    const legacySave = {
      ...save,
      gladiators: [
        {
          id: 'gladiator-test',
          name: 'Aulus',
          age: 18,
          experience: 0,
          strength: 3,
          agility: 3,
          defense: 2,
          life: 2,
          reputation: 0,
          wins: 0,
          losses: 0,
          traits: [],
          weeklyInjury: {
            reason: 'training',
            year: save.time.year,
            week: save.time.week,
          },
        },
      ],
    };
    const currentTraitSave = {
      ...save,
      gladiators: [
        {
          id: 'gladiator-test',
          name: 'Aulus',
          age: 18,
          experience: 0,
          strength: 3,
          agility: 3,
          defense: 2,
          life: 2,
          reputation: 0,
          wins: 0,
          losses: 0,
          traits: [
            { traitId: 'disciplined' },
            {
              traitId: 'injury',
              expiresAt: {
                dayOfWeek: 'wednesday',
                week: save.time.week,
                year: save.time.year,
              },
            },
          ],
        },
      ],
    };

    expect(isGameSave(legacySave)).toBe(false);
    expect(parseGameSave(JSON.stringify(legacySave))).toBeNull();
    expect(parseGameSave(JSON.stringify(currentTraitSave))?.gladiators[0].traits).toEqual([
      { traitId: 'disciplined' },
      {
        traitId: 'injury',
        expiresAt: { dayOfWeek: 'wednesday', week: save.time.week, year: save.time.year },
      },
    ]);
  });

  it('normalizes daily plans that do not yet store specialized activity selections', () => {
    const save = createTestSave();
    const mondayWithoutSelections: Record<string, unknown> = { ...save.planning.days.monday };
    delete mondayWithoutSelections.buildingActivitySelections;
    const saveWithoutSelections = {
      ...save,
      planning: {
        ...save.planning,
        days: {
          ...save.planning.days,
          monday: mondayWithoutSelections,
        },
      },
    };

    const parsed = parseGameSave(JSON.stringify(saveWithoutSelections));

    expect(parsed?.planning.days.monday.buildingActivitySelections).toEqual({});
  });

  it('rejects previous-schema focused training plan points through the current schema gate', () => {
    const save = createJsonClone(createTestSave());
    const legacySave = {
      ...save,
      schemaVersion: CURRENT_SCHEMA_VERSION - 1,
      planning: {
        ...save.planning,
        days: {
          ...save.planning.days,
          monday: {
            ...save.planning.days.monday,
            gladiatorTimePoints: {
              agilityTraining: 2,
              defenseTraining: 1,
              lifeTraining: 1,
              meals: 0,
              production: 0,
              sleep: 0,
              strengthTraining: 3,
            },
          },
        },
      },
    };
    const parsed = parseGameSave(JSON.stringify(legacySave));

    expect(parsed).toBeNull();
  });

  it('rejects malformed economy ledger entries', () => {
    const save = createTestSave();
    const malformedSave = {
      ...save,
      economy: {
        ...save.economy,
        ledgerEntries: [
          {
            id: 'ledger-test',
            year: save.time.year,
            week: save.time.week,
            dayOfWeek: 'monday',
            kind: 'bonus',
            category: 'arena',
            amount: 100,
            labelKey: 'finance.ledger.test',
          },
        ],
      },
    };

    expect(isGameSave(malformedSave)).toBe(false);
    expect(parseGameSave(JSON.stringify(malformedSave))).toBeNull();
  });

  it('rejects malformed economy loans and projections', () => {
    const save = createTestSave();
    const malformedLoanSave = {
      ...save,
      economy: {
        ...save.economy,
        activeLoans: [
          {
            id: 'loan-test',
            definitionId: 'imperialLoan',
            principal: 100,
            remainingBalance: 120,
            weeklyPayment: 12,
            remainingWeeks: 10,
            startedYear: save.time.year,
            startedWeek: save.time.week,
          },
        ],
      },
    };
    const malformedProjectionSave = {
      ...save,
      economy: {
        ...save.economy,
        weeklyProjection: {
          incomeByCategory: {
            imperialFavor: 50,
          },
          expenseByCategory: {},
          net: 50,
        },
      },
    };

    expect(isGameSave(malformedLoanSave)).toBe(false);
    expect(parseGameSave(JSON.stringify(malformedLoanSave))).toBeNull();
    expect(isGameSave(malformedProjectionSave)).toBe(false);
    expect(parseGameSave(JSON.stringify(malformedProjectionSave))).toBeNull();
  });

  it('normalizes economy saves without a current week summary', () => {
    const save = createTestSave();
    const economyWithoutCurrentSummary: Record<string, unknown> = {
      ...save.economy,
      ledgerEntries: [
        {
          id: 'ledger-test',
          year: save.time.year,
          week: save.time.week,
          dayOfWeek: save.time.dayOfWeek,
          kind: 'income',
          category: 'event',
          amount: 80,
          labelKey: 'events.surplusHarvest.title',
        },
      ],
    };
    delete economyWithoutCurrentSummary.currentWeekSummary;
    const parsed = parseGameSave(
      JSON.stringify({
        ...save,
        economy: economyWithoutCurrentSummary,
      }),
    );

    expect(parsed?.economy.currentWeekSummary.incomeByCategory.event).toBe(80);
    expect(parsed?.economy.currentWeekSummary.net).toBe(80);
  });
});
