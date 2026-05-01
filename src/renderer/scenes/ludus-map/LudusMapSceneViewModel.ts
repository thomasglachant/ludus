import type { MapLocationId } from '../../../game-data/map-layout';
import type { MapDecorationStyle } from '../../../game-data/decorations';
import type { LudusMapTextureId } from '../../../game-data/map-textures';
import type { MapGroundId, MapTerrainId } from '../../../domain/map/types';
import type { TimeOfDayPhase } from '../../../game-data/time-of-day';

export type LudusMapSceneLocationKind = 'building' | 'external';
export type LudusMapSceneOwnershipStatus = 'owned' | 'available' | 'locked';

export interface LudusMapScenePointViewModel {
  id?: string;
  x: number;
  y: number;
}

export interface LudusMapSceneRectViewModel extends LudusMapScenePointViewModel {
  width: number;
  height: number;
}

export interface LudusMapSceneGridViewModel {
  columns: number;
  rows: number;
  cellSize: number;
}

export interface LudusMapSceneTileViewModel extends LudusMapSceneRectViewModel {
  id: string;
  column: number;
  row: number;
  terrainId: MapTerrainId;
  groundId?: MapGroundId;
}

export interface LudusMapSceneWallViewModel extends LudusMapSceneRectViewModel {
  id: string;
  column: number;
  row: number;
  sortY: number;
}

export interface LudusMapSceneLocationViewModel {
  id: string;
  mapLocationId: MapLocationId;
  kind: LudusMapSceneLocationKind;
  labelKey: string;
  label: string;
  labelTitle: string;
  labelSubtitle: string;
  labelDetail: string;
  accessibilityLabel: string;
  labelLevel: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isOwned: boolean;
  ownershipStatus: LudusMapSceneOwnershipStatus;
  level: number;
  purchaseCost?: number;
  requiredDomusLevel?: number;
  activitySlots: LudusMapScenePointViewModel[];
  entrancePosition: LudusMapScenePointViewModel;
  exteriorAssetPath?: string;
  roofAssetPath?: string;
  propsAssetPath?: string;
  assetPath?: string;
  hitArea: LudusMapSceneRectViewModel;
  labelPosition: LudusMapScenePointViewModel;
  sortY: number;
}

export interface LudusMapScenePathViewModel {
  id: string;
  kind: 'internal' | 'external';
  width: number;
  points: {
    x: number;
    y: number;
  }[];
}

export interface LudusMapSceneTerrainZoneViewModel extends LudusMapSceneRectViewModel {
  id: string;
  kind: 'compoundGround' | 'countryside';
}

export interface LudusMapSceneDecorationViewModel {
  id: string;
  style: MapDecorationStyle;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  isAnimated: boolean;
  animationDelaySeconds: number;
  animationDurationSeconds: number;
  assetPath?: string;
  sortY: number;
}

export type LudusMapSceneAmbientKind = 'banner';

export interface LudusMapSceneAmbientElementViewModel {
  id: string;
  kind: LudusMapSceneAmbientKind;
  assetPath: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  rotation: number;
  animationDelaySeconds: number;
  animationDurationSeconds: number;
  zIndex: number;
}

export interface LudusMapSceneThemeViewModel {
  skyColor: number;
  terrainColor: number;
  terrainHighlightColor: number;
  overlayColor: number;
  overlayOpacity: number;
  lightColor: number;
  shadowColor: number;
  spriteBrightness: number;
  buildingLightOpacity: number;
  backgroundAssetPath?: string;
}

export interface LudusMapSceneViewModel {
  width: number;
  height: number;
  timeOfDayPhase: TimeOfDayPhase;
  selectedLocationId?: MapLocationId;
  reducedMotion: boolean;
  defaultCamera: {
    x: number;
    y: number;
  };
  defaultZoom: number;
  minZoom: number;
  maxZoom: number;
  zoomPresets: number[];
  theme: LudusMapSceneThemeViewModel;
  textures: Record<LudusMapTextureId, string>;
  grid: LudusMapSceneGridViewModel;
  tiles: LudusMapSceneTileViewModel[];
  walls: LudusMapSceneWallViewModel[];
  terrainZones: LudusMapSceneTerrainZoneViewModel[];
  paths: LudusMapScenePathViewModel[];
  decorations: LudusMapSceneDecorationViewModel[];
  ambientElements: LudusMapSceneAmbientElementViewModel[];
  locations: LudusMapSceneLocationViewModel[];
}
