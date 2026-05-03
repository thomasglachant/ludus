import { BUILDING_DEFINITIONS, BUILDING_IDS } from '../../game-data/buildings';
import { sumActiveBuildingEffectValues } from './building-effects';
import type { GameSave } from '../saves/types';
import type { StaffType } from '../staff/types';
import type { BuildingEffect, BuildingId } from './types';

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function canStaffWorkInBuilding(type: StaffType, buildingId: BuildingId) {
  if (type === 'trainer') {
    return buildingId === 'trainingGround';
  }

  return true;
}

export function getRequiredStaffCount(save: GameSave, buildingId: BuildingId) {
  const building = save.buildings[buildingId];
  const definition = BUILDING_DEFINITIONS[buildingId];

  return (
    definition.requiredStaffByLevel?.[building.level] ??
    (definition.staffType ? Math.max(1, building.level) : 0)
  );
}

function getLudusEffectValue(
  save: GameSave,
  type: BuildingEffect['type'],
  options?: Parameters<typeof sumActiveBuildingEffectValues>[2],
) {
  return sumActiveBuildingEffectValues(
    save,
    {
      target: 'ludus',
      type,
    },
    options,
  );
}

export function calculateBuildingEfficiency(save: GameSave, buildingId: BuildingId) {
  const building = save.buildings[buildingId];
  const assignedStaffIds = building.staffAssignmentIds.length
    ? building.staffAssignmentIds
    : (save.staff.assignments.find((assignment) => assignment.buildingId === buildingId)
        ?.staffIds ?? []);
  const assignedStaff = assignedStaffIds.length;
  const requiredStaff = getRequiredStaffCount(save, buildingId);
  const assignedMembers = save.staff.members.filter((member) =>
    assignedStaffIds.includes(member.id),
  );
  const averageExperience =
    assignedMembers.length > 0
      ? assignedMembers.reduce(
          (total, member) => total + (member.buildingExperience[buildingId] ?? 0),
          0,
        ) / assignedMembers.length
      : 0;
  const experienceBonus = clamp(averageExperience / 100, 0, 0.2);
  const staffEfficiencyBonus = getLudusEffectValue(save, 'increaseStaffEfficiency', {
    scaleByEfficiency: false,
  });

  if (!building.isPurchased) {
    return 0;
  }

  if (requiredStaff <= 0) {
    return 1;
  }

  return clamp(
    clamp(assignedStaff / requiredStaff, 0, 1) * (1 + staffEfficiencyBonus / 100) + experienceBonus,
    0.25,
    1.2,
  );
}

export function updateBuildingEfficiencies(save: GameSave): GameSave {
  return {
    ...save,
    buildings: {
      ...save.buildings,
      ...Object.fromEntries(
        BUILDING_IDS.map((buildingId) => [
          buildingId,
          {
            ...save.buildings[buildingId],
            efficiency: Math.round(calculateBuildingEfficiency(save, buildingId) * 100),
          },
        ]),
      ),
    },
  };
}
