import type { BuildingId } from '../domain/buildings/types';
import { PRODUCTION_VISUAL_ASSET_MANIFEST as generatedProductionVisualAssetManifest } from './generated/asset-manifest.production';
import { GLADIATOR_VISUAL_VARIANT_LIMIT } from './gladiator-visual-variants';

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
    lastSaveThumbnail?: string;
  };
  buildings: Partial<Record<BuildingId, Record<string, BuildingAssetSet>>>;
  locations: Record<VisualLocationId, Record<string, string>>;
  gladiators: Record<string, GladiatorAssetSet>;
  ui: Record<string, string>;
}

export const PRODUCTION_VISUAL_ASSET_MANIFEST: VisualAssetManifest =
  generatedProductionVisualAssetManifest;

export const VISUAL_ASSET_MANIFEST: VisualAssetManifest = PRODUCTION_VISUAL_ASSET_MANIFEST;

export const GLADIATOR_VISUAL_ASSET_IDS = Object.keys(VISUAL_ASSET_MANIFEST.gladiators).slice(
  0,
  GLADIATOR_VISUAL_VARIANT_LIMIT,
);

export function getGladiatorAssetSet(assetId: string) {
  return VISUAL_ASSET_MANIFEST.gladiators[assetId];
}

export function getFallbackGladiatorAssetSet() {
  return VISUAL_ASSET_MANIFEST.gladiators[GLADIATOR_VISUAL_ASSET_IDS[0]];
}
