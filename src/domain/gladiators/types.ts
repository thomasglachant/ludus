import type { BuildingId } from '../buildings/types';
import type { GridCoord } from '../map/types';

export type GladiatorLocationId = BuildingId | 'arena';

export interface GladiatorMapMovement {
  currentLocation: GladiatorLocationId;
  targetLocation: GladiatorLocationId;
  activity: string;
  route?: GridCoord[];
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
  accessoryStyle?: string;
  bodyBuildStyle?: string;
  skinTone?: string;
  markingStyle?: string;
}

export interface Gladiator {
  id: string;
  name: string;
  classId?: GladiatorClassId;
  age: number;
  strength: number;
  agility: number;
  defense: number;
  energy: number;
  health: number;
  morale: number;
  satiety: number;
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

export type GladiatorClassId = 'murmillo' | 'retiarius' | 'secutor' | 'thraex' | 'hoplomachus';

export interface GladiatorTrainingPlan {
  gladiatorId: string;
  strength: number;
  agility: number;
  defense: number;
}
