export interface GridCoord {
  column: number;
  row: number;
}

export interface GridSize {
  columns: number;
  rows: number;
}

export type MapRotation = 0 | 90 | 180 | 270;

export type MapTerrainId = 'compoundDirt' | 'grass' | 'rock';

export type MapGroundId = 'courtyard' | 'packedRoad';

export type MapPlacementKind = 'building' | 'prop' | 'road' | 'wall';

export interface LudusMapTileOverride {
  coord: GridCoord;
  groundId?: MapGroundId;
  terrainId?: MapTerrainId;
}

export interface LudusMapPlacement {
  id: string;
  kind: MapPlacementKind;
  definitionId: string;
  origin: GridCoord;
  rotation?: MapRotation;
}

export interface LudusMapState {
  schemaVersion: number;
  gridId: string;
  placements: LudusMapPlacement[];
  editedTiles: LudusMapTileOverride[];
}

export interface MapObjectFootprintDefinition {
  id: string;
  kind: MapPlacementKind;
  footprint: GridSize;
  blocksMovement: boolean;
  movementCost?: number;
}
