import type {
  GridCoord,
  GridSize,
  LudusMapPlacement,
  LudusMapState,
  MapObjectFootprintDefinition,
} from './types';

export interface MapOccupancy {
  blockedCells: Set<string>;
  occupiedCells: Map<string, LudusMapPlacement>;
  roadCells: Set<string>;
}

export function getGridCoordKey(coord: GridCoord): string {
  return `${coord.column}:${coord.row}`;
}

export function isCoordInBounds(coord: GridCoord, grid: GridSize): boolean {
  return (
    coord.column >= 0 && coord.row >= 0 && coord.column < grid.columns && coord.row < grid.rows
  );
}

function getRotatedFootprint(
  placement: LudusMapPlacement,
  definition: MapObjectFootprintDefinition,
): GridSize {
  if (placement.rotation === 90 || placement.rotation === 270) {
    return {
      columns: definition.footprint.rows,
      rows: definition.footprint.columns,
    };
  }

  return definition.footprint;
}

export function getPlacementCells(
  placement: LudusMapPlacement,
  definitions: Record<string, MapObjectFootprintDefinition>,
): GridCoord[] {
  const definition = definitions[placement.definitionId];

  if (!definition) {
    return [];
  }

  const footprint = getRotatedFootprint(placement, definition);
  const cells: GridCoord[] = [];

  for (let rowOffset = 0; rowOffset < footprint.rows; rowOffset += 1) {
    for (let columnOffset = 0; columnOffset < footprint.columns; columnOffset += 1) {
      cells.push({
        column: placement.origin.column + columnOffset,
        row: placement.origin.row + rowOffset,
      });
    }
  }

  return cells;
}

export function createMapOccupancy(
  mapState: LudusMapState,
  definitions: Record<string, MapObjectFootprintDefinition>,
): MapOccupancy {
  const blockedCells = new Set<string>();
  const occupiedCells = new Map<string, LudusMapPlacement>();
  const roadCells = new Set<string>();

  for (const placement of mapState.placements) {
    const definition = definitions[placement.definitionId];

    if (!definition) {
      continue;
    }

    for (const cell of getPlacementCells(placement, definitions)) {
      const key = getGridCoordKey(cell);

      occupiedCells.set(key, placement);

      if (placement.kind === 'road') {
        roadCells.add(key);
      }

      if (definition.blocksMovement) {
        blockedCells.add(key);
      }
    }
  }

  return { blockedCells, occupiedCells, roadCells };
}
