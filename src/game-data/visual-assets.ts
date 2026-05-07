import type { BuildingId } from '../domain/buildings/types';
import type { BuildingAssetSet } from './buildings/assets';
import { PRODUCTION_VISUAL_ASSET_MANIFEST as generatedProductionVisualAssetManifest } from './generated/asset-manifest.production';
import type { GladiatorAssetSet } from './gladiators/assets';

export const VISUAL_ASSET_SOURCE_QUALITIES = ['production'] as const;
export type VisualAssetSourceQuality = (typeof VISUAL_ASSET_SOURCE_QUALITIES)[number];

export const HOMEPAGE_BACKGROUND_IDS = ['main'] as const;
export type HomepageBackgroundId = (typeof HOMEPAGE_BACKGROUND_IDS)[number];

export const VISUAL_LOCATION_IDS = ['arena', 'market'] as const;
export type VisualLocationId = (typeof VISUAL_LOCATION_IDS)[number];

export interface ArenaLocationAssetSet {
  sourceQuality?: VisualAssetSourceQuality;
  combatBackground: string;
  exterior?: string;
}

export interface MarketLocationAssetSet {
  sourceQuality?: VisualAssetSourceQuality;
  exterior?: string;
}

export interface VisualLocationAssetMap {
  arena: ArenaLocationAssetSet;
  market: MarketLocationAssetSet;
}

export interface VisualAssetManifest {
  version: 1;
  sourceQuality: VisualAssetSourceQuality;
  generatedAt: string;
  ludus: {
    background: string;
    sourceQuality?: VisualAssetSourceQuality;
  };
  homepage: {
    sourceQuality?: VisualAssetSourceQuality;
    backgrounds: Partial<Record<HomepageBackgroundId, string>>;
    lastSaveThumbnail?: string;
  };
  buildings: Partial<Record<BuildingId, Record<string, BuildingAssetSet>>>;
  locations: VisualLocationAssetMap;
  gladiators: Record<string, GladiatorAssetSet>;
  ui: Record<string, string>;
}

export const PRODUCTION_VISUAL_ASSET_MANIFEST: VisualAssetManifest =
  generatedProductionVisualAssetManifest;

export const VISUAL_ASSET_MANIFEST: VisualAssetManifest = PRODUCTION_VISUAL_ASSET_MANIFEST;

export function getLocationAssetPath(locationId: VisualLocationId) {
  return VISUAL_ASSET_MANIFEST.locations[locationId].exterior;
}
