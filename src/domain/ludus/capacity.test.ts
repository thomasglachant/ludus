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

const capacityImprovementIds = [
  'dormitoryExtraBunk1',
  'dormitoryExtraBunk2',
  'dormitoryExtraBunk3',
  'dormitoryExtraBunk4',
  'dormitoryExtraBunk5',
];

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

function withDormitoryLevel(save: GameSave, level: number): GameSave {
  return {
    ...save,
    buildings: {
      ...save.buildings,
      dormitory: {
        ...save.buildings.dormitory,
        level,
      },
    },
  };
}

function withDormitoryCapacityImprovements(save: GameSave, count: number): GameSave {
  return {
    ...save,
    buildings: {
      ...save.buildings,
      dormitory: {
        ...save.buildings.dormitory,
        purchasedImprovementIds: capacityImprovementIds.slice(0, count),
      },
    },
  };
}

describe('ludus capacity', () => {
  it('uses the Dormitory base place plus purchased capacity improvements', () => {
    expect(getLudusGladiatorCapacity(createTestSave())).toBe(1);
    expect(getLudusGladiatorCapacity(withDormitoryCapacityImprovements(createTestSave(), 3))).toBe(
      4,
    );
  });

  it('ignores Domus level when calculating gladiator capacity', () => {
    expect(getLudusGladiatorCapacity(withDomusLevel(createTestSave(), 4))).toBe(1);
  });

  it('does not grant capacity from Dormitory levels alone', () => {
    expect(getLudusGladiatorCapacity(withDormitoryLevel(createTestSave(), 5))).toBe(1);
  });

  it('caps gladiator capacity at six', () => {
    expect(getLudusGladiatorCapacity(withDormitoryCapacityImprovements(createTestSave(), 5))).toBe(
      6,
    );
  });

  it('ignores legacy purchased bed configuration', () => {
    const baseSave = createTestSave();
    const save = {
      ...baseSave,
      buildings: {
        ...baseSave.buildings,
        domus: {
          ...baseSave.buildings.domus,
          level: 6,
        },
        dormitory: {
          ...baseSave.buildings.dormitory,
          level: 5,
          configuration: { purchasedBeds: 12 },
        },
      },
    };

    expect(getLudusGladiatorCapacity(save)).toBe(1);
  });

  it('reports available capacity from the current roster size', () => {
    const save = {
      ...withDormitoryCapacityImprovements(createTestSave(), 2),
      gladiators: [
        {
          id: 'gladiator-test',
          name: 'Aulus',
          age: 18,
          experience: 0,
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
