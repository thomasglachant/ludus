import { describe, expect, it } from 'vitest';
import { GAME_BALANCE } from '../../game-data/balance';
import { createInitialSave } from '../saves/create-initial-save';
import { getHourlyBuildingEffects } from './building-effects';
import type { GameSave } from '../types';

function createTestSave(): GameSave {
  return createInitialSave({
    ludusName: 'Ludus Magnus',
    saveId: 'save-test',
    createdAt: '2026-04-25T12:00:00.000Z',
  });
}

describe('building effects', () => {
  it('uses the highest defined level effects for overleveled demo buildings', () => {
    const save: GameSave = {
      ...createTestSave(),
      buildings: {
        ...createTestSave().buildings,
        dormitory: {
          ...createTestSave().buildings.dormitory,
          isPurchased: true,
          level: 6,
        },
        infirmary: {
          ...createTestSave().buildings.infirmary,
          isPurchased: true,
          level: 6,
        },
      },
    };

    expect(getHourlyBuildingEffects(save, 'dormitory')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'increaseEnergy',
          value: GAME_BALANCE.buildings.levelEffects.dormitory[2].energyPerHour,
        }),
      ]),
    );
    expect(getHourlyBuildingEffects(save, 'infirmary')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'increaseHealth',
          value: GAME_BALANCE.buildings.levelEffects.infirmary[2].healthPerHour,
        }),
      ]),
    );
  });
});
