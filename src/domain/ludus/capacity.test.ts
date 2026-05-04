import { describe, expect, it } from 'vitest';
import { createInitialSave } from '../saves/create-initial-save';
import type { GameSave } from '../saves/types';
import { getAvailableLudusGladiatorPlaces, getLudusGladiatorCapacity } from './capacity';

function createTestSave() {
  return createInitialSave({
    ludusName: 'Ludus Magnus',
    saveId: 'save-test',
    createdAt: '2026-04-25T12:00:00.000Z',
  });
}

function withDomusLevel(save: GameSave, level: number): GameSave {
  return {
    ...save,
    buildings: {
      ...save.buildings,
      domus: {
        ...save.buildings.domus,
        level,
      },
    },
  };
}

describe('ludus capacity', () => {
  it('uses the Domus level as the gladiator capacity', () => {
    expect(getLudusGladiatorCapacity(createTestSave())).toBe(1);
    expect(getLudusGladiatorCapacity(withDomusLevel(createTestSave(), 4))).toBe(4);
  });

  it('caps gladiator capacity at six', () => {
    expect(getLudusGladiatorCapacity(withDomusLevel(createTestSave(), 8))).toBe(6);
  });

  it('ignores legacy purchased bed configuration', () => {
    const baseSave = createTestSave();
    const save = {
      ...baseSave,
      buildings: {
        ...baseSave.buildings,
        domus: {
          ...baseSave.buildings.domus,
          level: 2,
        },
        dormitory: {
          ...baseSave.buildings.dormitory,
          configuration: { purchasedBeds: 12 },
        },
      },
    };

    expect(getLudusGladiatorCapacity(save)).toBe(2);
  });

  it('reports available capacity from the current roster size', () => {
    const save = {
      ...withDomusLevel(createTestSave(), 3),
      gladiators: [
        {
          id: 'gladiator-test',
          name: 'Aulus',
          age: 18,
          strength: 7,
          agility: 6,
          defense: 7,
          life: 85,
          reputation: 0,
          wins: 0,
          losses: 0,
          traits: [],
        },
      ],
    };

    expect(getAvailableLudusGladiatorPlaces(save)).toBe(2);
  });
});
