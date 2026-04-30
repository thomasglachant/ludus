import type { BuildingId } from '../domain/buildings/types';
import type {
  GridCoord,
  GridSize,
  LudusMapPlacement,
  LudusMapState,
  MapGroundId,
  MapObjectFootprintDefinition,
  MapTerrainId,
} from '../domain/map/types';
import { getGridCoordKey } from '../domain/map/occupancy';
import type { MapDecorationDefinition } from './decorations';

export type MapExternalLocationId = 'market' | 'arena';
export type MapLocationId = BuildingId | MapExternalLocationId;
export type MapLocationStyle =
  | 'domus'
  | 'canteen'
  | 'dormitory'
  | 'trainingGround'
  | 'pleasureHall'
  | 'infirmary'
  | 'market'
  | 'arena';
export type MapTerrainZoneKind = 'compoundGround' | 'countryside';

export interface MapPoint {
  x: number;
  y: number;
}

export interface MapSize {
  width: number;
  height: number;
}

export interface MapRect extends MapPoint, MapSize {}

export interface MapGridRect extends GridSize {
  column: number;
  row: number;
}

export interface MapActivitySlotDefinition extends MapPoint {
  id: string;
  coord: GridCoord;
}

interface BaseMapLocationDefinition extends MapRect {
  nameKey: string;
  descriptionKey: string;
  style: MapLocationStyle;
  grid: MapGridRect;
  entrance: GridCoord;
  activitySlots: MapActivitySlotDefinition[];
}

export interface BuildingMapLocationDefinition extends BaseMapLocationDefinition {
  id: BuildingId;
  kind: 'building';
}

export interface ExternalMapLocationDefinition extends BaseMapLocationDefinition {
  id: MapExternalLocationId;
  kind: 'external';
}

export type MapLocationDefinition = BuildingMapLocationDefinition | ExternalMapLocationDefinition;

export interface MapPathDefinition {
  id: string;
  kind: 'internal' | 'external';
  width: number;
  points: MapPoint[];
}

export interface MapTerrainZoneDefinition extends MapRect {
  id: string;
  kind: MapTerrainZoneKind;
  grid: MapGridRect;
}

export interface GladiatorMapSlotDefinition extends MapPoint {
  id: string;
  locationId: MapLocationId;
  buildingId?: BuildingId;
  coord: GridCoord;
}

export interface LudusMapTileDefinition extends MapRect {
  id: string;
  coord: GridCoord;
  terrainId: MapTerrainId;
  groundId?: MapGroundId;
}

export interface LudusMapDefinition {
  id: string;
  size: MapSize;
  grid: {
    columns: number;
    rows: number;
    cellSize: number;
  };
  contentOffset: MapPoint;
  ludusBounds: MapRect;
  defaultCamera: MapPoint;
  defaultZoom: number;
  minZoom: number;
  maxZoom: number;
  zoomPresets: number[];
  terrainZones: MapTerrainZoneDefinition[];
  locations: MapLocationDefinition[];
  paths: MapPathDefinition[];
  decorations: MapDecorationDefinition[];
  gladiatorSlots: GladiatorMapSlotDefinition[];
  objectDefinitions: Record<string, MapObjectFootprintDefinition>;
  initialPlacements: LudusMapPlacement[];
}

export const LUDUS_MAP_STATE_SCHEMA_VERSION = 1;

const CELL_SIZE = 48;
const CONTENT_MARGIN_CELLS = 10;
const GRID_COLUMNS = 76;
const GRID_ROWS = 58;

const COMPOUND_GRID_RECT: MapGridRect = {
  column: 9 + CONTENT_MARGIN_CELLS,
  row: 5 + CONTENT_MARGIN_CELLS,
  columns: 36,
  rows: 28,
};

interface LocationGridSpec {
  kind: MapLocationDefinition['kind'];
  nameKey: string;
  descriptionKey: string;
  style: MapLocationStyle;
  grid: MapGridRect;
  entrance: GridCoord;
  activitySlots: Record<string, GridCoord>;
  blocksMovement: boolean;
}

function gridRect(column: number, row: number, columns: number, rows: number): MapGridRect {
  return { column, row, columns, rows };
}

function offsetGridCoord(coord: GridCoord): GridCoord {
  return {
    column: coord.column + CONTENT_MARGIN_CELLS,
    row: coord.row + CONTENT_MARGIN_CELLS,
  };
}

function offsetGridRect(rect: MapGridRect): MapGridRect {
  return {
    ...rect,
    column: rect.column + CONTENT_MARGIN_CELLS,
    row: rect.row + CONTENT_MARGIN_CELLS,
  };
}

function cellToWorldPoint(coord: GridCoord): MapPoint {
  return {
    x: coord.column * CELL_SIZE,
    y: coord.row * CELL_SIZE,
  };
}

export function cellToWorldCenter(coord: GridCoord): MapPoint {
  return {
    x: coord.column * CELL_SIZE + CELL_SIZE / 2,
    y: coord.row * CELL_SIZE + CELL_SIZE / 2,
  };
}

function gridRectToWorldRect(rect: MapGridRect): MapRect {
  const point = cellToWorldPoint(rect);

  return {
    ...point,
    width: rect.columns * CELL_SIZE,
    height: rect.rows * CELL_SIZE,
  };
}

function createActivitySlots(slots: Record<string, GridCoord>): MapActivitySlotDefinition[] {
  return Object.entries(slots).map(([id, coord]) => ({
    id,
    coord: offsetGridCoord(coord),
    ...cellToWorldCenter(offsetGridCoord(coord)),
  }));
}

const LOCATION_GRID_SPECS: Record<MapLocationId, LocationGridSpec> = {
  canteen: {
    kind: 'building',
    nameKey: 'buildings.canteen.name',
    descriptionKey: 'buildings.canteen.description',
    style: 'canteen',
    grid: gridRect(13, 12, 5, 4),
    entrance: { column: 15, row: 16 },
    activitySlots: {
      'table-left': { column: 14, row: 13 },
      'table-center': { column: 15, row: 13 },
      'table-right': { column: 16, row: 13 },
      hearth: { column: 15, row: 14 },
    },
    blocksMovement: true,
  },
  pleasureHall: {
    kind: 'building',
    nameKey: 'buildings.pleasureHall.name',
    descriptionKey: 'buildings.pleasureHall.description',
    style: 'pleasureHall',
    grid: gridRect(36, 12, 5, 4),
    entrance: { column: 38, row: 16 },
    activitySlots: {
      fountain: { column: 37, row: 13 },
      music: { column: 38, row: 13 },
      'game-table': { column: 39, row: 13 },
      garden: { column: 38, row: 14 },
    },
    blocksMovement: true,
  },
  arena: {
    kind: 'external',
    nameKey: 'map.locations.arena.name',
    descriptionKey: 'map.locations.arena.description',
    style: 'arena',
    grid: gridRect(48, 8, 8, 7),
    entrance: { column: 52, row: 15 },
    activitySlots: {
      'west-gate': { column: 50, row: 13 },
      'arena-center': { column: 52, row: 11 },
      'east-stands': { column: 54, row: 11 },
      entrance: { column: 52, row: 13 },
    },
    blocksMovement: true,
  },
  market: {
    kind: 'external',
    nameKey: 'map.locations.market.name',
    descriptionKey: 'map.locations.market.description',
    style: 'market',
    grid: gridRect(0, 18, 5, 4),
    entrance: { column: 2, row: 22 },
    activitySlots: {
      recruits: { column: 1, row: 19 },
      stall: { column: 2, row: 20 },
      supplies: { column: 3, row: 19 },
    },
    blocksMovement: true,
  },
  domus: {
    kind: 'building',
    nameKey: 'buildings.domus.name',
    descriptionKey: 'buildings.domus.description',
    style: 'domus',
    grid: gridRect(24, 22, 6, 5),
    entrance: { column: 27, row: 27 },
    activitySlots: {
      'owner-desk': { column: 25, row: 24 },
      ledger: { column: 27, row: 24 },
      treasury: { column: 28, row: 24 },
      shrine: { column: 27, row: 25 },
    },
    blocksMovement: true,
  },
  trainingGround: {
    kind: 'building',
    nameKey: 'buildings.trainingGround.name',
    descriptionKey: 'buildings.trainingGround.description',
    style: 'trainingGround',
    grid: gridRect(24, 7, 8, 6),
    entrance: { column: 28, row: 13 },
    activitySlots: {
      'striking-post': { column: 25, row: 9 },
      'guard-post': { column: 27, row: 9 },
      'footwork-ring': { column: 29, row: 9 },
      weights: { column: 25, row: 11 },
      'sparring-circle': { column: 27, row: 11 },
      'agility-rope': { column: 29, row: 11 },
    },
    blocksMovement: false,
  },
  dormitory: {
    kind: 'building',
    nameKey: 'buildings.dormitory.name',
    descriptionKey: 'buildings.dormitory.description',
    style: 'dormitory',
    grid: gridRect(13, 20, 5, 4),
    entrance: { column: 15, row: 24 },
    activitySlots: {
      'bed-1': { column: 14, row: 21 },
      'bed-2': { column: 15, row: 21 },
      'bed-3': { column: 16, row: 21 },
      'bed-4': { column: 15, row: 22 },
    },
    blocksMovement: true,
  },
  infirmary: {
    kind: 'building',
    nameKey: 'buildings.infirmary.name',
    descriptionKey: 'buildings.infirmary.description',
    style: 'infirmary',
    grid: gridRect(36, 21, 4, 4),
    entrance: { column: 38, row: 25 },
    activitySlots: {
      'care-bed-1': { column: 37, row: 22 },
      'care-bed-2': { column: 38, row: 22 },
      'care-bed-3': { column: 37, row: 23 },
      'medicine-table': { column: 38, row: 23 },
    },
    blocksMovement: true,
  },
};

function createLocation(id: MapLocationId): MapLocationDefinition {
  const spec = LOCATION_GRID_SPECS[id];
  const grid = offsetGridRect(spec.grid);
  const worldRect = gridRectToWorldRect(grid);
  const base = {
    id,
    nameKey: spec.nameKey,
    descriptionKey: spec.descriptionKey,
    style: spec.style,
    grid,
    entrance: offsetGridCoord(spec.entrance),
    activitySlots: createActivitySlots(spec.activitySlots),
    ...worldRect,
  };

  return spec.kind === 'building'
    ? ({ ...base, kind: 'building' } as BuildingMapLocationDefinition)
    : ({ ...base, kind: 'external' } as ExternalMapLocationDefinition);
}

const LOCATION_IDS: MapLocationId[] = [
  'canteen',
  'pleasureHall',
  'arena',
  'market',
  'domus',
  'trainingGround',
  'dormitory',
  'infirmary',
];

function createBuildingObjectDefinitions(): Record<MapLocationId, MapObjectFootprintDefinition> {
  return Object.fromEntries(
    LOCATION_IDS.map((locationId) => {
      const spec = LOCATION_GRID_SPECS[locationId];

      return [
        locationId,
        {
          id: locationId,
          kind: 'building',
          footprint: {
            columns: spec.grid.columns,
            rows: spec.grid.rows,
          },
          blocksMovement: spec.blocksMovement,
        } satisfies MapObjectFootprintDefinition,
      ];
    }),
  ) as Record<MapLocationId, MapObjectFootprintDefinition>;
}

function createLocationPlacements(): LudusMapPlacement[] {
  return LOCATION_IDS.map((locationId) => ({
    id: `location-${locationId}`,
    kind: 'building',
    definitionId: locationId,
    origin: {
      column: LOCATION_GRID_SPECS[locationId].grid.column + CONTENT_MARGIN_CELLS,
      row: LOCATION_GRID_SPECS[locationId].grid.row + CONTENT_MARGIN_CELLS,
    },
  }));
}

interface RoadPathDefinition {
  points: GridCoord[];
}

function addRoadCell(cells: Map<string, GridCoord>, coord: GridCoord): void {
  const offsetCoord = offsetGridCoord(coord);

  cells.set(getGridCoordKey(offsetCoord), offsetCoord);
}

function addRoadPath(cells: Map<string, GridCoord>, path: RoadPathDefinition): void {
  if (path.points.length === 1) {
    addRoadCell(cells, path.points[0]);
  }

  for (let pointIndex = 1; pointIndex < path.points.length; pointIndex += 1) {
    const start = path.points[pointIndex - 1];
    const end = path.points[pointIndex];
    const segmentPoints =
      start.column !== end.column && start.row !== end.row
        ? [start, { column: end.column, row: start.row }, end]
        : [start, end];

    for (let segmentIndex = 1; segmentIndex < segmentPoints.length; segmentIndex += 1) {
      const segmentStart = segmentPoints[segmentIndex - 1];
      const segmentEnd = segmentPoints[segmentIndex];
      const columnStep = Math.sign(segmentEnd.column - segmentStart.column);
      const rowStep = Math.sign(segmentEnd.row - segmentStart.row);
      let current = { ...segmentStart };

      while (current.column !== segmentEnd.column || current.row !== segmentEnd.row) {
        addRoadCell(cells, current);
        current = {
          column: current.column + columnStep,
          row: current.row + rowStep,
        };
      }

      addRoadCell(cells, segmentEnd);
    }
  }
}

function addEntranceApproachCells(cells: Map<string, GridCoord>): void {
  for (const locationId of LOCATION_IDS) {
    const entrance = LOCATION_GRID_SPECS[locationId].entrance;

    addRoadCell(cells, entrance);
    addRoadCell(cells, {
      column: entrance.column,
      row: entrance.row + 1,
    });
  }
}

function createRoadPlacements(paths: RoadPathDefinition[]): LudusMapPlacement[] {
  const cells = new Map<string, GridCoord>();

  for (const path of paths) {
    addRoadPath(cells, path);
  }

  addEntranceApproachCells(cells);

  return Array.from(cells.values())
    .sort((left, right) => left.row - right.row || left.column - right.column)
    .map((coord) => ({
      id: `road-${coord.column}-${coord.row}`,
      kind: 'road',
      definitionId: 'packedRoad',
      origin: coord,
    }));
}

function createWallPlacements(): LudusMapPlacement[] {
  const cells: GridCoord[] = [];
  const left = COMPOUND_GRID_RECT.column;
  const right = COMPOUND_GRID_RECT.column + COMPOUND_GRID_RECT.columns - 1;
  const top = COMPOUND_GRID_RECT.row;
  const bottom = COMPOUND_GRID_RECT.row + COMPOUND_GRID_RECT.rows - 1;
  const gateKeys = new Set(
    [
      { column: 26 + CONTENT_MARGIN_CELLS, row: bottom },
      { column: 27 + CONTENT_MARGIN_CELLS, row: bottom },
    ].map(getGridCoordKey),
  );

  for (let column = left; column <= right; column += 1) {
    cells.push({ column, row: top }, { column, row: bottom });
  }

  for (let row = top + 1; row < bottom; row += 1) {
    cells.push({ column: left, row }, { column: right, row });
  }

  return cells
    .filter((coord) => !gateKeys.has(getGridCoordKey(coord)))
    .map((coord) => ({
      id: `wall-${coord.column}-${coord.row}`,
      kind: 'wall',
      definitionId: 'stoneWall',
      origin: coord,
    }));
}

function createInitialPlacements(): LudusMapPlacement[] {
  const roads = createRoadPlacements([
    {
      points: [
        { column: 26, row: GRID_ROWS - CONTENT_MARGIN_CELLS - 1 },
        { column: 26, row: 30 },
      ],
    },
    {
      points: [
        { column: 27, row: GRID_ROWS - CONTENT_MARGIN_CELLS - 1 },
        { column: 27, row: 28 },
      ],
    },
    {
      points: [
        { column: 22, row: 30 },
        { column: 33, row: 30 },
      ],
    },
    {
      points: [
        { column: 22, row: 14 },
        { column: 22, row: 30 },
      ],
    },
    {
      points: [
        { column: 33, row: 14 },
        { column: 33, row: 30 },
      ],
    },
    {
      points: [
        { column: 15, row: 17 },
        { column: 22, row: 17 },
      ],
    },
    {
      points: [
        { column: 33, row: 17 },
        { column: 38, row: 17 },
      ],
    },
    {
      points: [
        { column: 15, row: 25 },
        { column: 22, row: 25 },
      ],
    },
    {
      points: [
        { column: 33, row: 26 },
        { column: 38, row: 26 },
      ],
    },
    {
      points: [
        { column: 2, row: 23 },
        { column: 2, row: 36 },
        { column: 27, row: 36 },
      ],
    },
    {
      points: [
        { column: 27, row: 36 },
        { column: 52, row: 36 },
        { column: 52, row: 16 },
      ],
    },
    {
      points: [
        { column: 22, row: 14 },
        { column: 33, row: 14 },
      ],
    },
  ]);

  return [...roads, ...createWallPlacements(), ...createLocationPlacements()];
}

function createGladiatorSlots(locations: MapLocationDefinition[]): GladiatorMapSlotDefinition[] {
  return locations.flatMap((location) =>
    location.activitySlots.map((slot) => ({
      id: `${location.id}-${slot.id}`,
      buildingId: location.kind === 'building' ? location.id : undefined,
      locationId: location.id,
      coord: slot.coord,
      x: slot.x,
      y: slot.y,
    })),
  );
}

function isCoordInsideGridRect(coord: GridCoord, rect: MapGridRect): boolean {
  return (
    coord.column >= rect.column &&
    coord.row >= rect.row &&
    coord.column < rect.column + rect.columns &&
    coord.row < rect.row + rect.rows
  );
}

function getDefaultTerrainId(coord: GridCoord): MapTerrainId {
  if (isCoordInsideGridRect(coord, COMPOUND_GRID_RECT)) {
    return 'compoundDirt';
  }

  return 'grass';
}

function getDefaultGroundId(coord: GridCoord): MapGroundId | undefined {
  return isCoordInsideGridRect(coord, COMPOUND_GRID_RECT) ? 'courtyard' : undefined;
}

function createTerrainZones(): MapTerrainZoneDefinition[] {
  const outerCountrysideGrid = gridRect(0, 0, GRID_COLUMNS, GRID_ROWS);

  return [
    {
      id: 'outer-countryside',
      kind: 'countryside',
      grid: outerCountrysideGrid,
      ...gridRectToWorldRect(outerCountrysideGrid),
    },
    {
      id: 'ludus-compound',
      kind: 'compoundGround',
      grid: COMPOUND_GRID_RECT,
      ...gridRectToWorldRect(COMPOUND_GRID_RECT),
    },
  ];
}

const locations = LOCATION_IDS.map(createLocation);
const initialPlacements = createInitialPlacements();
const objectDefinitions: Record<string, MapObjectFootprintDefinition> = {
  ...createBuildingObjectDefinitions(),
  packedRoad: {
    id: 'packedRoad',
    kind: 'road',
    footprint: { columns: 1, rows: 1 },
    blocksMovement: false,
    movementCost: 1,
  },
  stoneWall: {
    id: 'stoneWall',
    kind: 'wall',
    footprint: { columns: 1, rows: 1 },
    blocksMovement: true,
  },
};

export const LUDUS_MAP_DEFINITION: LudusMapDefinition = {
  id: 'default-ludus-grid',
  size: {
    width: GRID_COLUMNS * CELL_SIZE,
    height: GRID_ROWS * CELL_SIZE,
  },
  grid: {
    columns: GRID_COLUMNS,
    rows: GRID_ROWS,
    cellSize: CELL_SIZE,
  },
  contentOffset: { x: 0, y: 0 },
  ludusBounds: gridRectToWorldRect(COMPOUND_GRID_RECT),
  defaultCamera: { x: 0, y: 0 },
  defaultZoom: 0.5,
  minZoom: 0.35,
  maxZoom: 1.5,
  zoomPresets: [0.35, 0.5, 0.75, 1, 1.25, 1.5],
  terrainZones: createTerrainZones(),
  locations,
  paths: [],
  decorations: [],
  gladiatorSlots: createGladiatorSlots(locations),
  objectDefinitions,
  initialPlacements,
};

export function createInitialLudusMapState(): LudusMapState {
  return {
    schemaVersion: LUDUS_MAP_STATE_SCHEMA_VERSION,
    gridId: LUDUS_MAP_DEFINITION.id,
    placements: LUDUS_MAP_DEFINITION.initialPlacements.map((placement) => ({
      ...placement,
      origin: { ...placement.origin },
    })),
    editedTiles: [],
  };
}

export function getLudusMapTiles(mapState: LudusMapState): LudusMapTileDefinition[] {
  const roadKeys = new Set(
    mapState.placements
      .filter((placement) => placement.kind === 'road')
      .map((placement) => getGridCoordKey(placement.origin)),
  );
  const tileOverrides = new Map(
    mapState.editedTiles.map((override) => [getGridCoordKey(override.coord), override]),
  );
  const tiles: LudusMapTileDefinition[] = [];

  for (let row = 0; row < LUDUS_MAP_DEFINITION.grid.rows; row += 1) {
    for (let column = 0; column < LUDUS_MAP_DEFINITION.grid.columns; column += 1) {
      const coord = { column, row };
      const override = tileOverrides.get(getGridCoordKey(coord));
      const terrainId = override?.terrainId ?? getDefaultTerrainId(coord);
      const groundId =
        override?.groundId ??
        (roadKeys.has(getGridCoordKey(coord)) ? 'packedRoad' : getDefaultGroundId(coord));

      tiles.push({
        id: `tile-${column}-${row}`,
        coord,
        terrainId,
        groundId,
        ...gridRectToWorldRect({ column, row, columns: 1, rows: 1 }),
      });
    }
  }

  return tiles;
}

export function getMapLocation(locationId: MapLocationId) {
  return LUDUS_MAP_DEFINITION.locations.find((location) => location.id === locationId);
}

export function getMapLocationEntrance(locationId: MapLocationId): GridCoord {
  return offsetGridCoord(LOCATION_GRID_SPECS[locationId].entrance);
}

export function getMapObjectDefinitions(): Record<string, MapObjectFootprintDefinition> {
  return LUDUS_MAP_DEFINITION.objectDefinitions;
}
