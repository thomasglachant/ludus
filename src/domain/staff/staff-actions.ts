import { GAME_BALANCE } from '../../game-data/balance';
import { getStaffVisualIdsForType } from '../../game-data/staff-visuals';
import {
  canStaffWorkInBuilding,
  getRequiredStaffCount,
  updateBuildingEfficiencies,
} from '../buildings/building-staffing';
import type { BuildingId } from '../buildings/types';
import {
  addLedgerEntry,
  createLedgerEntry,
  updateCurrentWeekSummary,
} from '../economy/economy-actions';
import { getAvailableLudusStaffPlaces } from '../ludus/capacity';
import type { GameSave } from '../saves/types';
import type {
  StaffMarketCandidate,
  StaffMember,
  StaffState,
  StaffType,
  StaffVisualId,
} from './types';

export type StaffActionFailureReason =
  | 'staffCandidateNotFound'
  | 'staffNotFound'
  | 'buildingNotFound'
  | 'insufficientTreasury'
  | 'invalidStaffType'
  | 'noAvailableStaffPlace'
  | 'notPurchased'
  | 'buildingDoesNotUseStaff'
  | 'buildingFullyStaffed';

export interface StaffActionValidation {
  isAllowed: boolean;
  cost?: number;
  saleValue?: number;
  reason?: StaffActionFailureReason;
}

export interface StaffActionResult {
  save: GameSave;
  validation: StaffActionValidation;
}

type RandomSource = () => number;

const staffNamesByType: Record<StaffType, readonly string[]> = {
  slave: ['Syrus', 'Nysa', 'Dama', 'Felix', 'Livia', 'Maro'],
  guard: ['Varro', 'Marcellus', 'Cassius', 'Nerva', 'Drusus', 'Tarquinius'],
  trainer: ['Brennus', 'Titus', 'Gannicus', 'Oenomaus', 'Priscus', 'Verus'],
};

const experienceBuildingByType: Record<StaffType, readonly BuildingId[]> = {
  slave: ['canteen', 'dormitory', 'farm', 'forgeWorkshop'],
  guard: ['guardBarracks'],
  trainer: ['trainingGround'],
};

const staffMarketTypes: StaffType[] = ['slave', 'guard', 'trainer'];

function pickIndex(length: number, random: RandomSource) {
  return Math.min(length - 1, Math.floor(random() * length));
}

function createStaffVisualId(type: StaffType, random: RandomSource): StaffVisualId {
  const visualIds = getStaffVisualIdsForType(type);

  return visualIds[pickIndex(visualIds.length, random)];
}

function createStaffExperience(type: StaffType, random: RandomSource) {
  const typeBuildings = experienceBuildingByType[type];
  const buildingId = typeBuildings[pickIndex(typeBuildings.length, random)];
  const range =
    GAME_BALANCE.staffMarket.maxGeneratedExperience -
    GAME_BALANCE.staffMarket.minGeneratedExperience +
    1;
  const experience = GAME_BALANCE.staffMarket.minGeneratedExperience + pickIndex(range, random);

  return {
    [buildingId]: experience,
  };
}

export function calculateStaffMarketPrice(staffMember: StaffMember) {
  const experienceTotal = Object.values(staffMember.buildingExperience).reduce(
    (total, value) => total + (value ?? 0),
    0,
  );

  return Math.round(
    GAME_BALANCE.staffMarket.basePriceByType[staffMember.type] +
      experienceTotal * GAME_BALANCE.staffMarket.experiencePriceMultiplier +
      staffMember.weeklyWage * GAME_BALANCE.staffMarket.weeklyWagePriceMultiplier,
  );
}

export function generateStaffMarketCandidates(
  year: number,
  week: number,
  random: RandomSource = Math.random,
): StaffMarketCandidate[] {
  return staffMarketTypes.flatMap((type) =>
    Array.from({ length: GAME_BALANCE.staffMarket.candidatesPerType }, (_, index) => {
      const names = staffNamesByType[type];
      const name = names[pickIndex(names.length, random)];
      const experience = createStaffExperience(type, random);
      const candidate: StaffMember = {
        id: `staff-market-${year}-${week}-${type}-${index + 1}`,
        name,
        type,
        visualId: createStaffVisualId(type, random),
        weeklyWage: GAME_BALANCE.staffMarket.weeklyWageByType[type],
        buildingExperience: experience,
      };

      return {
        ...candidate,
        price: calculateStaffMarketPrice(candidate),
      };
    }),
  );
}

export function createInitialStaffState(
  year = GAME_BALANCE.progression.startingYear,
  week = GAME_BALANCE.progression.startingWeek,
  random: RandomSource = Math.random,
): StaffState {
  return {
    members: [],
    assignments: [],
    marketCandidates: generateStaffMarketCandidates(year, week, random),
  };
}

function getAssignedStaffCount(save: GameSave, buildingId: BuildingId, excludeStaffId?: string) {
  return save.staff.members.filter(
    (member) => member.assignedBuildingId === buildingId && member.id !== excludeStaffId,
  ).length;
}

export function createStaffAssignments(members: StaffMember[]) {
  const assignmentsByBuilding = new Map<BuildingId, string[]>();

  for (const member of members) {
    if (!member.assignedBuildingId) {
      continue;
    }

    assignmentsByBuilding.set(member.assignedBuildingId, [
      ...(assignmentsByBuilding.get(member.assignedBuildingId) ?? []),
      member.id,
    ]);
  }

  return Array.from(assignmentsByBuilding.entries()).map(([assignedBuildingId, staffIds]) => ({
    buildingId: assignedBuildingId,
    staffIds,
  }));
}

export function synchronizeStaffAssignments(
  save: GameSave,
  members = save.staff.members,
): GameSave {
  const assignments = createStaffAssignments(members);
  const assignmentByBuilding = new Map(
    assignments.map((assignment) => [assignment.buildingId, assignment.staffIds]),
  );

  return {
    ...save,
    buildings: Object.fromEntries(
      Object.entries(save.buildings).map(([buildingId, building]) => [
        buildingId,
        {
          ...building,
          staffAssignmentIds: assignmentByBuilding.get(building.id) ?? [],
        },
      ]),
    ) as GameSave['buildings'],
    staff: {
      ...save.staff,
      members,
      assignments,
    },
  };
}

export function calculateStaffSaleValue(staffMember: StaffMember) {
  const experienceValue = Object.values(staffMember.buildingExperience).reduce(
    (total, experience) => total + (experience ?? 0),
    0,
  );
  const typeBaseValue: Record<StaffType, number> = {
    slave: 45,
    guard: 75,
    trainer: 110,
  };

  return Math.round(typeBaseValue[staffMember.type] + staffMember.weeklyWage + experienceValue * 2);
}

export function validateStaffMarketPurchase(
  save: GameSave,
  candidateId: string,
): StaffActionValidation {
  const candidate = save.staff.marketCandidates.find(
    (staffCandidate) => staffCandidate.id === candidateId,
  );

  if (!candidate) {
    return {
      isAllowed: false,
      cost: 0,
      reason: 'staffCandidateNotFound',
    };
  }

  if (save.ludus.treasury < candidate.price) {
    return {
      isAllowed: false,
      cost: candidate.price,
      reason: 'insufficientTreasury',
    };
  }

  if (getAvailableLudusStaffPlaces(save) <= 0) {
    return {
      isAllowed: false,
      cost: candidate.price,
      reason: 'noAvailableStaffPlace',
    };
  }

  return {
    isAllowed: true,
    cost: candidate.price,
  };
}

export function buyMarketStaff(save: GameSave, candidateId: string): StaffActionResult {
  const validation = validateStaffMarketPurchase(save, candidateId);

  if (!validation.isAllowed) {
    return { save, validation };
  }

  const candidate = save.staff.marketCandidates.find(
    (staffCandidate) => staffCandidate.id === candidateId,
  );

  if (!candidate) {
    return {
      save,
      validation: {
        isAllowed: false,
        cost: 0,
        reason: 'staffCandidateNotFound',
      },
    };
  }

  const staffMember: StaffMember = {
    id: candidate.id,
    name: candidate.name,
    type: candidate.type,
    visualId: candidate.visualId,
    weeklyWage: candidate.weeklyWage,
    buildingExperience: candidate.buildingExperience,
  };

  const hiredSave = addLedgerEntry(
    {
      ...save,
      staff: {
        ...save.staff,
        members: [...save.staff.members, staffMember],
        marketCandidates: save.staff.marketCandidates.filter(
          (staffCandidate) => staffCandidate.id !== candidateId,
        ),
      },
    },
    createLedgerEntry(save, {
      kind: 'expense',
      category: 'staff',
      amount: candidate.price,
      labelKey: 'finance.ledger.staffPurchase',
      relatedId: candidate.id,
    }),
  );

  return {
    validation,
    save: updateBuildingEfficiencies(updateCurrentWeekSummary(hiredSave)),
  };
}

export function validateStaffSale(save: GameSave, staffId: string): StaffActionValidation {
  const staffMember = save.staff.members.find((member) => member.id === staffId);

  if (!staffMember) {
    return {
      isAllowed: false,
      saleValue: 0,
      reason: 'staffNotFound',
    };
  }

  return {
    isAllowed: true,
    saleValue: calculateStaffSaleValue(staffMember),
  };
}

export function sellStaff(save: GameSave, staffId: string): StaffActionResult {
  const validation = validateStaffSale(save, staffId);

  if (!validation.isAllowed) {
    return { save, validation };
  }

  const members = save.staff.members.filter((member) => member.id !== staffId);

  const unassignedSave = synchronizeStaffAssignments({
    ...save,
    staff: {
      ...save.staff,
      members,
    },
  });
  const soldSave = addLedgerEntry(
    unassignedSave,
    createLedgerEntry(save, {
      kind: 'income',
      category: 'staff',
      amount: validation.saleValue ?? 0,
      labelKey: 'finance.ledger.staffSale',
      relatedId: staffId,
    }),
  );

  return {
    validation,
    save: updateBuildingEfficiencies(updateCurrentWeekSummary(soldSave)),
  };
}

export function validateStaffAssignment(
  save: GameSave,
  staffId: string,
  buildingId?: BuildingId,
): StaffActionValidation {
  const staffMember = save.staff.members.find((member) => member.id === staffId);

  if (!staffMember) {
    return { isAllowed: false, reason: 'staffNotFound' };
  }

  if (!buildingId) {
    return { isAllowed: true };
  }

  if (!save.buildings[buildingId]) {
    return { isAllowed: false, reason: 'buildingNotFound' };
  }

  if (!save.buildings[buildingId].isPurchased) {
    return { isAllowed: false, reason: 'notPurchased' };
  }

  if (getRequiredStaffCount(save, buildingId) <= 0) {
    return { isAllowed: false, reason: 'buildingDoesNotUseStaff' };
  }

  if (!canStaffWorkInBuilding(staffMember.type, buildingId)) {
    return { isAllowed: false, reason: 'invalidStaffType' };
  }

  if (
    staffMember.assignedBuildingId !== buildingId &&
    getAssignedStaffCount(save, buildingId, staffId) >= getRequiredStaffCount(save, buildingId)
  ) {
    return { isAllowed: false, reason: 'buildingFullyStaffed' };
  }

  return { isAllowed: true };
}

export function assignStaffToBuilding(
  save: GameSave,
  staffId: string,
  buildingId?: BuildingId,
): StaffActionResult {
  const validation = validateStaffAssignment(save, staffId, buildingId);

  if (!validation.isAllowed) {
    return { save, validation };
  }

  const members = save.staff.members.map((member) => {
    if (member.id !== staffId) {
      return member;
    }

    if (!buildingId) {
      const unassignedMember: StaffMember = { ...member };

      delete unassignedMember.assignedBuildingId;
      return unassignedMember;
    }

    return { ...member, assignedBuildingId: buildingId };
  });

  return {
    save: updateBuildingEfficiencies(
      synchronizeStaffAssignments({
        ...save,
        staff: {
          ...save.staff,
          members,
        },
      }),
    ),
    validation,
  };
}
