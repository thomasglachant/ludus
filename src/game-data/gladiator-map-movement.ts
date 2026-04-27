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
      animationState: 'training',
    },
    fightPreparation: {
      buildingId: 'trainingGround',
      animationState: 'training',
    },
    trainStrength: {
      buildingId: 'trainingGround',
      animationState: 'training',
    },
    trainAgility: {
      buildingId: 'trainingGround',
      animationState: 'training',
    },
    trainDefense: {
      buildingId: 'trainingGround',
      animationState: 'training',
    },
    recovery: {
      buildingId: 'dormitory',
      animationState: 'resting',
    },
    moraleBoost: {
      buildingId: 'pleasureHall',
      animationState: 'celebrating',
    },
    protectChampion: {
      buildingId: 'dormitory',
      animationState: 'resting',
    },
    prepareForSale: {
      buildingId: 'pleasureHall',
      animationState: 'celebrating',
    },
    eat: {
      buildingId: 'canteen',
      animationState: 'eating',
    },
    heal: {
      buildingId: 'infirmary',
      animationState: 'healing',
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
