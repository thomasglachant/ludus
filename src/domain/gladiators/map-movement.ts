import type { GameTimeState } from '../time/types';
import type { Gladiator, GladiatorLocationId, GladiatorMapMovement } from './types';
import { PROGRESSION_CONFIG } from '../../game-data/progression';
import { DAYS_OF_WEEK, TIME_CONFIG } from '../../game-data/time';
import {
  GLADIATOR_MAP_MOVEMENT_MINUTES_PER_TILE,
  getGladiatorMapRoute,
  getGladiatorMapMovementDuration,
  isGladiatorBuildingLocation,
} from '../../game-data/gladiator-map-movement';
import type { LudusMapState } from '../map/types';

export function getGameMinuteStamp(time: GameTimeState) {
  const dayIndex = DAYS_OF_WEEK.indexOf(time.dayOfWeek);

  return (
    (((time.year - 1) * PROGRESSION_CONFIG.weeksPerYear + (time.week - 1)) * DAYS_OF_WEEK.length +
      dayIndex) *
      TIME_CONFIG.hoursPerDay *
      TIME_CONFIG.minutesPerHour +
    time.hour * TIME_CONFIG.minutesPerHour +
    time.minute
  );
}

export function createGladiatorMapMovement(
  gladiator: Gladiator,
  targetLocation: GladiatorLocationId,
  time: GameTimeState,
  activity: string,
  mapState?: LudusMapState,
): GladiatorMapMovement | undefined {
  const currentLocation =
    gladiator.currentLocationId ??
    gladiator.currentBuildingId ??
    gladiator.mapMovement?.targetLocation ??
    'domus';

  if (currentLocation === targetLocation) {
    return undefined;
  }

  const route = getGladiatorMapRoute(currentLocation, targetLocation, mapState);

  return {
    currentLocation,
    targetLocation,
    activity,
    route,
    movementStartedAt: getGameMinuteStamp(time),
    movementDuration: getGladiatorMapMovementDuration(currentLocation, targetLocation, mapState),
    minutesPerTile: GLADIATOR_MAP_MOVEMENT_MINUTES_PER_TILE,
  };
}

export function getGladiatorMapMovementArrivalStamp(movement: GladiatorMapMovement) {
  return movement.movementStartedAt + movement.movementDuration;
}

export function isGladiatorMapMovementComplete(
  movement: GladiatorMapMovement,
  time: GameTimeState,
) {
  return getGameMinuteStamp(time) >= getGladiatorMapMovementArrivalStamp(movement);
}

export function resolveGladiatorMapMovement(gladiator: Gladiator, time: GameTimeState): Gladiator {
  const movement = gladiator.mapMovement;

  if (!movement || !isGladiatorMapMovementComplete(movement, time)) {
    return gladiator;
  }

  const targetLocation = movement.targetLocation;
  const isBuilding = isGladiatorBuildingLocation(targetLocation);

  return {
    ...gladiator,
    currentLocationId: targetLocation,
    currentBuildingId: isBuilding ? targetLocation : undefined,
    currentActivityId: movement.activity,
    currentTaskStartedAt: getGladiatorMapMovementArrivalStamp(movement),
    mapMovement: undefined,
  };
}

export function assignGladiatorMapLocation(
  gladiator: Gladiator,
  targetLocation: GladiatorLocationId | undefined,
  time: GameTimeState,
  activity = 'idle',
  mapState?: LudusMapState,
): Gladiator {
  const activeMovement = gladiator.mapMovement;

  if (activeMovement && activeMovement.targetLocation === targetLocation) {
    return {
      ...gladiator,
      currentActivityId: activity,
      currentTaskStartedAt:
        activeMovement.activity === activity
          ? gladiator.currentTaskStartedAt
          : getGameMinuteStamp(time),
      mapMovement: {
        ...activeMovement,
        activity,
      },
    };
  }

  const currentLocation = gladiator.currentLocationId ?? gladiator.currentBuildingId;
  const currentTaskStartedAt =
    currentLocation === targetLocation && gladiator.currentActivityId === activity
      ? gladiator.currentTaskStartedAt
      : getGameMinuteStamp(time);

  if (!targetLocation) {
    return {
      ...gladiator,
      currentLocationId: undefined,
      currentBuildingId: undefined,
      currentActivityId: activity,
      currentTaskStartedAt,
      mapMovement: undefined,
    };
  }

  const movement = createGladiatorMapMovement(gladiator, targetLocation, time, activity, mapState);

  if (!movement) {
    const isBuilding = isGladiatorBuildingLocation(targetLocation);

    return {
      ...gladiator,
      currentLocationId: targetLocation,
      currentBuildingId: isBuilding ? targetLocation : undefined,
      currentActivityId: activity,
      currentTaskStartedAt,
      mapMovement: undefined,
    };
  }

  return {
    ...gladiator,
    currentLocationId: undefined,
    currentBuildingId: undefined,
    currentActivityId: activity,
    currentTaskStartedAt,
    mapMovement: movement,
  };
}
