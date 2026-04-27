import type { BuildingId } from '../buildings/types';
import type { GameTimeState } from '../time/types';
import type { Gladiator, GladiatorMapMovement } from './types';
import { getGladiatorMapMovementDuration } from '../../game-data/gladiator-map-movement';

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
  targetLocation: BuildingId,
  time: GameTimeState,
  activity: string,
): GladiatorMapMovement | undefined {
  const currentLocation =
    gladiator.mapMovement?.targetLocation ?? gladiator.currentBuildingId ?? targetLocation;

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

export function assignGladiatorMapLocation(
  gladiator: Gladiator,
  targetLocation: BuildingId | undefined,
  time: GameTimeState,
  activity = 'idle',
): Gladiator {
  if (!targetLocation) {
    return {
      ...gladiator,
      currentBuildingId: undefined,
      currentActivityId: activity,
      mapMovement: undefined,
    };
  }

  return {
    ...gladiator,
    currentBuildingId: targetLocation,
    currentActivityId: activity,
    mapMovement: createGladiatorMapMovement(gladiator, targetLocation, time, activity),
  };
}
