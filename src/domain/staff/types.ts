import type { BuildingId } from '../buildings/types';

export type StaffType = 'slave' | 'guard' | 'trainer';
export type StaffVisualId = `${StaffType}-0${1 | 2 | 3 | 4 | 5}`;

export interface StaffMember {
  id: string;
  name: string;
  type: StaffType;
  visualId: StaffVisualId;
  weeklyWage: number;
  buildingExperience: Partial<Record<BuildingId, number>>;
  assignedBuildingId?: BuildingId;
}

export interface StaffMarketCandidate extends StaffMember {
  price: number;
}

export interface StaffAssignment {
  buildingId: BuildingId;
  staffIds: string[];
}

export interface StaffState {
  members: StaffMember[];
  marketCandidates: StaffMarketCandidate[];
  assignments: StaffAssignment[];
}
