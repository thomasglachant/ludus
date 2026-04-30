import type { GameTimeState } from '../time/types';
import { getGridCoordKey } from '../map/occupancy';
import type { GridCoord, LudusMapState } from '../map/types';
import type {
  Gladiator,
  GladiatorLocationId,
  GladiatorMapMovement,
  GladiatorMapMovementTileScheduleEntry,
} from './types';
import { PROGRESSION_CONFIG } from '../../game-data/progression';
import { DAYS_OF_WEEK, TIME_CONFIG } from '../../game-data/time';
import {
  GLADIATOR_MAP_MOVEMENT_MINUTES_PER_TILE,
  getGladiatorMapRoute,
  getGladiatorMapMovementDuration,
  isGladiatorBuildingLocation,
} from '../../game-data/gladiator-map-movement';

type TileReservationMap = Map<string, Set<number>>;

interface MovementTimelineAction {
  kind: 'move' | 'wait' | 'waitInside';
  fromIndex: number;
  toIndex: number;
  startStamp: number;
  endStamp: number;
}

interface MovementTimelineState {
  index: number;
  stamp: number;
}

interface MovementTimelinePreviousState {
  action: MovementTimelineAction;
  previousKey: string;
}

const MAX_TRAFFIC_SEARCH_EXTRA_MINUTES = TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour;

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

function getMovementMinutesPerTile(movement: GladiatorMapMovement) {
  return Math.max(1, Math.ceil(movement.minutesPerTile ?? GLADIATOR_MAP_MOVEMENT_MINUTES_PER_TILE));
}

function areGridCoordsEqual(left: GridCoord, right: GridCoord) {
  return left.column === right.column && left.row === right.row;
}

function getMovementRoute(movement: GladiatorMapMovement, mapState?: LudusMapState) {
  return movement.route && movement.route.length > 0
    ? movement.route
    : getGladiatorMapRoute(movement.currentLocation, movement.targetLocation, mapState);
}

function getCellReservations(reservations: TileReservationMap, coord: GridCoord) {
  const key = getGridCoordKey(coord);
  const existingReservations = reservations.get(key);

  if (existingReservations) {
    return existingReservations;
  }

  const cellReservations = new Set<number>();
  reservations.set(key, cellReservations);

  return cellReservations;
}

function forEachTileReservationSlot(
  startStamp: number,
  endStamp: number,
  visitSlot: (stamp: number) => void,
) {
  const start = Math.floor(startStamp);
  const end = Math.ceil(endStamp);

  for (let stamp = start; stamp < end; stamp += 1) {
    visitSlot(stamp);
  }
}

function isTileSlotFree(coord: GridCoord, stamp: number, reservations: TileReservationMap) {
  return !reservations.get(getGridCoordKey(coord))?.has(stamp);
}

function areTileSlotsFree(
  coord: GridCoord,
  startStamp: number,
  endStamp: number,
  reservations: TileReservationMap,
) {
  let areFree = true;

  forEachTileReservationSlot(startStamp, endStamp, (stamp) => {
    if (!isTileSlotFree(coord, stamp, reservations)) {
      areFree = false;
    }
  });

  return areFree;
}

function reserveTileSlots(
  coord: GridCoord,
  startStamp: number,
  endStamp: number,
  reservations: TileReservationMap,
) {
  const cellReservations = getCellReservations(reservations, coord);

  forEachTileReservationSlot(startStamp, endStamp, (stamp) => {
    cellReservations.add(stamp);
  });
}

function getTimelineStateKey(state: MovementTimelineState) {
  return `${state.index}:${state.stamp}`;
}

function reconstructMovementTimeline(
  cameFrom: Map<string, MovementTimelinePreviousState>,
  targetKey: string,
): MovementTimelineAction[] {
  const actions: MovementTimelineAction[] = [];
  let currentKey: string | undefined = targetKey;

  while (currentKey) {
    const previousState = cameFrom.get(currentKey);

    if (!previousState) {
      break;
    }

    actions.push(previousState.action);
    currentKey = previousState.previousKey;
  }

  return actions.reverse();
}

function findEarliestMovementTimeline(
  route: GridCoord[],
  movementStartedAt: number,
  minutesPerTile: number,
  reservations: TileReservationMap,
) {
  const startState = { index: 0, stamp: movementStartedAt };
  const startKey = getTimelineStateKey(startState);
  const frontier: MovementTimelineState[] = [startState];
  const bestStampByStateKey = new Map<string, number>([[startKey, movementStartedAt]]);
  const cameFrom = new Map<string, MovementTimelinePreviousState>();
  const latestStamp =
    movementStartedAt + route.length * minutesPerTile + MAX_TRAFFIC_SEARCH_EXTRA_MINUTES;

  function queueState(
    state: MovementTimelineState,
    previousKey: string,
    action: MovementTimelineAction,
  ) {
    const key = getTimelineStateKey(state);
    const bestStamp = bestStampByStateKey.get(key);

    if (bestStamp !== undefined && bestStamp <= state.stamp) {
      return;
    }

    bestStampByStateKey.set(key, state.stamp);
    cameFrom.set(key, { action, previousKey });
    frontier.push(state);
  }

  while (frontier.length > 0) {
    frontier.sort((left, right) => left.stamp - right.stamp || right.index - left.index);

    const current = frontier.shift();

    if (!current) {
      break;
    }

    const currentKey = getTimelineStateKey(current);

    if (current.index === route.length - 1) {
      return reconstructMovementTimeline(cameFrom, currentKey);
    }

    if (current.stamp > latestStamp) {
      continue;
    }

    const nextWaitStamp = current.stamp + 1;

    if (
      nextWaitStamp <= latestStamp &&
      (current.index === 0 || isTileSlotFree(route[current.index], current.stamp, reservations))
    ) {
      queueState({ index: current.index, stamp: nextWaitStamp }, currentKey, {
        kind: current.index === 0 ? 'waitInside' : 'wait',
        fromIndex: current.index,
        toIndex: current.index,
        startStamp: current.stamp,
        endStamp: nextWaitStamp,
      });
    }

    const nextMoveStamp = current.stamp + minutesPerTile;

    const nextIndex = current.index + 1;
    const nextTileExitStamp =
      nextIndex === route.length - 1 ? nextMoveStamp + minutesPerTile : nextMoveStamp + 1;

    if (
      nextMoveStamp <= latestStamp &&
      areTileSlotsFree(route[current.index], current.stamp, nextMoveStamp, reservations) &&
      areTileSlotsFree(route[nextIndex], nextMoveStamp, nextTileExitStamp, reservations)
    ) {
      queueState({ index: nextIndex, stamp: nextMoveStamp }, currentKey, {
        kind: 'move',
        fromIndex: current.index,
        toIndex: nextIndex,
        startStamp: current.stamp,
        endStamp: nextMoveStamp,
      });
    }
  }

  return undefined;
}

function createTileScheduleFromTimeline(
  route: GridCoord[],
  movementStartedAt: number,
  minutesPerTile: number,
  timeline: MovementTimelineAction[],
): GladiatorMapMovementTileScheduleEntry[] {
  const tileSchedule = route.map((coord) => ({
    coord,
    arrivalStamp: Number.POSITIVE_INFINITY,
    departureStamp: Number.POSITIVE_INFINITY,
  }));

  if (route.length === 1) {
    return [
      { coord: route[0], arrivalStamp: movementStartedAt, departureStamp: movementStartedAt },
    ];
  }

  for (const action of timeline) {
    if (action.kind === 'waitInside') {
      continue;
    }

    const currentEntry = tileSchedule[action.fromIndex];

    if (Number.isFinite(currentEntry.arrivalStamp) === false) {
      currentEntry.arrivalStamp = action.startStamp;
    }

    if (action.kind === 'move') {
      const nextEntry = tileSchedule[action.toIndex];

      currentEntry.departureStamp = action.startStamp;

      if (Number.isFinite(nextEntry.arrivalStamp) === false) {
        nextEntry.arrivalStamp = action.endStamp;
      }
    }
  }

  for (let index = 0; index < tileSchedule.length; index += 1) {
    const entry = tileSchedule[index];

    if (Number.isFinite(entry.arrivalStamp) === false) {
      entry.arrivalStamp = index === 0 ? movementStartedAt : tileSchedule[index - 1].departureStamp;
    }

    if (Number.isFinite(entry.departureStamp) === false) {
      entry.departureStamp =
        index === tileSchedule.length - 1
          ? entry.arrivalStamp + minutesPerTile
          : entry.arrivalStamp;
    }
  }

  return tileSchedule;
}

function createUnreservedTileSchedule(
  route: GridCoord[],
  movementStartedAt: number,
  minutesPerTile: number,
): GladiatorMapMovementTileScheduleEntry[] {
  return route.map((coord, index) => {
    const arrivalStamp = movementStartedAt + index * minutesPerTile;

    return {
      coord,
      arrivalStamp,
      departureStamp: index === route.length - 1 ? arrivalStamp + minutesPerTile : arrivalStamp,
    };
  });
}

function getTileScheduleCompletionStamp(tileSchedule: GladiatorMapMovementTileScheduleEntry[]) {
  return tileSchedule[tileSchedule.length - 1]?.arrivalStamp;
}

function isTileScheduleValidForMovement(
  tileSchedule: GladiatorMapMovementTileScheduleEntry[] | undefined,
  movement: GladiatorMapMovement,
  route: GridCoord[],
  minutesPerTile: number,
) {
  if (!tileSchedule || tileSchedule.length !== route.length) {
    return false;
  }

  for (let index = 0; index < tileSchedule.length; index += 1) {
    const entry = tileSchedule[index];

    if (
      !Number.isFinite(entry.arrivalStamp) ||
      !Number.isFinite(entry.departureStamp) ||
      !areGridCoordsEqual(entry.coord, route[index]) ||
      entry.departureStamp < entry.arrivalStamp
    ) {
      return false;
    }

    if (index === 0 && entry.arrivalStamp < movement.movementStartedAt) {
      return false;
    }

    const nextEntry = tileSchedule[index + 1];

    if (nextEntry && nextEntry.arrivalStamp < entry.departureStamp + minutesPerTile) {
      return false;
    }

    if (!nextEntry && entry.departureStamp < entry.arrivalStamp + minutesPerTile) {
      return false;
    }
  }

  return true;
}

function canReserveTileSchedule(
  tileSchedule: GladiatorMapMovementTileScheduleEntry[],
  reservations: TileReservationMap,
) {
  for (let index = 0; index < tileSchedule.length; index += 1) {
    const entry = tileSchedule[index];
    const nextEntry = tileSchedule[index + 1];
    const endStamp = nextEntry?.arrivalStamp ?? entry.departureStamp;

    if (!areTileSlotsFree(entry.coord, entry.arrivalStamp, endStamp, reservations)) {
      return false;
    }
  }

  return true;
}

function reserveTileSchedule(
  tileSchedule: GladiatorMapMovementTileScheduleEntry[],
  reservations: TileReservationMap,
) {
  for (let index = 0; index < tileSchedule.length; index += 1) {
    const entry = tileSchedule[index];
    const nextEntry = tileSchedule[index + 1];
    const endStamp = nextEntry?.arrivalStamp ?? entry.departureStamp;

    reserveTileSlots(entry.coord, entry.arrivalStamp, endStamp, reservations);
  }
}

function withTileSchedule(
  movement: GladiatorMapMovement,
  route: GridCoord[],
  tileSchedule: GladiatorMapMovementTileScheduleEntry[],
  minutesPerTile: number,
): GladiatorMapMovement {
  const completionStamp = getTileScheduleCompletionStamp(tileSchedule);

  return {
    ...movement,
    route,
    tileSchedule,
    movementDuration:
      completionStamp === undefined
        ? movement.movementDuration
        : Math.max(minutesPerTile, completionStamp - movement.movementStartedAt),
    minutesPerTile,
  };
}

function scheduleMovementWithReservations(
  movement: GladiatorMapMovement,
  mapState: LudusMapState | undefined,
  reservations: TileReservationMap,
) {
  const route = getMovementRoute(movement, mapState);
  const minutesPerTile = getMovementMinutesPerTile(movement);

  if (route.length <= 1) {
    return movement;
  }

  const existingTileSchedule = movement.tileSchedule;

  if (
    isTileScheduleValidForMovement(existingTileSchedule, movement, route, minutesPerTile) &&
    existingTileSchedule &&
    canReserveTileSchedule(existingTileSchedule, reservations)
  ) {
    reserveTileSchedule(existingTileSchedule, reservations);

    return withTileSchedule(movement, route, existingTileSchedule, minutesPerTile);
  }

  const timeline = findEarliestMovementTimeline(
    route,
    movement.movementStartedAt,
    minutesPerTile,
    reservations,
  );
  const tileSchedule = timeline
    ? createTileScheduleFromTimeline(route, movement.movementStartedAt, minutesPerTile, timeline)
    : createUnreservedTileSchedule(route, movement.movementStartedAt, minutesPerTile);

  reserveTileSchedule(tileSchedule, reservations);

  return withTileSchedule(movement, route, tileSchedule, minutesPerTile);
}

export function synchronizeGladiatorMapMovementSchedules(
  gladiators: Gladiator[],
  mapState?: LudusMapState,
): Gladiator[] {
  const reservations: TileReservationMap = new Map();
  const scheduledMovements = new Map<number, GladiatorMapMovement>();
  const movingGladiators = gladiators
    .map((gladiator, index) => ({ gladiator, index }))
    .filter(({ gladiator }) => Boolean(gladiator.mapMovement))
    .sort((left, right) => {
      const leftMovement = left.gladiator.mapMovement;
      const rightMovement = right.gladiator.mapMovement;

      if (!leftMovement || !rightMovement) {
        return left.index - right.index;
      }

      return (
        leftMovement.movementStartedAt - rightMovement.movementStartedAt || left.index - right.index
      );
    });

  for (const { gladiator, index } of movingGladiators) {
    const movement = gladiator.mapMovement;

    if (!movement) {
      continue;
    }

    scheduledMovements.set(
      index,
      scheduleMovementWithReservations(movement, mapState, reservations),
    );
  }

  if (scheduledMovements.size === 0) {
    return gladiators;
  }

  return gladiators.map((gladiator, index) => {
    const scheduledMovement = scheduledMovements.get(index);

    return scheduledMovement ? { ...gladiator, mapMovement: scheduledMovement } : gladiator;
  });
}

export function getGladiatorMapMovementArrivalStamp(movement: GladiatorMapMovement) {
  const tileScheduleCompletionStamp = movement.tileSchedule
    ? getTileScheduleCompletionStamp(movement.tileSchedule)
    : undefined;

  if (tileScheduleCompletionStamp !== undefined) {
    return tileScheduleCompletionStamp;
  }

  return movement.movementStartedAt + movement.movementDuration;
}

export function getGladiatorMapMovementExitStamp(movement: GladiatorMapMovement) {
  return movement.tileSchedule?.[0]?.arrivalStamp ?? movement.movementStartedAt;
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
