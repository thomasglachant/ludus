import type { BuildingId } from '../domain/buildings/types';
import { LUDUS_MAP_DECORATIONS, type MapDecorationDefinition } from './decorations';
import { VISUAL_ASSET_MANIFEST } from './visual-assets';

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
export type MapTerrainZoneKind = 'sea' | 'cliff' | 'forestEdge' | 'compoundGround';
export type MapWallSegmentKind = 'wall' | 'gate' | 'brokenWall' | 'partition';

export interface MapPoint {
  x: number;
  y: number;
}

export interface MapSize {
  width: number;
  height: number;
}

export interface MapRect extends MapPoint, MapSize {}

export interface MapGridRect {
  column: number;
  row: number;
  columns: number;
  rows: number;
}

export interface MapActivitySlotDefinition extends MapPoint {
  id: string;
}

interface BaseMapLocationDefinition extends MapRect {
  nameKey: string;
  descriptionKey: string;
  style: MapLocationStyle;
  grid: MapGridRect;
  activitySlots: MapActivitySlotDefinition[];
  assetPath?: string;
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

export interface MapWallSegmentDefinition {
  id: string;
  kind: MapWallSegmentKind;
  points: MapPoint[];
  width: number;
}

export interface GladiatorMapSlotDefinition extends MapPoint {
  id: string;
  locationId: MapLocationId;
  buildingId?: BuildingId;
}

export interface LudusMapDefinition {
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
  wallSegments: MapWallSegmentDefinition[];
  locations: MapLocationDefinition[];
  paths: MapPathDefinition[];
  decorations: MapDecorationDefinition[];
  gladiatorSlots: GladiatorMapSlotDefinition[];
}

const CELL_SIZE = 75;

function gridRect(
  column: number,
  row: number,
  columns: number,
  rows: number,
): MapRect & {
  grid: MapGridRect;
} {
  return {
    x: column * CELL_SIZE,
    y: row * CELL_SIZE,
    width: columns * CELL_SIZE,
    height: rows * CELL_SIZE,
    grid: { column, row, columns, rows },
  };
}

const LUDUS_MAP_ACTION_SLOTS: Record<MapLocationId, MapActivitySlotDefinition[]> = {
  canteen: [
    { id: 'eat-table-left', x: 474, y: 405 },
    { id: 'eat-table-center', x: 600, y: 405 },
    { id: 'eat-table-right', x: 726, y: 405 },
    { id: 'hearth', x: 474, y: 504 },
    { id: 'serving-counter', x: 600, y: 504 },
    { id: 'storage', x: 726, y: 504 },
  ],
  pleasureHall: [
    { id: 'fountain', x: 1149, y: 405 },
    { id: 'music', x: 1275, y: 405 },
    { id: 'game-table', x: 1401, y: 405 },
    { id: 'bench', x: 1149, y: 504 },
    { id: 'garden', x: 1275, y: 504 },
    { id: 'lamp-alcove', x: 1401, y: 504 },
  ],
  arena: [
    { id: 'sand-center', x: 1988, y: 382 },
    { id: 'west-gate', x: 1856, y: 472 },
    { id: 'east-gate', x: 2119, y: 472 },
    { id: 'west-stands', x: 1820, y: 338 },
    { id: 'east-stands', x: 2156, y: 338 },
    { id: 'entrance', x: 1988, y: 576 },
  ],
  market: [
    { id: 'recruits', x: 249, y: 705 },
    { id: 'equipment', x: 375, y: 705 },
    { id: 'supplies', x: 501, y: 705 },
    { id: 'merchant-counter', x: 249, y: 804 },
    { id: 'coin-scale', x: 375, y: 804 },
    { id: 'cart-storage', x: 501, y: 804 },
  ],
  domus: [
    { id: 'owner-desk', x: 1016, y: 731 },
    { id: 'strategy-table', x: 1162, y: 731 },
    { id: 'treasury', x: 1310, y: 731 },
    { id: 'shrine', x: 1016, y: 855 },
    { id: 'contracts-bench', x: 1162, y: 855 },
    { id: 'courtyard-command', x: 1310, y: 855 },
  ],
  trainingGround: [
    { id: 'sword-dummy', x: 1758, y: 885 },
    { id: 'shield-post', x: 1902, y: 885 },
    { id: 'spear-target', x: 2058, y: 885 },
    { id: 'weights', x: 1800, y: 1042 },
    { id: 'sparring-circle', x: 1962, y: 1042 },
    { id: 'agility-rope', x: 2118, y: 1042 },
  ],
  dormitory: [
    { id: 'bed-1', x: 474, y: 1155 },
    { id: 'bed-2', x: 600, y: 1155 },
    { id: 'bed-3', x: 726, y: 1155 },
    { id: 'bed-4', x: 474, y: 1254 },
    { id: 'bed-5', x: 600, y: 1254 },
    { id: 'bed-6', x: 726, y: 1254 },
  ],
  infirmary: [
    { id: 'care-bed-1', x: 1149, y: 1155 },
    { id: 'care-bed-2', x: 1275, y: 1155 },
    { id: 'care-bed-3', x: 1401, y: 1155 },
    { id: 'care-bed-4', x: 1149, y: 1254 },
    { id: 'care-bed-5', x: 1275, y: 1254 },
    { id: 'care-bed-6', x: 1401, y: 1254 },
  ],
};

const GLADIATOR_SLOT_LOCATION_IDS: BuildingId[] = [
  'domus',
  'canteen',
  'dormitory',
  'trainingGround',
  'pleasureHall',
  'infirmary',
];

function actionSlots(locationId: MapLocationId): MapActivitySlotDefinition[] {
  return LUDUS_MAP_ACTION_SLOTS[locationId];
}

function gladiatorSlots(): GladiatorMapSlotDefinition[] {
  return GLADIATOR_SLOT_LOCATION_IDS.flatMap((buildingId) =>
    LUDUS_MAP_ACTION_SLOTS[buildingId].map((slot) => ({
      id: `${buildingId}-${slot.id}`,
      buildingId,
      locationId: buildingId,
      x: slot.x,
      y: slot.y,
    })),
  );
}

export const LUDUS_MAP_DEFINITION: LudusMapDefinition = {
  size: {
    width: 2400,
    height: 1500,
  },
  grid: {
    columns: 32,
    rows: 20,
    cellSize: CELL_SIZE,
  },
  contentOffset: {
    x: 0,
    y: 0,
  },
  ludusBounds: {
    x: 150,
    y: 225,
    width: 2100,
    height: 1200,
  },
  defaultCamera: {
    x: 0,
    y: 0,
  },
  defaultZoom: 0.75,
  minZoom: 0.56,
  maxZoom: 1.45,
  zoomPresets: [0.56, 0.75, 1, 1.25, 1.45],
  terrainZones: [
    { id: 'sea-sky', kind: 'sea', ...gridRect(0, 0, 32, 2) },
    { id: 'rocky-cliff', kind: 'cliff', ...gridRect(0, 2, 32, 2) },
    { id: 'west-forest-edge', kind: 'forestEdge', ...gridRect(0, 3, 2, 17) },
    { id: 'east-forest-edge', kind: 'forestEdge', ...gridRect(30, 3, 2, 17) },
    { id: 'bottom-forest-edge', kind: 'forestEdge', ...gridRect(0, 19, 32, 1) },
    { id: 'main-ludus-compound', kind: 'compoundGround', ...gridRect(2, 3, 28, 16) },
  ],
  wallSegments: [
    {
      id: 'north-west-wall',
      kind: 'brokenWall',
      width: 18,
      points: [
        { x: 210, y: 270 },
        { x: 570, y: 252 },
        { x: 820, y: 276 },
      ],
    },
    {
      id: 'north-center-overlook',
      kind: 'gate',
      width: 22,
      points: [
        { x: 940, y: 258 },
        { x: 1125, y: 245 },
      ],
    },
    {
      id: 'north-east-wall',
      kind: 'brokenWall',
      width: 18,
      points: [
        { x: 1280, y: 268 },
        { x: 1620, y: 246 },
        { x: 2145, y: 284 },
      ],
    },
    {
      id: 'west-market-gate',
      kind: 'gate',
      width: 22,
      points: [
        { x: 150, y: 690 },
        { x: 150, y: 830 },
      ],
    },
    {
      id: 'west-lower-wall',
      kind: 'wall',
      width: 18,
      points: [
        { x: 172, y: 900 },
        { x: 190, y: 1270 },
      ],
    },
    {
      id: 'east-arena-gate',
      kind: 'gate',
      width: 22,
      points: [
        { x: 2240, y: 670 },
        { x: 2248, y: 815 },
      ],
    },
    {
      id: 'east-training-wall',
      kind: 'wall',
      width: 18,
      points: [
        { x: 2235, y: 910 },
        { x: 2205, y: 1210 },
      ],
    },
    {
      id: 'south-service-gate',
      kind: 'gate',
      width: 22,
      points: [
        { x: 900, y: 1402 },
        { x: 1190, y: 1406 },
      ],
    },
    {
      id: 'south-east-wall',
      kind: 'brokenWall',
      width: 18,
      points: [
        { x: 1390, y: 1390 },
        { x: 1900, y: 1415 },
        { x: 2210, y: 1360 },
      ],
    },
    {
      id: 'market-domus-partition',
      kind: 'partition',
      width: 12,
      points: [
        { x: 705, y: 640 },
        { x: 795, y: 805 },
        { x: 780, y: 960 },
      ],
    },
    {
      id: 'domus-training-partition',
      kind: 'partition',
      width: 12,
      points: [
        { x: 1550, y: 690 },
        { x: 1598, y: 870 },
        { x: 1565, y: 1110 },
      ],
    },
    {
      id: 'south-quarters-partition',
      kind: 'partition',
      width: 12,
      points: [
        { x: 820, y: 1045 },
        { x: 960, y: 1125 },
        { x: 1035, y: 1320 },
      ],
    },
  ],
  locations: [
    {
      id: 'canteen',
      kind: 'building',
      nameKey: 'buildings.canteen.name',
      descriptionKey: 'buildings.canteen.description',
      style: 'canteen',
      ...gridRect(5, 4, 6, 4),
      activitySlots: actionSlots('canteen'),
    },
    {
      id: 'pleasureHall',
      kind: 'building',
      nameKey: 'buildings.pleasureHall.name',
      descriptionKey: 'buildings.pleasureHall.description',
      style: 'pleasureHall',
      ...gridRect(14, 4, 6, 4),
      activitySlots: actionSlots('pleasureHall'),
    },
    {
      id: 'arena',
      kind: 'external',
      nameKey: 'map.locations.arena.name',
      descriptionKey: 'map.locations.arena.description',
      style: 'arena',
      assetPath: VISUAL_ASSET_MANIFEST.locations.arena.exterior,
      ...gridRect(23, 3, 7, 6),
      activitySlots: actionSlots('arena'),
    },
    {
      id: 'market',
      kind: 'external',
      nameKey: 'map.locations.market.name',
      descriptionKey: 'map.locations.market.description',
      style: 'market',
      assetPath: VISUAL_ASSET_MANIFEST.locations.market.exterior,
      ...gridRect(2, 8, 6, 4),
      activitySlots: actionSlots('market'),
    },
    {
      id: 'domus',
      kind: 'building',
      nameKey: 'buildings.domus.name',
      descriptionKey: 'buildings.domus.description',
      style: 'domus',
      ...gridRect(12, 8, 7, 5),
      activitySlots: actionSlots('domus'),
    },
    {
      id: 'trainingGround',
      kind: 'building',
      nameKey: 'buildings.trainingGround.name',
      descriptionKey: 'buildings.trainingGround.description',
      style: 'trainingGround',
      ...gridRect(22, 10, 8, 6),
      activitySlots: actionSlots('trainingGround'),
    },
    {
      id: 'dormitory',
      kind: 'building',
      nameKey: 'buildings.dormitory.name',
      descriptionKey: 'buildings.dormitory.description',
      style: 'dormitory',
      ...gridRect(5, 14, 6, 4),
      activitySlots: actionSlots('dormitory'),
    },
    {
      id: 'infirmary',
      kind: 'building',
      nameKey: 'buildings.infirmary.name',
      descriptionKey: 'buildings.infirmary.description',
      style: 'infirmary',
      ...gridRect(14, 14, 6, 4),
      activitySlots: actionSlots('infirmary'),
    },
  ],
  paths: [
    {
      id: 'north-gate-domus',
      kind: 'internal',
      width: 132,
      points: [
        { x: 1110, y: 285 },
        { x: 1120, y: 430 },
        { x: 1168, y: 600 },
      ],
    },
    {
      id: 'domus-south-west-split',
      kind: 'internal',
      width: 112,
      points: [
        { x: 1070, y: 940 },
        { x: 900, y: 1080 },
        { x: 745, y: 1220 },
        { x: 620, y: 1390 },
      ],
    },
    {
      id: 'domus-south-east-split',
      kind: 'internal',
      width: 112,
      points: [
        { x: 1310, y: 940 },
        { x: 1420, y: 1070 },
        { x: 1420, y: 1215 },
        { x: 1320, y: 1390 },
      ],
    },
    {
      id: 'market-domus-road',
      kind: 'external',
      width: 128,
      points: [
        { x: 160, y: 760 },
        { x: 410, y: 760 },
        { x: 700, y: 790 },
        { x: 900, y: 785 },
      ],
    },
    {
      id: 'domus-training-road',
      kind: 'internal',
      width: 118,
      points: [
        { x: 1425, y: 820 },
        { x: 1580, y: 870 },
        { x: 1695, y: 940 },
      ],
    },
    {
      id: 'domus-arena-road',
      kind: 'external',
      width: 104,
      points: [
        { x: 1425, y: 720 },
        { x: 1660, y: 600 },
        { x: 1820, y: 520 },
      ],
    },
    {
      id: 'domus-canteen-path',
      kind: 'internal',
      width: 74,
      points: [
        { x: 980, y: 650 },
        { x: 790, y: 540 },
        { x: 600, y: 520 },
      ],
    },
    {
      id: 'domus-pleasure-path',
      kind: 'internal',
      width: 74,
      points: [
        { x: 1290, y: 630 },
        { x: 1355, y: 535 },
        { x: 1430, y: 505 },
      ],
    },
    {
      id: 'domus-dormitory-path',
      kind: 'internal',
      width: 78,
      points: [
        { x: 965, y: 940 },
        { x: 790, y: 1085 },
        { x: 620, y: 1195 },
      ],
    },
    {
      id: 'domus-infirmary-path',
      kind: 'internal',
      width: 78,
      points: [
        { x: 1255, y: 960 },
        { x: 1265, y: 1080 },
        { x: 1275, y: 1195 },
      ],
    },
  ],
  decorations: LUDUS_MAP_DECORATIONS,
  gladiatorSlots: gladiatorSlots(),
};

export function getMapLocation(locationId: MapLocationId) {
  return LUDUS_MAP_DEFINITION.locations.find((location) => location.id === locationId);
}
