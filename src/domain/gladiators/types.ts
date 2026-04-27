import type { BuildingId } from '../buildings/types';

export type GladiatorLocationId = BuildingId | 'arena';

export interface GladiatorMapMovement {
  currentLocation: GladiatorLocationId;
  targetLocation: GladiatorLocationId;
  activity: string;
  movementStartedAt: number;
  movementDuration: number;
}

export interface GladiatorVisualIdentity {
  portraitAssetId: string;
  spriteAssetId: string;
  paletteId?: string;
  bodyType?: string;
  hairStyle?: string;
  armorStyle?: string;
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

export interface GladiatorTrainingPlan {
  gladiatorId: string;
  strength: number;
  agility: number;
  defense: number;
}
