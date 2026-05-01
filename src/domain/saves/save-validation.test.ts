import { describe, expect, it } from 'vitest';
import { createInitialSave } from './create-initial-save';
import { isGameSave, parseGameSave } from './save-validation';

function createTestSave() {
  return createInitialSave({
    ludusName: 'Ludus Magnus',
    saveId: 'save-test',
    createdAt: '2026-04-25T12:00:00.000Z',
  });
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

  it('strips legacy arena market state during normalization', () => {
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

    expect(parsed?.schemaVersion).toBe(save.schemaVersion);
    expect((parsed?.arena as { betting?: unknown } | undefined)?.betting).toBeUndefined();
    expect(
      (parsed?.arena as { pendingCombats?: unknown } | undefined)?.pendingCombats,
    ).toBeUndefined();
  });

  it('strips legacy satiety and canteen meal setup during normalization', () => {
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
          energy: 80,
          health: 85,
          morale: 75,
          satiety: 80,
          reputation: 0,
          wins: 0,
          losses: 0,
          traits: [],
        },
      ],
    };
    const parsed = parseGameSave(JSON.stringify(legacySave));

    expect((parsed?.gladiators[0] as { satiety?: unknown } | undefined)?.satiety).toBeUndefined();
    expect(parsed?.buildings.canteen.configuration).toBeUndefined();
    expect(parsed?.buildings.canteen.selectedPolicyId).toBeUndefined();
    expect(parsed?.buildings.canteen.purchasedImprovementIds).toEqual([]);
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
});
