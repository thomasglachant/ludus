import type { BuildingId } from '../domain/buildings/types';
import type { GladiatorAnimationState } from './gladiator-animations';
import { LUDUS_MAP_DEFINITION, type MapPoint } from './map-layout';

export interface GladiatorMapActivityDestination {
  buildingId: BuildingId;
  animationState: GladiatorAnimationState;
}

export const GLADIATOR_MAP_STARTING_LOCATION: BuildingId = 'domus';

export const GLADIATOR_MAP_MOVEMENT_SPEED = 4.2;

export const GLADIATOR_MAP_ACTIVITY_DESTINATIONS: Record<string, GladiatorMapActivityDestination> =
  {
    balanced: {
      buildingId: 'trainingGround',
      animationState: 'train',
    },
    fightPreparation: {
      buildingId: 'trainingGround',
      animationState: 'train',
    },
    trainStrength: {
      buildingId: 'trainingGround',
      animationState: 'train',
    },
    trainAgility: {
      buildingId: 'trainingGround',
      animationState: 'train',
    },
    trainDefense: {
      buildingId: 'trainingGround',
      animationState: 'train',
    },
    recovery: {
      buildingId: 'dormitory',
      animationState: 'rest',
    },
    moraleBoost: {
      buildingId: 'pleasureHall',
      animationState: 'celebrate',
    },
    protectChampion: {
      buildingId: 'dormitory',
      animationState: 'rest',
    },
    prepareForSale: {
      buildingId: 'pleasureHall',
      animationState: 'celebrate',
    },
    eat: {
      buildingId: 'canteen',
      animationState: 'eat',
    },
    heal: {
      buildingId: 'infirmary',
      animationState: 'heal',
    },
  };

export function getGladiatorMapSlots(buildingId: BuildingId) {
  return LUDUS_MAP_DEFINITION.gladiatorSlots.filter((slot) => slot.buildingId === buildingId);
}

export function getGladiatorMapPoint(buildingId: BuildingId, slotIndex = 0): MapPoint {
  const slots = getGladiatorMapSlots(buildingId);
  const slot = slots[slotIndex % Math.max(slots.length, 1)];
  const location = LUDUS_MAP_DEFINITION.locations.find(
    (candidate) => candidate.kind === 'building' && candidate.id === buildingId,
  );

  return {
    x: slot?.x ?? (location ? location.x + location.width / 2 : 1120),
    y: slot?.y ?? (location ? location.y + location.height : 830),
  };
}

export function getGladiatorMapMovementDuration(
  currentLocation: BuildingId,
  targetLocation: BuildingId,
) {
  const currentPoint = getGladiatorMapPoint(currentLocation);
  const targetPoint = getGladiatorMapPoint(targetLocation);
  const distance = Math.hypot(targetPoint.x - currentPoint.x, targetPoint.y - currentPoint.y);

  return Math.max(8, Math.round(distance / GLADIATOR_MAP_MOVEMENT_SPEED));
}
