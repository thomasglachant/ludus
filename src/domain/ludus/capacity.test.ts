import { describe, expect, it } from 'vitest';
import { createInitialSave } from '../saves/create-initial-save';
import type { GameSave } from '../saves/types';
import {
  getAvailableLudusGladiatorPlaces,
  getAvailableLudusStaffPlaces,
  getLudusGladiatorCapacity,
  getLudusStaffCapacity,
} from './capacity';

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

  it('uses Domus level for staff capacity', () => {
    expect(getLudusStaffCapacity(createTestSave())).toBe(3);
    expect(getLudusStaffCapacity(withDomusLevel(createTestSave(), 4))).toBe(12);
    expect(getLudusStaffCapacity(withDomusLevel(createTestSave(), 8))).toBe(18);
  });

  it('reports available staff places from the current staff size', () => {
    const save = {
      ...withDomusLevel(createTestSave(), 2),
      staff: {
        ...createTestSave().staff,
        members: [
          {
            id: 'staff-test-slave',
            name: 'Dama',
            type: 'slave' as const,
            visualId: 'slave-01' as const,
            weeklyWage: 0,
            buildingExperience: {},
          },
          {
            id: 'staff-test-guard',
            name: 'Marcellus',
            type: 'guard' as const,
            visualId: 'guard-01' as const,
            weeklyWage: 25,
            buildingExperience: {},
          },
          {
            id: 'staff-test-trainer',
            name: 'Titus',
            type: 'trainer' as const,
            visualId: 'trainer-01' as const,
            weeklyWage: 35,
            buildingExperience: {},
          },
        ],
      },
    };

    expect(getAvailableLudusStaffPlaces(save)).toBe(3);
  });
});
