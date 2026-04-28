import {
  createMapOccupancy,
  getGridCoordKey,
  isCoordInBounds,
  type MapOccupancy,
} from './occupancy';
import type { GridCoord, GridSize, LudusMapState, MapObjectFootprintDefinition } from './types';

export interface FindMapPathInput {
  definitions: Record<string, MapObjectFootprintDefinition>;
  grid: GridSize;
  mapState: LudusMapState;
  start: GridCoord;
  target: GridCoord;
}

interface QueuedCoord {
  coord: GridCoord;
  cost: number;
}

const CARDINAL_DIRECTIONS: GridCoord[] = [
  { column: 1, row: 0 },
  { column: -1, row: 0 },
  { column: 0, row: 1 },
  { column: 0, row: -1 },
];

function getNeighborCoords(coord: GridCoord): GridCoord[] {
  return CARDINAL_DIRECTIONS.map((direction) => ({
    column: coord.column + direction.column,
    row: coord.row + direction.row,
  }));
}

function getMovementCost(coord: GridCoord, occupancy: MapOccupancy): number {
  return occupancy.roadCells.has(getGridCoordKey(coord)) ? 1 : 2;
}

function reconstructPath(
  cameFrom: Map<string, string>,
  coordByKey: Map<string, GridCoord>,
  targetKey: string,
): GridCoord[] {
  const path: GridCoord[] = [];
  let currentKey: string | undefined = targetKey;

  while (currentKey) {
    const coord = coordByKey.get(currentKey);

    if (coord) {
      path.push(coord);
    }

    currentKey = cameFrom.get(currentKey);
  }

  return path.reverse();
}

export function findMapPath(input: FindMapPathInput): GridCoord[] {
  const startKey = getGridCoordKey(input.start);
  const targetKey = getGridCoordKey(input.target);

  if (startKey === targetKey) {
    return [input.start];
  }

  const occupancy = createMapOccupancy(input.mapState, input.definitions);
  const frontier: QueuedCoord[] = [{ coord: input.start, cost: 0 }];
  const cameFrom = new Map<string, string>();
  const coordByKey = new Map<string, GridCoord>([[startKey, input.start]]);
  const costByKey = new Map<string, number>([[startKey, 0]]);
  const passableBlockedCells = new Set([startKey, targetKey]);

  while (frontier.length > 0) {
    frontier.sort((left, right) => left.cost - right.cost);
    const current = frontier.shift();

    if (!current) {
      break;
    }

    const currentKey = getGridCoordKey(current.coord);

    if (currentKey === targetKey) {
      return reconstructPath(cameFrom, coordByKey, targetKey);
    }

    for (const neighbor of getNeighborCoords(current.coord)) {
      const neighborKey = getGridCoordKey(neighbor);

      if (!isCoordInBounds(neighbor, input.grid)) {
        continue;
      }

      if (occupancy.blockedCells.has(neighborKey) && !passableBlockedCells.has(neighborKey)) {
        continue;
      }

      const nextCost = current.cost + getMovementCost(neighbor, occupancy);
      const previousCost = costByKey.get(neighborKey);

      if (previousCost !== undefined && previousCost <= nextCost) {
        continue;
      }

      costByKey.set(neighborKey, nextCost);
      cameFrom.set(neighborKey, currentKey);
      coordByKey.set(neighborKey, neighbor);
      frontier.push({ coord: neighbor, cost: nextCost });
    }
  }

  return [];
}
