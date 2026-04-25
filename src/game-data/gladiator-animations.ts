import type { BuildingId } from '../domain/buildings/types';
import type { Gladiator } from '../domain/gladiators/types';

export type GladiatorAnimationState =
  | 'idle'
  | 'walking'
  | 'training'
  | 'eating'
  | 'resting'
  | 'celebrating'
  | 'healing';

export interface GladiatorAnimationDefinition {
  state: GladiatorAnimationState;
  className: string;
  durationSeconds: number;
}

const animationStateByBuilding: Record<BuildingId, GladiatorAnimationState> = {
  domus: 'walking',
  canteen: 'eating',
  dormitory: 'resting',
  trainingGround: 'training',
  pleasureHall: 'celebrating',
  infirmary: 'healing',
};

export const GLADIATOR_ANIMATION_DEFINITIONS: Record<
  GladiatorAnimationState,
  GladiatorAnimationDefinition
> = {
  idle: {
    state: 'idle',
    className: 'ludus-map-sprite--idle',
    durationSeconds: 2.4,
  },
  walking: {
    state: 'walking',
    className: 'ludus-map-sprite--walking',
    durationSeconds: 1.4,
  },
  training: {
    state: 'training',
    className: 'ludus-map-sprite--training',
    durationSeconds: 0.78,
  },
  eating: {
    state: 'eating',
    className: 'ludus-map-sprite--eating',
    durationSeconds: 1.8,
  },
  resting: {
    state: 'resting',
    className: 'ludus-map-sprite--resting',
    durationSeconds: 2.8,
  },
  celebrating: {
    state: 'celebrating',
    className: 'ludus-map-sprite--celebrating',
    durationSeconds: 1.1,
  },
  healing: {
    state: 'healing',
    className: 'ludus-map-sprite--healing',
    durationSeconds: 2.2,
  },
};

export function getGladiatorAnimationDefinition(gladiator: Gladiator) {
  const state = gladiator.currentBuildingId
    ? animationStateByBuilding[gladiator.currentBuildingId]
    : 'idle';

  return GLADIATOR_ANIMATION_DEFINITIONS[state];
}
