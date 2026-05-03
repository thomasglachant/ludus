import { describe, expect, it } from 'vitest';
import {
  getStaffAvatarAssetPath,
  getStaffVisualAssetPath,
  isStaffVisualIdForType,
  STAFF_VISUAL_IDS_BY_TYPE,
} from '../../game-data/staff-visuals';
import { GAME_BALANCE } from '../../game-data/balance';
import type { BuildingId, GameSave } from '../types';
import { createInitialSave } from '../saves/create-initial-save';
import {
  assignStaffToBuilding,
  calculateStaffMarketPrice,
  buyMarketStaff,
  createInitialStaffState,
  generateStaffMarketCandidates,
  sellStaff,
  synchronizeStaffAssignments,
  validateStaffAssignment,
  validateStaffMarketPurchase,
} from './staff-actions';

function createTestSave() {
  return createInitialSave({
    ludusName: 'Ludus Magnus',
    saveId: 'save-test',
    createdAt: '2026-04-25T12:00:00.000Z',
  });
}

function createStaffedTestSave() {
  const save = createTestSave();

  return synchronizeStaffAssignments({
    ...save,
    staff: {
      ...save.staff,
      members: [
        {
          id: 'staff-initial-trainer',
          name: 'Titus',
          type: 'trainer',
          visualId: 'trainer-01',
          weeklyWage: 35,
          assignedBuildingId: 'trainingGround',
          buildingExperience: { trainingGround: 10 },
        },
        {
          id: 'staff-initial-slave',
          name: 'Dama',
          type: 'slave',
          visualId: 'slave-01',
          weeklyWage: 0,
          assignedBuildingId: 'canteen',
          buildingExperience: { canteen: 8 },
        },
        {
          id: 'staff-initial-guard',
          name: 'Marcellus',
          type: 'guard',
          visualId: 'guard-01',
          weeklyWage: 25,
          assignedBuildingId: 'guardBarracks',
          buildingExperience: { guardBarracks: 6 },
        },
      ],
    },
  });
}

function withPurchasedBuilding(save: GameSave, buildingId: BuildingId): GameSave {
  return {
    ...save,
    buildings: {
      ...save.buildings,
      [buildingId]: {
        ...save.buildings[buildingId],
        isPurchased: true,
        level: Math.max(1, save.buildings[buildingId].level),
      },
    },
  };
}

function createSequenceRandom(values: number[]) {
  let index = 0;

  return () => values[index++] ?? 0;
}

describe('staff actions', () => {
  it('defines exactly five visual ids for each staff type', () => {
    expect(Object.keys(STAFF_VISUAL_IDS_BY_TYPE).sort()).toEqual(['guard', 'slave', 'trainer']);

    for (const [type, visualIds] of Object.entries(STAFF_VISUAL_IDS_BY_TYPE)) {
      expect(visualIds).toHaveLength(5);
      expect(new Set(visualIds)).toHaveLength(5);
      expect(visualIds.every((visualId) => visualId.startsWith(`${type}-`))).toBe(true);
      expect(
        visualIds.every((visualId) =>
          getStaffVisualAssetPath(visualId).startsWith('/assets/generated/staff/'),
        ),
      ).toBe(true);
      expect(
        visualIds.every((visualId) =>
          getStaffAvatarAssetPath(visualId).startsWith('/assets/generated/staff/avatars/'),
        ),
      ).toBe(true);
    }
  });

  it('starts without owned staff and seeds market candidates with persisted visual ids', () => {
    const staff = createInitialStaffState(1, 1, () => 0);

    expect(staff.members).toEqual([]);
    expect(staff.assignments).toEqual([]);
    expect(staff.marketCandidates.length).toBeGreaterThan(0);
    expect(
      staff.marketCandidates.every((candidate) =>
        isStaffVisualIdForType(candidate.type, candidate.visualId),
      ),
    ).toBe(true);
  });

  it('generates weekly staff candidates with typed wages and prices', () => {
    const candidates = generateStaffMarketCandidates(2, 3, () => 0);

    expect(candidates).toHaveLength(GAME_BALANCE.staffMarket.availableStaffCount);
    expect(candidates.filter((candidate) => candidate.type === 'slave')).toHaveLength(20);
    expect(candidates.filter((candidate) => candidate.type === 'guard')).toHaveLength(20);
    expect(candidates.filter((candidate) => candidate.type === 'trainer')).toHaveLength(20);
    expect(candidates[0]).toMatchObject({
      id: 'staff-market-2-3-slave-1',
      type: 'slave',
      visualId: 'slave-01',
      weeklyWage: 0,
    });
    expect(
      candidates.every((candidate) => candidate.price === calculateStaffMarketPrice(candidate)),
    ).toBe(true);
    expect(
      candidates.every((candidate) => isStaffVisualIdForType(candidate.type, candidate.visualId)),
    ).toBe(true);
  });

  it('randomly assigns generated staff visuals inside each candidate type category', () => {
    const candidates = generateStaffMarketCandidates(
      2,
      3,
      createSequenceRandom([0, 0, 0, 0, 0.99, 0, 0, 0, 0.4, 0, 0, 0, 0.2, 0, 0, 0, 0.8]),
    );

    expect(
      candidates.every((candidate) => isStaffVisualIdForType(candidate.type, candidate.visualId)),
    ).toBe(true);
    expect(candidates.slice(0, 20).every((candidate) => candidate.type === 'slave')).toBe(true);
    expect(candidates.slice(20, 40).every((candidate) => candidate.type === 'guard')).toBe(true);
    expect(candidates.slice(40, 60).every((candidate) => candidate.type === 'trainer')).toBe(true);
  });

  it('prices staff candidates from role, wage and generated experience', () => {
    const inexperiencedTrainer = {
      id: 'trainer-low',
      name: 'Titus',
      type: 'trainer' as const,
      visualId: 'trainer-01' as const,
      weeklyWage: GAME_BALANCE.staffMarket.weeklyWageByType.trainer,
      buildingExperience: { trainingGround: 2 },
    };
    const experiencedTrainer = {
      ...inexperiencedTrainer,
      id: 'trainer-high',
      buildingExperience: { trainingGround: 10 },
    };

    expect(calculateStaffMarketPrice(experiencedTrainer)).toBeGreaterThan(
      calculateStaffMarketPrice(inexperiencedTrainer),
    );
  });

  it('buys staff from the market', () => {
    const save = {
      ...createTestSave(),
      buildings: {
        ...createTestSave().buildings,
        domus: {
          ...createTestSave().buildings.domus,
          level: 2,
        },
      },
    };
    const candidate = save.staff.marketCandidates.find(
      (staffCandidate) => staffCandidate.type === 'guard',
    )!;
    const result = buyMarketStaff(save, candidate.id);

    expect(result.validation).toMatchObject({
      isAllowed: true,
      cost: candidate.price,
    });
    expect(result.save.staff.members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: candidate.id, visualId: candidate.visualId }),
      ]),
    );
    expect(result.save.staff.marketCandidates).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: candidate.id })]),
    );
    expect(result.save.ludus.treasury).toBe(save.ludus.treasury - candidate.price);
    expect(result.save.economy.ledgerEntries[0]).toMatchObject({
      amount: candidate.price,
      category: 'staff',
      kind: 'expense',
      labelKey: 'finance.ledger.staffPurchase',
    });
  });

  it('prevents buying staff when treasury is too low', () => {
    const save = {
      ...createTestSave(),
      ludus: {
        ...createTestSave().ludus,
        treasury: 10,
      },
    };
    const candidate = save.staff.marketCandidates.find(
      (staffCandidate) => staffCandidate.type === 'trainer',
    )!;
    const validation = validateStaffMarketPurchase(save, candidate.id);

    expect(validation).toMatchObject({
      isAllowed: false,
      reason: 'insufficientTreasury',
      cost: candidate.price,
    });
  });

  it('prevents buying staff when Domus staff capacity is full', () => {
    const save = createStaffedTestSave();
    const candidate = save.staff.marketCandidates.find(
      (staffCandidate) => staffCandidate.type === 'trainer',
    )!;
    const validation = validateStaffMarketPurchase(save, candidate.id);

    expect(validation).toMatchObject({
      isAllowed: false,
      reason: 'noAvailableStaffPlace',
      cost: candidate.price,
    });
  });

  it('sells staff and clears assignments', () => {
    const save = createStaffedTestSave();
    const result = sellStaff(save, 'staff-initial-guard');

    expect(result.validation).toMatchObject({ isAllowed: true });
    expect(result.save.staff.members).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'staff-initial-guard' })]),
    );
    expect(result.save.staff.assignments).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          buildingId: 'guardBarracks',
          staffIds: expect.arrayContaining(['staff-initial-guard']),
        }),
      ]),
    );
    expect(result.save.buildings.guardBarracks.staffAssignmentIds).not.toContain(
      'staff-initial-guard',
    );
    expect(result.save.ludus.treasury).toBeGreaterThan(save.ludus.treasury);
    expect(result.save.economy.ledgerEntries[0]).toMatchObject({
      category: 'staff',
      kind: 'income',
      labelKey: 'finance.ledger.staffSale',
    });
  });

  it('allows slaves to work in any building', () => {
    const result = assignStaffToBuilding(
      withPurchasedBuilding(createStaffedTestSave(), 'farm'),
      'staff-initial-slave',
      'farm',
    );

    expect(result.validation).toMatchObject({ isAllowed: true });
    expect(
      result.save.staff.members.find((member) => member.id === 'staff-initial-slave'),
    ).toMatchObject({
      assignedBuildingId: 'farm',
    });
    expect(result.save.buildings.farm.staffAssignmentIds).toContain('staff-initial-slave');
    expect(result.save.buildings.canteen.staffAssignmentIds).not.toContain('staff-initial-slave');
    expect(result.save.buildings.farm.efficiency).toBe(100);
    expect(result.save.buildings.canteen.efficiency).toBe(25);
  });

  it('prevents assigning staff to unpurchased buildings', () => {
    const result = assignStaffToBuilding(createStaffedTestSave(), 'staff-initial-slave', 'farm');

    expect(result.validation).toMatchObject({
      isAllowed: false,
      reason: 'notPurchased',
    });
  });

  it('prevents assigning staff above the building requirement', () => {
    const save = createStaffedTestSave();
    const saveWithExtraSlave: GameSave = {
      ...save,
      staff: {
        ...save.staff,
        members: [
          ...save.staff.members,
          {
            id: 'staff-extra-slave',
            name: 'Syrus',
            type: 'slave',
            visualId: 'slave-01',
            weeklyWage: 0,
            buildingExperience: {},
          },
        ],
      },
    };
    const validation = validateStaffAssignment(saveWithExtraSlave, 'staff-extra-slave', 'canteen');

    expect(validation).toMatchObject({
      isAllowed: false,
      reason: 'buildingFullyStaffed',
    });
  });

  it('unassigns staff from a building', () => {
    const result = assignStaffToBuilding(createStaffedTestSave(), 'staff-initial-slave');

    expect(result.validation).toMatchObject({ isAllowed: true });
    expect(
      result.save.staff.members.find((member) => member.id === 'staff-initial-slave'),
    ).not.toHaveProperty('assignedBuildingId');
    expect(result.save.buildings.canteen.staffAssignmentIds).not.toContain('staff-initial-slave');
    expect(result.save.buildings.canteen.efficiency).toBe(25);
  });

  it('restricts guards to the barracks', () => {
    const result = assignStaffToBuilding(
      createStaffedTestSave(),
      'staff-initial-guard',
      'trainingGround',
    );

    expect(result.validation).toMatchObject({
      isAllowed: false,
      reason: 'invalidStaffType',
    });
  });

  it('restricts trainers to the training ground', () => {
    const invalidResult = assignStaffToBuilding(
      createStaffedTestSave(),
      'staff-initial-trainer',
      'canteen',
    );
    const validResult = assignStaffToBuilding(
      createStaffedTestSave(),
      'staff-initial-trainer',
      'trainingGround',
    );

    expect(invalidResult.validation).toMatchObject({
      isAllowed: false,
      reason: 'invalidStaffType',
    });
    expect(validResult.validation).toMatchObject({ isAllowed: true });
  });
});
