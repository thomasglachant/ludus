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
      { type: 'increaseTrainingExperience', value: 1, target: 'plannedGladiators' },
      { type: 'increaseTrainingExperience', value: 1, target: 'plannedGladiators' },
      { type: 'increaseTrainingExperience', value: 1, target: 'plannedGladiators' },
      { type: 'reduceInjuryRisk', value: 0.5, target: 'allGladiators' },
      { type: 'increaseReputation', value: 0.5, target: 'ludus' },
    ]);
    expect(canteenTierTwoEffects).toEqual([
      { type: 'increaseHappiness', value: 1.5, target: 'ludus' },
      { type: 'increaseHappiness', value: 1.5, target: 'ludus' },
      { type: 'increaseIncome', value: 1, target: 'ludus' },
      { type: 'increaseProduction', value: 1, target: 'ludus' },
      { type: 'increaseHappiness', value: 1.5, target: 'ludus' },
    ]);
    expect(BUILDING_SKILLS.find((skill) => skill.id === 'domus.steward-desk')).toMatchObject({
      requiredSkillIds: ['domus.ledger-room', 'domus.contract-shelf', 'domus.estate-registry'],
    });
    expect(BUILDING_SKILLS.find((skill) => skill.id === 'canteen.supply-contracts')).toMatchObject({
      unlockedActivities: ['canteen.supplyContracts'],
    });
    expect(BUILDING_SKILLS.find((skill) => skill.id === 'dormitory.night-lamps')).toMatchObject({
      descriptionKey: 'buildingSkills.dormitory.night-lamps.description',
      name: 'Safe Lamps',
    });
    expect(BUILDING_SKILLS.find((skill) => skill.id === 'dormitory.safe-lamps')).toBeUndefined();
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

  it('sums active effects directly from purchased building upgrades', () => {
    const save = purchaseBuildingSkill(createTestSave(), 'domus', 'domus.ledger-room').save;

    expect(
      sumActiveBuildingEffectValues(save, {
        target: 'ludus',
        type: 'reduceExpense',
      }),
    ).toBe(1);
  });

  it('makes purchased skill activities detectable and applies their planned impact', () => {
    const activitySkill = BUILDING_SKILLS.find((skill) => skill.id === 'canteen.supply-contracts');

    expect(activitySkill).toMatchObject({
      buildingId: 'canteen',
      unlockedActivities: ['canteen.supplyContracts'],
    });
    expect(isBuildingActivityUnlocked(createTestSave(), 'canteen.supplyContracts')).toBe(false);

    const save = {
      ...createTestSave(),
      buildings: {
        ...createTestSave().buildings,
        canteen: {
          ...createTestSave().buildings.canteen,
          isPurchased: true,
          purchasedSkillIds: ['canteen.supply-contracts'],
        },
      },
    };

    expect(isBuildingActivityUnlocked(save, 'canteen.supplyContracts')).toBe(true);
    expect(getUnlockedBuildingActivities(save, 'canteen')).toEqual([
      expect.objectContaining({
        id: 'canteen.supplyContracts',
        requiredSkillId: 'canteen.supply-contracts',
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
        production: 'canteen.supplyContracts',
      },
    });

    expect(impact.treasuryDelta).toBeCloseTo(10);
    expect(impact.reputationDelta).toBeCloseTo(0);
  });
});
