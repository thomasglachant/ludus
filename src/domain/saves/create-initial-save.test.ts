import { describe, expect, it } from 'vitest';
import { BUILDING_DEFINITIONS, BUILDING_IDS } from '../../game-data/buildings';
import { INITIAL_TREASURY } from '../../game-data/economy';
import { getLudusGladiatorCapacity } from '../ludus/capacity';
import { CURRENT_SCHEMA_VERSION, createInitialSave } from './create-initial-save';

describe('createInitialSave', () => {
  it('creates the first playable save foundation', () => {
    const save = createInitialSave({
      ludusName: 'Ludus Magnus',
      saveId: 'save-test',
      createdAt: '2026-04-25T12:00:00.000Z',
    });

    expect(save.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(save.gameId).toBe('save-test');
    expect(save.ludus.treasury).toBe(INITIAL_TREASURY);
    expect(save.time).toMatchObject({
      year: 1,
      week: 1,
      dayOfWeek: 'monday',
      phase: 'planning',
    });
    for (const buildingId of BUILDING_IDS) {
      expect(save.buildings[buildingId]).toMatchObject({
        id: buildingId,
        isPurchased: BUILDING_DEFINITIONS[buildingId].startsPurchased,
        level: BUILDING_DEFINITIONS[buildingId].startsAtLevel,
      });
    }
    expect(save.ludus).toMatchObject({
      security: 50,
      happiness: 65,
      rebellion: 0,
      gameStatus: 'active',
    });
    expect(save.economy.ledgerEntries).toEqual([]);
    expect(save.economy.currentWeekSummary.net).toBe(0);
    expect(save.economy.weeklyProjection.net).not.toBe(0);
    expect(save.staff.members.length).toBeGreaterThan(0);
    expect(save.staff.marketCandidates.length).toBeGreaterThan(0);
    expect(save.buildings.trainingGround.staffAssignmentIds).toContain('staff-initial-trainer');
    expect(save.buildings.canteen.staffAssignmentIds).toContain('staff-initial-slave');
    expect(save.buildings.guardBarracks.staffAssignmentIds).toContain('staff-initial-guard');
    expect(save.buildings.trainingGround.efficiency).toBe(110);
    expect(save.buildings.canteen.efficiency).toBe(108);
    expect(save.buildings.guardBarracks.efficiency).toBe(106);
    expect(save.planning.days.monday.gladiatorTimePoints.strengthTraining).toBe(0);
    expect(save.buildings.canteen.configuration).toBeUndefined();
    expect(save.buildings.canteen.selectedPolicyId).toBeUndefined();
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
    expect(save.map).toMatchObject({
      schemaVersion: 6,
      gridId: 'default-ludus-grid',
    });
    expect(save.map.placements.some((placement) => placement.definitionId === 'domus')).toBe(true);
    expect(getLudusGladiatorCapacity(save)).toBe(1);
    expect(save.gladiators).toEqual([]);
    expect(save.market.availableGladiators).toHaveLength(5);
  });
});
