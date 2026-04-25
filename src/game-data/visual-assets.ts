import type { BuildingId } from '../domain/buildings/types';
import visualAssetManifestData from '../../public/assets/pixel-art/asset-manifest.visual-migration.json';

export type TimeOfDayAssetPhase = 'dawn' | 'day' | 'dusk' | 'night';
export type HomepageBackgroundPhase = 'day' | 'dusk';
export type MapFrameKey =
  | 'map-idle'
  | 'map-walk'
  | 'map-train'
  | 'map-eat'
  | 'map-rest'
  | 'map-healing';
export type CombatFrameKey = 'combat-idle' | 'combat-attack';
export type GladiatorFrameKey = MapFrameKey | CombatFrameKey;
export type VisualLocationId = 'market' | 'arena';

export interface BuildingAssetSet {
  exterior: string;
  roof?: string;
  interior?: string;
  props?: string;
  width: number;
  height: number;
}

export interface GladiatorAssetSet {
  portrait: string;
  frames: Partial<Record<GladiatorFrameKey, string[]>>;
  paletteId: string;
  bodyType: string;
  hairStyle: string;
  armorStyle: string;
}

export interface VisualAssetManifest {
  version: 1;
  generatedAt: string;
  homepage: {
    backgrounds: Partial<Record<HomepageBackgroundPhase, string>>;
    lastSaveThumbnail: string;
  };
  map: {
    backgrounds: Record<TimeOfDayAssetPhase, string>;
    ambient: Record<string, string>;
  };
  buildings: Record<BuildingId, Record<string, BuildingAssetSet>>;
  locations: Record<VisualLocationId, Record<string, string>>;
  gladiators: Record<string, GladiatorAssetSet>;
  ui: Record<string, string>;
}

export const VISUAL_ASSET_MANIFEST = visualAssetManifestData as VisualAssetManifest;

export const PIXEL_ART_BUILDING_LEVELS = [0, 1, 2, 3] as const;
export type PixelArtBuildingLevel = (typeof PIXEL_ART_BUILDING_LEVELS)[number];

export const GLADIATOR_VISUAL_ASSET_IDS = Object.keys(VISUAL_ASSET_MANIFEST.gladiators);

export function getPixelArtBuildingLevel(level: number): PixelArtBuildingLevel {
  const minimumLevel = PIXEL_ART_BUILDING_LEVELS[0];
  const maximumLevel = PIXEL_ART_BUILDING_LEVELS[PIXEL_ART_BUILDING_LEVELS.length - 1];

  if (level <= minimumLevel) {
    return minimumLevel;
  }

  if (level >= maximumLevel) {
    return maximumLevel;
  }

  return level as PixelArtBuildingLevel;
}

export function getBuildingAssetSet(buildingId: BuildingId, level: number) {
  const visualLevel = getPixelArtBuildingLevel(level);

  return VISUAL_ASSET_MANIFEST.buildings[buildingId]?.[`level-${visualLevel}`];
}

export function getGladiatorAssetSet(assetId: string) {
  return VISUAL_ASSET_MANIFEST.gladiators[assetId];
}

export function getFallbackGladiatorAssetSet() {
  return VISUAL_ASSET_MANIFEST.gladiators[GLADIATOR_VISUAL_ASSET_IDS[0]];
}
