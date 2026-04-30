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
