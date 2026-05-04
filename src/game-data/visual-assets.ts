import type { BuildingId } from '../domain/buildings/types';
import type { GladiatorClassId } from '../domain/gladiators/types';
import { PRODUCTION_VISUAL_ASSET_MANIFEST as generatedProductionVisualAssetManifest } from './generated/asset-manifest.production';
import { GLADIATOR_VISUAL_VARIANT_LIMIT } from './gladiator-visual-variants';

export type VisualAssetSourceQuality = 'production';
export type HomepageBackgroundPhase = 'day' | 'dusk';
export type VisualLocationId = 'arena' | 'market';

export interface ArenaLocationAssetSet {
  sourceQuality?: VisualAssetSourceQuality;
  combatBackground: string;
  crowd: string;
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
  avatar?: string;
  paletteId: string;
  bodyType: string;
  hairStyle: string;
  armorStyle: string;
  clothingStyle?: string;
  clothingColor?: string;
  hairAndBeardStyle?: string;
  headwearStyle?: string;
  bodyBuildStyle?: string;
  skinTone?: string;
  markingStyle?: string;
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
    backgrounds: Partial<Record<HomepageBackgroundPhase, string>>;
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

export const GLADIATOR_VISUAL_ASSET_IDS = Object.keys(VISUAL_ASSET_MANIFEST.gladiators).slice(
  0,
  GLADIATOR_VISUAL_VARIANT_LIMIT,
);

export const GLADIATOR_CLASS_VISUAL_ASSET_IDS = {
  murmillo: 'gladiator-class-murmillo',
  retiarius: 'gladiator-class-retiarius',
  secutor: 'gladiator-class-secutor',
} as const satisfies Record<GladiatorClassId, string>;

export const GLADIATOR_CLASS_FALLBACK_VISUAL_ASSET_IDS = {
  murmillo: 'gladiator-03',
  retiarius: 'gladiator-02',
  secutor: 'gladiator-05',
} as const satisfies Record<GladiatorClassId, string>;

export const GLADIATOR_CLASS_PORTRAIT_ASSET_PATHS = {
  murmillo: '/assets/gladiators/classes/murmillo-avatar.png',
  retiarius: '/assets/gladiators/classes/retiarius-avatar.png',
  secutor: '/assets/gladiators/classes/secutor-avatar.png',
} as const satisfies Record<GladiatorClassId, string>;

export function getGladiatorClassVisualAssetId(classId: GladiatorClassId) {
  return GLADIATOR_CLASS_VISUAL_ASSET_IDS[classId];
}

export function getGladiatorClassFallbackVisualAssetId(classId: GladiatorClassId) {
  return GLADIATOR_CLASS_FALLBACK_VISUAL_ASSET_IDS[classId];
}

export function getGladiatorClassPortraitAssetPath(classId: GladiatorClassId) {
  return GLADIATOR_CLASS_PORTRAIT_ASSET_PATHS[classId];
}

export function getGladiatorAssetSet(assetId: string): GladiatorAssetSet | undefined {
  return VISUAL_ASSET_MANIFEST.gladiators[assetId];
}

export function getBuildingAssetSet(buildingId: BuildingId, level: number) {
  const levelEntries = Object.entries(VISUAL_ASSET_MANIFEST.buildings[buildingId] ?? {})
    .map(([levelId, assetSet]) => ({
      assetSet,
      level: Number.parseInt(levelId.replace('level-', ''), 10),
    }))
    .filter((entry) => Number.isFinite(entry.level))
    .sort((left, right) => right.level - left.level);

  return (
    levelEntries.find((entry) => entry.level <= level)?.assetSet ?? levelEntries.at(-1)?.assetSet
  );
}

export function getLocationAssetPath(locationId: VisualLocationId) {
  return VISUAL_ASSET_MANIFEST.locations[locationId].exterior;
}

export function getFallbackGladiatorAssetSet(classId?: GladiatorClassId) {
  const classFallbackAssetId = classId
    ? getGladiatorClassFallbackVisualAssetId(classId)
    : undefined;
  const fallbackAssetSet =
    (classFallbackAssetId ? getGladiatorAssetSet(classFallbackAssetId) : undefined) ??
    getGladiatorAssetSet(GLADIATOR_VISUAL_ASSET_IDS[0]);

  if (!fallbackAssetSet) {
    throw new Error('Missing fallback gladiator visual asset set.');
  }

  return fallbackAssetSet;
}
