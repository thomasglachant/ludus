import type { BuildingId } from '../domain/buildings/types';
import type { GladiatorLocationId } from '../domain/gladiators/types';
import type { GridCoord, LudusMapState } from '../domain/map/types';
import { findMapPath } from '../domain/map/pathfinding';
import type { GladiatorAnimationState } from './gladiator-animations';
import { GAME_BALANCE } from './balance';
import {
  cellToWorldCenter,
  createInitialLudusMapState,
  getMapLocation,
  getMapLocationEntrance,
  getMapObjectDefinitions,
  LUDUS_MAP_DEFINITION,
  type MapPoint,
} from './map-layout';

export interface GladiatorMapActivityDestination {
  buildingId: BuildingId;
  animationState: GladiatorAnimationState;
}

export const GLADIATOR_MAP_STARTING_LOCATION: BuildingId = 'domus';

export const GLADIATOR_MAP_MOVEMENT_MINUTES_PER_TILE = GAME_BALANCE.map.movementMinutesPerTile;

export const GLADIATOR_MAP_ACTIVITY_DESTINATIONS: Record<string, GladiatorMapActivityDestination> =
  {
    balanced: {
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

export function getGladiatorMapSlots(locationId: GladiatorLocationId) {
  return LUDUS_MAP_DEFINITION.gladiatorSlots.filter((slot) => slot.locationId === locationId);
}

export function isGladiatorBuildingLocation(
  locationId: GladiatorLocationId,
): locationId is BuildingId {
  return LUDUS_MAP_DEFINITION.locations.some(
    (location) => location.kind === 'building' && location.id === locationId,
  );
}

export function getGladiatorMapPoint(locationId: GladiatorLocationId, slotIndex = 0): MapPoint {
  const slots = getGladiatorMapSlots(locationId);
  const slot = slots[slotIndex % Math.max(slots.length, 1)];
  const location = getMapLocation(locationId);

  return {
    x: slot?.x ?? (location ? location.x + location.width / 2 : 1120),
    y: slot?.y ?? (location ? location.y + location.height : 830),
  };
}

export function getGladiatorMapEntrancePoint(locationId: GladiatorLocationId): MapPoint {
  return cellToWorldCenter(getMapLocationEntrance(locationId));
}

export function getGladiatorMapRoute(
  currentLocation: GladiatorLocationId,
  targetLocation: GladiatorLocationId,
  mapState: LudusMapState = createInitialLudusMapState(),
): GridCoord[] {
  const start = getMapLocationEntrance(currentLocation);
  const target = getMapLocationEntrance(targetLocation);
  const route = findMapPath({
    definitions: getMapObjectDefinitions(),
    grid: LUDUS_MAP_DEFINITION.grid,
    mapState,
    start,
    target,
  });

  return route.length > 0 ? route : [start, target];
}

export function getGladiatorMapRoutePoints(route: GridCoord[] | undefined): MapPoint[] {
  return route?.map(cellToWorldCenter) ?? [];
}

export function getGladiatorMapMovementDuration(
  currentLocation: GladiatorLocationId,
  targetLocation: GladiatorLocationId,
  mapState: LudusMapState = createInitialLudusMapState(),
) {
  const route = getGladiatorMapRoute(currentLocation, targetLocation, mapState);
  const traversedTiles = Math.max(route.length - 1, 1);

  return Math.max(
    GLADIATOR_MAP_MOVEMENT_MINUTES_PER_TILE,
    traversedTiles * GLADIATOR_MAP_MOVEMENT_MINUTES_PER_TILE,
  );
}
