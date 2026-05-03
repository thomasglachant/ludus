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
        canteen: {
          ...createTestSave().buildings.canteen,
          isPurchased: true,
          level: 1,
          efficiency: 100,
          purchasedSkillIds: ['canteen.supply-contracts'],
        },
      },
    };

    expect(isBuildingActivityUnlocked(save, 'canteen.supplyContracts')).toBe(true);
    expect(getUnlockedBuildingActivities(save, 'canteen')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'canteen.supplyContracts',
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
        canteen: {
          ...createTestSave().buildings.canteen,
          isPurchased: true,
          level: 1,
          efficiency: 50,
          purchasedSkillIds: ['canteen.supply-contracts'],
        },
      },
    };
    const plan = createDefaultDailyPlan('monday');
    plan.laborPoints.production = 4;
    plan.buildingActivitySelections.production = 'canteen.supplyContracts';

    expect(calculateBuildingActivityImpact(save, plan).treasuryDelta).toBe(10);
  });

  it('ignores unlocked activities until they are selected in the daily plan', () => {
    const save = {
      ...createTestSave(),
      buildings: {
        ...createTestSave().buildings,
        canteen: {
          ...createTestSave().buildings.canteen,
          isPurchased: true,
          level: 1,
          efficiency: 100,
          purchasedSkillIds: ['canteen.supply-contracts'],
        },
      },
    };
    const plan = createDefaultDailyPlan('monday');
    plan.laborPoints.production = 4;

    expect(getSelectedBuildingActivities(save, plan)).toEqual([]);
    expect(calculateBuildingActivityImpact(save, plan).treasuryDelta).toBe(0);
  });
});
