import type { MapLocationId } from '../../../game-data/map-layout';
import type { MapDecorationStyle } from '../../../game-data/decorations';
import type {
  GladiatorMapAnimationDefinition,
  GladiatorMapAnimationId,
} from '../../../game-data/gladiator-animations';
import type { TimeOfDayPhase } from '../../../game-data/time-of-day';

export type LudusMapSceneLocationKind = 'building' | 'external';

export interface LudusMapScenePointViewModel {
  id?: string;
  x: number;
  y: number;
}

export interface LudusMapSceneRectViewModel extends LudusMapScenePointViewModel {
  width: number;
  height: number;
}

export interface LudusMapSceneLocationViewModel {
  id: string;
  mapLocationId: MapLocationId;
  kind: LudusMapSceneLocationKind;
  labelKey: string;
  label: string;
  labelTitle: string;
  labelSubtitle: string;
  labelLevel: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isOwned: boolean;
  level: number;
  activitySlots: LudusMapScenePointViewModel[];
  exteriorAssetPath?: string;
  roofAssetPath?: string;
  propsAssetPath?: string;
  assetPath?: string;
  hitArea: LudusMapSceneRectViewModel;
  labelPosition: LudusMapScenePointViewModel;
  sortY: number;
}

export interface LudusMapSceneGladiatorViewModel {
  id: string;
  name: string;
  from: {
    x: number;
    y: number;
  };
  to: {
    x: number;
    y: number;
  };
  movementStartedAt: number;
  movementDuration: number;
  animation: GladiatorMapAnimationDefinition;
  animationId: GladiatorMapAnimationId;
  fallbackFramePaths: string[];
  frameNames: string[];
  spritesheetAtlasPath?: string;
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
  kind: 'sea' | 'cliff' | 'forestEdge' | 'compoundGround';
}

export interface LudusMapSceneWallSegmentViewModel {
  id: string;
  kind: 'wall' | 'gate' | 'brokenWall' | 'partition';
  width: number;
  points: LudusMapScenePointViewModel[];
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

export type LudusMapSceneAmbientKind =
  | 'cloud'
  | 'grass'
  | 'banner'
  | 'torch'
  | 'smoke'
  | 'steam'
  | 'waterShimmer'
  | 'seaShimmer'
  | 'bird'
  | 'boat'
  | 'glow'
  | 'sparkle'
  | 'sway'
  | 'dummy'
  | 'crowd'
  | 'awning'
  | 'dust';

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

export interface LudusMapSceneWaterAnimationViewModel {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: number;
  lineCount: number;
  lineWidth: number;
  opacity: number;
  speed: number;
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
  currentGameMinute: number;
  gameMinutesPerRealMillisecond: number;
  animationSpeedMultiplier: number;
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
  terrainZones: LudusMapSceneTerrainZoneViewModel[];
  wallSegments: LudusMapSceneWallSegmentViewModel[];
  paths: LudusMapScenePathViewModel[];
  decorations: LudusMapSceneDecorationViewModel[];
  ambientElements: LudusMapSceneAmbientElementViewModel[];
  waterAnimation: LudusMapSceneWaterAnimationViewModel;
  locations: LudusMapSceneLocationViewModel[];
  gladiators: LudusMapSceneGladiatorViewModel[];
}
