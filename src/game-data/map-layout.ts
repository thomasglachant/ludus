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

export interface MapPoint {
  x: number;
  y: number;
}

export interface MapSize {
  width: number;
  height: number;
}

export interface MapRect extends MapPoint, MapSize {}

interface BaseMapLocationDefinition extends MapRect {
  nameKey: string;
  descriptionKey: string;
  style: MapLocationStyle;
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
  points: MapPoint[];
}

export interface GladiatorMapSlotDefinition extends MapPoint {
  id: string;
  buildingId: BuildingId;
}

export interface LudusMapDefinition {
  size: MapSize;
  ludusBounds: MapRect;
  defaultCamera: MapPoint;
  defaultZoom: number;
  minZoom: number;
  maxZoom: number;
  zoomPresets: number[];
  locations: MapLocationDefinition[];
  paths: MapPathDefinition[];
  decorations: MapDecorationDefinition[];
  gladiatorSlots: GladiatorMapSlotDefinition[];
}

export const LUDUS_MAP_DEFINITION: LudusMapDefinition = {
  size: {
    width: 2400,
    height: 1500,
  },
  ludusBounds: {
    x: 520,
    y: 300,
    width: 1220,
    height: 890,
  },
  defaultCamera: {
    x: -520,
    y: -260,
  },
  defaultZoom: 0.75,
  minZoom: 0.5,
  maxZoom: 1.5,
  zoomPresets: [0.5, 0.75, 1, 1.25, 1.5],
  locations: [
    {
      id: 'domus',
      kind: 'building',
      nameKey: 'buildings.domus.name',
      descriptionKey: 'buildings.domus.description',
      style: 'domus',
      x: 1040,
      y: 610,
      width: 280,
      height: 190,
    },
    {
      id: 'canteen',
      kind: 'building',
      nameKey: 'buildings.canteen.name',
      descriptionKey: 'buildings.canteen.description',
      style: 'canteen',
      x: 700,
      y: 520,
      width: 230,
      height: 160,
    },
    {
      id: 'dormitory',
      kind: 'building',
      nameKey: 'buildings.dormitory.name',
      descriptionKey: 'buildings.dormitory.description',
      style: 'dormitory',
      x: 680,
      y: 850,
      width: 250,
      height: 170,
    },
    {
      id: 'trainingGround',
      kind: 'building',
      nameKey: 'buildings.trainingGround.name',
      descriptionKey: 'buildings.trainingGround.description',
      style: 'trainingGround',
      x: 1340,
      y: 880,
      width: 300,
      height: 210,
    },
    {
      id: 'pleasureHall',
      kind: 'building',
      nameKey: 'buildings.pleasureHall.name',
      descriptionKey: 'buildings.pleasureHall.description',
      style: 'pleasureHall',
      x: 1390,
      y: 510,
      width: 250,
      height: 170,
    },
    {
      id: 'infirmary',
      kind: 'building',
      nameKey: 'buildings.infirmary.name',
      descriptionKey: 'buildings.infirmary.description',
      style: 'infirmary',
      x: 1050,
      y: 1010,
      width: 240,
      height: 160,
    },
    {
      id: 'market',
      kind: 'external',
      nameKey: 'map.locations.market.name',
      descriptionKey: 'map.locations.market.description',
      style: 'market',
      assetPath: VISUAL_ASSET_MANIFEST.locations.market.exterior,
      x: 170,
      y: 760,
      width: 260,
      height: 180,
    },
    {
      id: 'arena',
      kind: 'external',
      nameKey: 'map.locations.arena.name',
      descriptionKey: 'map.locations.arena.description',
      style: 'arena',
      assetPath: VISUAL_ASSET_MANIFEST.locations.arena.exterior,
      x: 1970,
      y: 420,
      width: 310,
      height: 240,
    },
  ],
  paths: [
    {
      id: 'domus-canteen',
      kind: 'internal',
      points: [
        { x: 1040, y: 720 },
        { x: 920, y: 700 },
        { x: 840, y: 680 },
      ],
    },
    {
      id: 'domus-dormitory',
      kind: 'internal',
      points: [
        { x: 1070, y: 780 },
        { x: 920, y: 830 },
        { x: 820, y: 870 },
      ],
    },
    {
      id: 'domus-training-ground',
      kind: 'internal',
      points: [
        { x: 1260, y: 790 },
        { x: 1360, y: 870 },
        { x: 1460, y: 930 },
      ],
    },
    {
      id: 'domus-pleasure-hall',
      kind: 'internal',
      points: [
        { x: 1300, y: 650 },
        { x: 1390, y: 620 },
        { x: 1470, y: 600 },
      ],
    },
    {
      id: 'domus-infirmary',
      kind: 'internal',
      points: [
        { x: 1180, y: 790 },
        { x: 1180, y: 930 },
        { x: 1170, y: 1010 },
      ],
    },
    {
      id: 'market-road',
      kind: 'external',
      points: [
        { x: 430, y: 850 },
        { x: 540, y: 830 },
        { x: 700, y: 800 },
        { x: 850, y: 740 },
      ],
    },
    {
      id: 'arena-road',
      kind: 'external',
      points: [
        { x: 1610, y: 620 },
        { x: 1740, y: 560 },
        { x: 1900, y: 530 },
        { x: 1970, y: 530 },
      ],
    },
  ],
  decorations: LUDUS_MAP_DECORATIONS,
  gladiatorSlots: [
    { id: 'slot-domus-1', buildingId: 'domus', x: 1110, y: 825 },
    { id: 'slot-domus-2', buildingId: 'domus', x: 1240, y: 815 },
    { id: 'slot-canteen-1', buildingId: 'canteen', x: 780, y: 710 },
    { id: 'slot-canteen-2', buildingId: 'canteen', x: 880, y: 720 },
    { id: 'slot-dormitory-1', buildingId: 'dormitory', x: 760, y: 1050 },
    { id: 'slot-dormitory-2', buildingId: 'dormitory', x: 900, y: 1045 },
    { id: 'slot-training-1', buildingId: 'trainingGround', x: 1420, y: 1115 },
    { id: 'slot-training-2', buildingId: 'trainingGround', x: 1535, y: 1110 },
    { id: 'slot-pleasure-1', buildingId: 'pleasureHall', x: 1465, y: 710 },
    { id: 'slot-pleasure-2', buildingId: 'pleasureHall', x: 1570, y: 720 },
    { id: 'slot-infirmary-1', buildingId: 'infirmary', x: 1110, y: 1200 },
    { id: 'slot-infirmary-2', buildingId: 'infirmary', x: 1230, y: 1195 },
  ],
};

export function getMapLocation(locationId: MapLocationId) {
  return LUDUS_MAP_DEFINITION.locations.find((location) => location.id === locationId);
}
