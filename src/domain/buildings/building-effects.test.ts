import { describe, expect, it } from 'vitest';
import { BUILDING_SKILLS } from '../../game-data/building-skills';
import { createDefaultDailyPlan } from '../planning/planning-actions';
import { createInitialSave } from '../saves/create-initial-save';
import { purchaseBuildingSkill } from './building-actions';
import {
  calculateBuildingActivityImpact,
  getUnlockedBuildingActivities,
  isBuildingActivityUnlocked,
} from './building-activities';
import { getActiveBuildingEffects, sumActiveBuildingEffectValues } from './building-effects';

function createTestSave() {
  return createInitialSave({
    ludusName: 'Ludus Magnus',
    saveId: 'save-test',
    createdAt: '2026-04-25T12:00:00.000Z',
  });
}

describe('building effects', () => {
  it('generates varied building skill effects while preserving ids and activity unlocks', () => {
    const trainingGroundTierOneEffects = BUILDING_SKILLS.filter(
      (skill) => skill.buildingId === 'trainingGround' && skill.tier === 1,
    ).map((skill) => skill.effects[0]);
    const canteenTierTwoEffects = BUILDING_SKILLS.filter(
      (skill) => skill.buildingId === 'canteen' && skill.tier === 2,
    ).map((skill) => skill.effects[0]);

    expect(trainingGroundTierOneEffects).toEqual([
      { type: 'increaseStrength', value: 1, target: 'plannedGladiators' },
      { type: 'increaseAgility', value: 1, target: 'plannedGladiators' },
      { type: 'increaseDefense', value: 1, target: 'plannedGladiators' },
      { type: 'reduceInjuryRisk', value: 0.5, target: 'allGladiators' },
      { type: 'increaseReputation', value: 0.5, target: 'ludus' },
    ]);
    expect(canteenTierTwoEffects).toEqual([
      { type: 'increaseHappiness', value: 1.5, target: 'ludus' },
      { type: 'increaseLife', value: 1.5, target: 'plannedGladiators' },
      { type: 'increaseIncome', value: 1, target: 'ludus' },
      { type: 'increaseProduction', value: 1, target: 'ludus' },
      { type: 'increaseHappiness', value: 1.5, target: 'ludus' },
    ]);
    expect(BUILDING_SKILLS.find((skill) => skill.id === 'domus.steward-desk')).toMatchObject({
      requiredSkillIds: ['domus.ledger-room', 'domus.contract-shelf', 'domus.staff-registry'],
    });
    expect(BUILDING_SKILLS.find((skill) => skill.id === 'farm.market-surplus')).toMatchObject({
      unlockedActivities: ['farm.marketSurplus'],
    });
  });

  it('includes purchased building skill effects in active effects', () => {
    const save = purchaseBuildingSkill(createTestSave(), 'domus', 'domus.ledger-room').save;

    expect(getActiveBuildingEffects(save, 'domus')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'reduceExpense',
          value: 1,
          target: 'ludus',
        }),
      ]),
    );
  });

  it('can scale active effects by current building efficiency', () => {
    const skilledSave = purchaseBuildingSkill(createTestSave(), 'domus', 'domus.ledger-room').save;
    const save = {
      ...skilledSave,
      buildings: {
        ...skilledSave.buildings,
        domus: {
          ...skilledSave.buildings.domus,
          efficiency: 50,
        },
      },
    };

    expect(
      sumActiveBuildingEffectValues(save, {
        target: 'ludus',
        type: 'reduceExpense',
      }),
    ).toBe(0.5);
    expect(
      sumActiveBuildingEffectValues(
        save,
        {
          target: 'ludus',
          type: 'reduceExpense',
        },
        { scaleByEfficiency: false },
      ),
    ).toBe(1);
  });

  it('makes purchased skill activities detectable and applies their planned impact', () => {
    const activitySkill = BUILDING_SKILLS.find((skill) => skill.id === 'farm.market-surplus');

    expect(activitySkill).toMatchObject({
      buildingId: 'farm',
      unlockedActivities: ['farm.marketSurplus'],
    });
    expect(isBuildingActivityUnlocked(createTestSave(), 'farm.marketSurplus')).toBe(false);

    const save = {
      ...createTestSave(),
      buildings: {
        ...createTestSave().buildings,
        farm: {
          ...createTestSave().buildings.farm,
          efficiency: 100,
          isPurchased: true,
          purchasedSkillIds: ['farm.market-surplus'],
        },
      },
    };

    expect(isBuildingActivityUnlocked(save, 'farm.marketSurplus')).toBe(true);
    expect(getUnlockedBuildingActivities(save, 'farm')).toEqual([
      expect.objectContaining({
        id: 'farm.marketSurplus',
        requiredSkillId: 'farm.market-surplus',
        activity: 'production',
      }),
    ]);
    const impact = calculateBuildingActivityImpact(save, {
      ...createDefaultDailyPlan('monday'),
      laborPoints: {
        ...createDefaultDailyPlan('monday').laborPoints,
        production: 2,
      },
      buildingActivitySelections: {
        production: 'farm.marketSurplus',
      },
    });

    expect(impact.treasuryDelta).toBeCloseTo(10);
    expect(impact.reputationDelta).toBeCloseTo(0);
  });
});
