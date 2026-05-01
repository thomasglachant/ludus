import { describe, expect, it } from 'vitest';
import { BUILDING_SKILLS } from '../../game-data/building-skills';
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
      { type: 'increaseGlory', value: 0.5, target: 'ludus' },
    ]);
    expect(canteenTierTwoEffects).toEqual([
      { type: 'increaseHappiness', value: 1.5, target: 'ludus' },
      { type: 'increaseHealth', value: 1.5, target: 'plannedGladiators' },
      { type: 'increaseIncome', value: 1, target: 'ludus' },
      { type: 'increaseProduction', value: 1, target: 'ludus' },
      { type: 'increaseMorale', value: 1.5, target: 'plannedGladiators' },
    ]);
    expect(BUILDING_SKILLS.find((skill) => skill.id === 'domus.steward-desk')).toMatchObject({
      requiredSkillIds: ['domus.ledger-room', 'domus.contract-shelf', 'domus.staff-registry'],
    });
    expect(BUILDING_SKILLS.find((skill) => skill.id === 'domus.profit-forecasting')).toMatchObject({
      unlockedActivities: ['domus.profitForecasting'],
    });
    expect(
      BUILDING_SKILLS.find((skill) => skill.id === 'domus.championship-booking'),
    ).toMatchObject({
      unlockedActivities: ['domus.championshipBooking'],
    });
    expect(
      BUILDING_SKILLS.find((skill) => skill.id === 'trainingGround.noble-training'),
    ).toMatchObject({
      unlockedActivities: ['trainingGround.nobleTraining'],
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
    const activitySkill = BUILDING_SKILLS.find(
      (skill) => skill.id === 'trainingGround.noble-training',
    );

    expect(activitySkill).toMatchObject({
      buildingId: 'trainingGround',
      unlockedActivities: ['trainingGround.nobleTraining'],
    });
    expect(isBuildingActivityUnlocked(createTestSave(), 'trainingGround.nobleTraining')).toBe(
      false,
    );

    const save = {
      ...createTestSave(),
      buildings: {
        ...createTestSave().buildings,
        trainingGround: {
          ...createTestSave().buildings.trainingGround,
          purchasedSkillIds: ['trainingGround.noble-training'],
        },
      },
    };

    expect(isBuildingActivityUnlocked(save, 'trainingGround.nobleTraining')).toBe(true);
    expect(getUnlockedBuildingActivities(save, 'trainingGround')).toEqual([
      expect.objectContaining({
        id: 'trainingGround.nobleTraining',
        requiredSkillId: 'trainingGround.noble-training',
        activity: 'contracts',
      }),
    ]);
    const impact = calculateBuildingActivityImpact(save, {
      dayOfWeek: 'monday',
      gladiatorTimePoints: {
        training: 0,
        meals: 0,
        sleep: 0,
        leisure: 0,
        care: 0,
        contracts: 0,
        production: 0,
        security: 0,
        maintenance: 0,
        events: 0,
      },
      laborPoints: {
        training: 0,
        meals: 0,
        sleep: 0,
        leisure: 0,
        care: 0,
        contracts: 0,
        production: 0,
        security: 0,
        maintenance: 0,
        events: 0,
      },
      adminPoints: {
        training: 0,
        meals: 0,
        sleep: 0,
        leisure: 0,
        care: 0,
        contracts: 2,
        production: 0,
        security: 0,
        maintenance: 0,
        events: 0,
      },
      buildingActivitySelections: {
        contracts: 'trainingGround.nobleTraining',
      },
    });

    expect(impact.treasuryDelta).toBeCloseTo(17.6);
    expect(impact.reputationDelta).toBeCloseTo(0.22);
  });
});
