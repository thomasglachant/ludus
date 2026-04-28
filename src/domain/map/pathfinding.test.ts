import { describe, expect, it } from 'vitest';
import {
  createInitialLudusMapState,
  getMapLocationEntrance,
  getMapObjectDefinitions,
  LUDUS_MAP_DEFINITION,
} from '../../game-data/map-layout';
import { createMapOccupancy, getGridCoordKey } from './occupancy';
import { findMapPath } from './pathfinding';

function expectCardinalRoute(route: { column: number; row: number }[]) {
  for (let index = 1; index < route.length; index += 1) {
    const previous = route[index - 1];
    const current = route[index];

    expect(Math.abs(current.column - previous.column) + Math.abs(current.row - previous.row)).toBe(
      1,
    );
  }
}

function isEntranceRoad(
  coord: { column: number; row: number },
  location: (typeof LUDUS_MAP_DEFINITION.locations)[number],
) {
  return coord.column === location.entrance.column && coord.row === location.entrance.row;
}

function isInsideOneTileBorder(
  coord: { column: number; row: number },
  location: (typeof LUDUS_MAP_DEFINITION.locations)[number],
) {
  return (
    coord.column >= location.grid.column - 1 &&
    coord.column <= location.grid.column + location.grid.columns &&
    coord.row >= location.grid.row - 1 &&
    coord.row <= location.grid.row + location.grid.rows
  );
}

describe('map pathfinding', () => {
  it('places every fixed location entrance on the bottom side', () => {
    for (const location of LUDUS_MAP_DEFINITION.locations) {
      expect(location.entrance.row).toBe(location.grid.row + location.grid.rows);
      expect(location.entrance.column).toBeGreaterThanOrEqual(location.grid.column);
      expect(location.entrance.column).toBeLessThan(location.grid.column + location.grid.columns);
    }
  });

  it('keeps a road tile directly below every fixed location entrance', () => {
    const mapState = createInitialLudusMapState();
    const occupancy = createMapOccupancy(mapState, getMapObjectDefinitions());

    for (const location of LUDUS_MAP_DEFINITION.locations) {
      expect(
        occupancy.roadCells.has(
          getGridCoordKey({
            column: location.entrance.column,
            row: location.entrance.row + 1,
          }),
        ),
      ).toBe(true);
    }
  });

  it('keeps activity markers inside fixed location footprints', () => {
    for (const location of LUDUS_MAP_DEFINITION.locations) {
      for (const slot of location.activitySlots) {
        expect(slot.coord.column).toBeGreaterThanOrEqual(location.grid.column);
        expect(slot.coord.column).toBeLessThan(location.grid.column + location.grid.columns);
        expect(slot.coord.row).toBeGreaterThanOrEqual(location.grid.row);
        expect(slot.coord.row).toBeLessThan(location.grid.row + location.grid.rows);
      }
    }
  });

  it('does not duplicate initial road placements', () => {
    const mapState = createInitialLudusMapState();
    const roads = mapState.placements.filter((placement) => placement.kind === 'road');
    const roadIds = new Set(roads.map((placement) => placement.id));
    const roadCoords = new Set(roads.map((placement) => getGridCoordKey(placement.origin)));

    expect(roadIds.size).toBe(roads.length);
    expect(roadCoords.size).toBe(roads.length);
  });

  it('keeps roads one tile away from buildings except at entrances', () => {
    const mapState = createInitialLudusMapState();
    const roads = mapState.placements.filter((placement) => placement.kind === 'road');

    for (const road of roads) {
      for (const location of LUDUS_MAP_DEFINITION.locations) {
        if (!isInsideOneTileBorder(road.origin, location)) {
          continue;
        }

        if (!isEntranceRoad(road.origin, location)) {
          throw new Error(`Road ${getGridCoordKey(road.origin)} is too close to ${location.id}`);
        }
      }
    }
  });

  it('builds a cardinal route between fixed building entrances', () => {
    const mapState = createInitialLudusMapState();
    const route = findMapPath({
      definitions: getMapObjectDefinitions(),
      grid: LUDUS_MAP_DEFINITION.grid,
      mapState,
      start: getMapLocationEntrance('dormitory'),
      target: getMapLocationEntrance('trainingGround'),
    });

    expect(route.length).toBeGreaterThan(1);
    expect(route[0]).toEqual(getMapLocationEntrance('dormitory'));
    expect(route[route.length - 1]).toEqual(getMapLocationEntrance('trainingGround'));
    expectCardinalRoute(route);
  });

  it('marks walls and closed buildings as blocked while leaving roads walkable', () => {
    const mapState = createInitialLudusMapState();
    const occupancy = createMapOccupancy(mapState, getMapObjectDefinitions());

    expect(occupancy.blockedCells.has(getGridCoordKey({ column: 34, row: 35 }))).toBe(true);
    expect(occupancy.blockedCells.has(getGridCoordKey({ column: 19, row: 18 }))).toBe(true);
    expect(occupancy.blockedCells.has(getGridCoordKey({ column: 54, row: 32 }))).toBe(true);
    expect(occupancy.blockedCells.has(getGridCoordKey({ column: 36, row: 42 }))).toBe(false);
    expect(occupancy.blockedCells.has(getGridCoordKey({ column: 37, row: 42 }))).toBe(false);
    expect(occupancy.roadCells.has(getGridCoordKey({ column: 36, row: 46 }))).toBe(true);
    expect(occupancy.roadCells.has(getGridCoordKey({ column: 12, row: 33 }))).toBe(true);
    expect(occupancy.roadCells.has(getGridCoordKey({ column: 12, row: 46 }))).toBe(true);
    expect(occupancy.roadCells.has(getGridCoordKey({ column: 62, row: 25 }))).toBe(true);
  });
});
