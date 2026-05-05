import type { GameDate } from '../time/types';

export const GLADIATOR_CLASS_IDS = ['murmillo', 'retiarius', 'secutor'] as const;

export type GladiatorClassId = (typeof GLADIATOR_CLASS_IDS)[number];

export interface GladiatorSkillProfile {
  strength: number;
  agility: number;
  defense: number;
  life: number;
}

export interface GladiatorVisualIdentity {
  classId?: GladiatorClassId;
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
  experience: number;
  strength: number;
  agility: number;
  defense: number;
  life: number;
  reputation: number;
  wins: number;
  losses: number;
  traits: GladiatorTrait[];
  visualIdentity?: GladiatorVisualIdentity;
}

export interface GladiatorTrait {
  traitId: GladiatorTraitId;
  expiresAt?: GameDate;
}

export type GladiatorTraitId =
  | 'disciplined'
  | 'lazy'
  | 'brave'
  | 'cowardly'
  | 'ambitious'
  | 'fragile'
  | 'crowdFavorite'
  | 'rivalrous'
  | 'stoic'
  | 'injury'
  | 'victoryAura';
