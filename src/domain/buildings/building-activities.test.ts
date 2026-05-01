import { describe, expect, it } from 'vitest';
import { createDefaultDailyPlan } from '../weekly-simulation/weekly-simulation-actions';
import { createInitialSave } from '../saves/create-initial-save';
import {
  calculateBuildingActivityImpact,
  getSelectedBuildingActivities,
  getUnlockedBuildingActivities,
  isBuildingActivityUnlocked,
} from './building-activities';

function createTestSave() {
  return createInitialSave({
    ludusName: 'Ludus Magnus',
    saveId: 'save-test',
    createdAt: '2026-04-25T12:00:00.000Z',
  });
}

describe('building activities', () => {
  it('detects unlocked activities from purchased building skills', () => {
    const save = {
      ...createTestSave(),
      buildings: {
        ...createTestSave().buildings,
        farm: {
          ...createTestSave().buildings.farm,
          isPurchased: true,
          level: 1,
          efficiency: 100,
          purchasedSkillIds: ['farm.market-surplus'],
        },
      },
    };

    expect(isBuildingActivityUnlocked(save, 'farm.marketSurplus')).toBe(true);
    expect(getUnlockedBuildingActivities(save, 'farm')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'farm.marketSurplus',
          activity: 'production',
        }),
      ]),
    );
  });

  it('scales activity impact by planned points and building efficiency', () => {
    const save = {
      ...createTestSave(),
      buildings: {
        ...createTestSave().buildings,
        farm: {
          ...createTestSave().buildings.farm,
          isPurchased: true,
          level: 1,
          efficiency: 50,
          purchasedSkillIds: ['farm.market-surplus'],
        },
      },
    };
    const plan = createDefaultDailyPlan('monday');
    plan.laborPoints.production = 4;
    plan.buildingActivitySelections.production = 'farm.marketSurplus';

    expect(calculateBuildingActivityImpact(save, plan).treasuryDelta).toBe(10);
  });

  it('ignores unlocked activities until they are selected in the daily plan', () => {
    const save = {
      ...createTestSave(),
      buildings: {
        ...createTestSave().buildings,
        farm: {
          ...createTestSave().buildings.farm,
          isPurchased: true,
          level: 1,
          efficiency: 100,
          purchasedSkillIds: ['farm.market-surplus'],
        },
      },
    };
    const plan = createDefaultDailyPlan('monday');
    plan.laborPoints.production = 4;

    expect(getSelectedBuildingActivities(save, plan)).toEqual([]);
    expect(calculateBuildingActivityImpact(save, plan).treasuryDelta).toBe(0);
  });
});
