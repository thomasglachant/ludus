import { describe, expect, it } from 'vitest';
import { BUILDING_IDS } from '../../game-data/buildings';
import { INITIAL_TREASURY } from '../../game-data/economy';
import { getLudusGladiatorCapacity } from '../ludus/capacity';
import { createInitialSave } from './create-initial-save';

describe('createInitialSave', () => {
  it('creates the first playable save foundation', () => {
    const save = createInitialSave({
      ownerName: 'Marcus',
      ludusName: 'Ludus Magnus',
      saveId: 'save-test',
      createdAt: '2026-04-25T12:00:00.000Z',
    });

    expect(save.schemaVersion).toBe(2);
    expect(save.ludus.treasury).toBe(INITIAL_TREASURY);
    expect(save.time).toMatchObject({
      year: 1,
      week: 1,
      dayOfWeek: 'monday',
      hour: 8,
      minute: 0,
      speed: 1,
    });
    for (const buildingId of BUILDING_IDS) {
      expect(save.buildings[buildingId]).toMatchObject({
        id: buildingId,
        isPurchased: true,
        level: 1,
      });
    }
    expect(save.buildings.canteen).toMatchObject({
      configuration: { mealPlanId: 'balancedMeals' },
      selectedPolicyId: 'balancedMeals',
    });
    expect(save.buildings.dormitory.configuration).toBeUndefined();
    expect(save.buildings.trainingGround).toMatchObject({
      configuration: { defaultDoctrineId: 'balancedTraining' },
      selectedPolicyId: 'balancedTraining',
    });
    expect(save.buildings.pleasureHall).toMatchObject({
      configuration: { entertainmentPlanId: 'quietEvenings' },
      selectedPolicyId: 'quietEvenings',
    });
    expect(save.buildings.infirmary).toMatchObject({
      configuration: { carePolicyId: 'basicCare' },
      selectedPolicyId: 'basicCare',
    });
    expect(getLudusGladiatorCapacity(save)).toBe(1);
    expect(save.gladiators).toEqual([]);
    expect(save.market.availableGladiators).toHaveLength(5);
  });
});
