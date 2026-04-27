import type { MapLocationId } from '../../../game-data/map-layout';
import type { MapDecorationStyle } from '../../../game-data/decorations';

export type LudusMapSceneLocationKind = 'building' | 'external';

export interface LudusMapSceneLocationViewModel {
  id: string;
  mapLocationId: MapLocationId;
  kind: LudusMapSceneLocationKind;
  labelKey: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isOwned: boolean;
  level: number;
  assetPath?: string;
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
  animationState: string;
  spriteFrames: string[];
}

export interface LudusMapScenePathViewModel {
  id: string;
  kind: 'internal' | 'external';
  points: {
    x: number;
    y: number;
  }[];
}

export interface LudusMapSceneDecorationViewModel {
  id: string;
  style: MapDecorationStyle;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export type LudusMapSceneAmbientKind = 'cloud' | 'grass' | 'banner' | 'torch' | 'smoke' | 'crowd';

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
  terrainColor: number;
  terrainHighlightColor: number;
  overlayColor: number;
  overlayOpacity: number;
  backgroundAssetPath?: string;
}

export interface LudusMapSceneViewModel {
  width: number;
  height: number;
  currentGameMinute: number;
  gameMinutesPerRealMillisecond: number;
  reducedMotion: boolean;
  defaultCamera: {
    x: number;
    y: number;
  };
  defaultZoom: number;
  minZoom: number;
  maxZoom: number;
  theme: LudusMapSceneThemeViewModel;
  paths: LudusMapScenePathViewModel[];
  decorations: LudusMapSceneDecorationViewModel[];
  ambientElements: LudusMapSceneAmbientElementViewModel[];
  locations: LudusMapSceneLocationViewModel[];
  gladiators: LudusMapSceneGladiatorViewModel[];
}
