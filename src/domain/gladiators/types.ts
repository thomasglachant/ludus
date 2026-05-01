import type { BuildingId } from '../buildings/types';
import type { GridCoord } from '../map/types';

export type GladiatorLocationId = BuildingId | 'arena';

export interface GladiatorMapMovementTileScheduleEntry {
  coord: GridCoord;
  arrivalStamp: number;
  departureStamp: number;
}

export interface GladiatorMapMovement {
  currentLocation: GladiatorLocationId;
  targetLocation: GladiatorLocationId;
  activity: string;
  route?: GridCoord[];
  tileSchedule?: GladiatorMapMovementTileScheduleEntry[];
  movementStartedAt: number;
  movementDuration: number;
  minutesPerTile?: number;
}

export interface GladiatorVisualIdentity {
  portraitAssetId: string;
  spriteAssetId: string;
  paletteId?: string;
  bodyType?: string;
  hairStyle?: string;
  armorStyle?: string;
  clothingStyle?: string;
  clothingColor?: string;
  hairAndBeardStyle?: string;
  headwearStyle?: string;
  bodyBuildStyle?: string;
  skinTone?: string;
  markingStyle?: string;
}

export interface Gladiator {
  id: string;
  name: string;
  age: number;
  strength: number;
  agility: number;
  defense: number;
  energy: number;
  health: number;
  morale: number;
  reputation: number;
  wins: number;
  losses: number;
  traits: GladiatorTrait[];
  currentLocationId?: GladiatorLocationId;
  currentBuildingId?: BuildingId;
  currentActivityId?: string;
  currentTaskStartedAt?: number;
  mapMovement?: GladiatorMapMovement;
  trainingPlan?: GladiatorTrainingPlan;
  visualIdentity?: GladiatorVisualIdentity;
}

export type GladiatorTrait =
  | 'disciplined'
  | 'lazy'
  | 'brave'
  | 'cowardly'
  | 'ambitious'
  | 'fragile'
  | 'crowdFavorite'
  | 'rivalrous'
  | 'stoic';

export interface GladiatorTrainingPlan {
  gladiatorId: string;
  strength: number;
  agility: number;
  defense: number;
}
