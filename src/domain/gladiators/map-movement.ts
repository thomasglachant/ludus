import type { GameTimeState } from '../time/types';
import type { Gladiator, GladiatorLocationId, GladiatorMapMovement } from './types';
import {
  getGladiatorMapMovementDuration,
  isGladiatorBuildingLocation,
} from '../../game-data/gladiator-map-movement';

export function getGameMinuteStamp(time: GameTimeState) {
  return (
    (((time.year - 1) * 8 + (time.week - 1)) * 7 +
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].indexOf(
        time.dayOfWeek,
      )) *
      24 *
      60 +
    time.hour * 60 +
    time.minute
  );
}

export function createGladiatorMapMovement(
  gladiator: Gladiator,
  targetLocation: GladiatorLocationId,
  time: GameTimeState,
  activity: string,
): GladiatorMapMovement | undefined {
  const currentLocation =
    gladiator.currentLocationId ??
    gladiator.currentBuildingId ??
    gladiator.mapMovement?.targetLocation ??
    'domus';

  if (currentLocation === targetLocation) {
    return undefined;
  }

  return {
    currentLocation,
    targetLocation,
    activity,
    movementStartedAt: getGameMinuteStamp(time),
    movementDuration: getGladiatorMapMovementDuration(currentLocation, targetLocation),
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

  const movement = createGladiatorMapMovement(gladiator, targetLocation, time, activity);

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
