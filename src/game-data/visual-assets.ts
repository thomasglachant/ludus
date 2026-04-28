import type { BuildingId } from '../domain/buildings/types';
import { GLADIATOR_VISUAL_VARIANT_LIMIT } from './gladiator-visual-variants';
import productionVisualAssetManifestData from './generated/asset-manifest.production.json';

export type VisualAssetSourceQuality = 'production';
export type HomepageBackgroundPhase = 'day' | 'dusk';
export type MapFrameKey =
  | 'map-idle'
  | 'map-walk'
  | 'map-train'
  | 'map-eat'
  | 'map-rest'
  | 'map-celebrate'
  | 'map-healing';
export type CombatFrameKey =
  | 'combat-idle'
  | 'combat-attack'
  | 'combat-hit'
  | 'combat-block'
  | 'combat-defeat'
  | 'combat-victory';
export type GladiatorFrameKey = MapFrameKey | CombatFrameKey;
export type VisualLocationId = 'arena';

export interface BuildingAssetSet {
  sourceQuality?: VisualAssetSourceQuality;
  exterior: string;
  roof?: string;
  interior?: string;
  props?: string;
  width: number;
  height: number;
}

export interface GladiatorAssetSet {
  sourceQuality?: VisualAssetSourceQuality;
  portrait: string;
  mapSpritesheet?: string;
  mapAtlas?: string;
  combatSpritesheet?: string;
  combatAtlas?: string;
  frames: Partial<Record<GladiatorFrameKey, string[]>>;
  paletteId: string;
  bodyType: string;
  hairStyle: string;
  armorStyle: string;
  clothingStyle?: string;
  clothingColor?: string;
  hairAndBeardStyle?: string;
  headwearStyle?: string;
  accessoryStyle?: string;
  bodyBuildStyle?: string;
  skinTone?: string;
  markingStyle?: string;
}

export interface VisualAssetManifest {
  version: 1;
  sourceQuality: VisualAssetSourceQuality;
  generatedAt: string;
  homepage: {
    sourceQuality?: VisualAssetSourceQuality;
    backgrounds: Partial<Record<HomepageBackgroundPhase, string>>;
    lastSaveThumbnail: string;
  };
  buildings: Record<BuildingId, Record<string, BuildingAssetSet>>;
  locations: Record<VisualLocationId, Record<string, string>>;
  gladiators: Record<string, GladiatorAssetSet>;
  ui: Record<string, string>;
}

export const PRODUCTION_VISUAL_ASSET_MANIFEST =
  productionVisualAssetManifestData as VisualAssetManifest;

export const VISUAL_ASSET_MANIFEST = PRODUCTION_VISUAL_ASSET_MANIFEST;

export const PIXEL_ART_BUILDING_LEVELS = [0, 1, 2, 3] as const;
export type PixelArtBuildingLevel = (typeof PIXEL_ART_BUILDING_LEVELS)[number];

export const GLADIATOR_VISUAL_ASSET_IDS = Object.keys(VISUAL_ASSET_MANIFEST.gladiators).slice(
  0,
  GLADIATOR_VISUAL_VARIANT_LIMIT,
);

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
  const buildingAssets = VISUAL_ASSET_MANIFEST.buildings[buildingId];
  const requestedAssetSet = buildingAssets?.[`level-${visualLevel}`];

  if (requestedAssetSet) {
    return requestedAssetSet;
  }

  return Object.entries(buildingAssets ?? {})
    .map(([levelKey, assetSet]) => ({
      assetSet,
      level: Number(levelKey.replace('level-', '')),
    }))
    .filter(({ level }) => Number.isFinite(level))
    .sort(
      (left, right) => Math.abs(left.level - visualLevel) - Math.abs(right.level - visualLevel),
    )[0]?.assetSet;
}

export function getGladiatorAssetSet(assetId: string) {
  return VISUAL_ASSET_MANIFEST.gladiators[assetId];
}

export function getFallbackGladiatorAssetSet() {
  return VISUAL_ASSET_MANIFEST.gladiators[GLADIATOR_VISUAL_ASSET_IDS[0]];
}
