import { GLADIATOR_CLASS_IDS, type GladiatorClassId } from '../../domain/gladiators/types';
import { VISUAL_ASSET_MANIFEST, type VisualAssetSourceQuality } from '../visual-assets';

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

export const GLADIATOR_CLASS_VISUAL_ASSET_IDS = {
  murmillo: 'gladiator-class-murmillo',
  retiarius: 'gladiator-class-retiarius',
  secutor: 'gladiator-class-secutor',
} as const satisfies Record<GladiatorClassId, string>;

export const GLADIATOR_CLASS_PORTRAIT_ASSET_PATHS = {
  murmillo: '/assets/gladiators/classes/murmillo-avatar.webp',
  retiarius: '/assets/gladiators/classes/retiarius-avatar.webp',
  secutor: '/assets/gladiators/classes/secutor-avatar.webp',
} as const satisfies Record<GladiatorClassId, string>;

export const DEFAULT_GLADIATOR_CLASS_ID = GLADIATOR_CLASS_IDS[0];

export const GLADIATOR_CLASS_ASSET_SETS = {
  murmillo: {
    sourceQuality: 'production',
    portrait: GLADIATOR_CLASS_PORTRAIT_ASSET_PATHS.murmillo,
    avatar: GLADIATOR_CLASS_PORTRAIT_ASSET_PATHS.murmillo,
    paletteId: 'madderRed-bronze',
    bodyType: 'broad',
    hairStyle: 'bronzeGalea',
    armorStyle: 'bronze',
    clothingStyle: 'bronzeCuirass',
    clothingColor: 'madderRed',
    hairAndBeardStyle: 'cropped',
    headwearStyle: 'bronzeGalea',
    bodyBuildStyle: 'broad',
    skinTone: 'bronze',
    markingStyle: 'browScar',
  },
  retiarius: {
    sourceQuality: 'production',
    portrait: GLADIATOR_CLASS_PORTRAIT_ASSET_PATHS.retiarius,
    avatar: GLADIATOR_CLASS_PORTRAIT_ASSET_PATHS.retiarius,
    paletteId: 'linenWhite-tan',
    bodyType: 'lean',
    hairStyle: 'curly',
    armorStyle: 'linenTunic',
    clothingStyle: 'linenTunic',
    clothingColor: 'linenWhite',
    hairAndBeardStyle: 'curly',
    headwearStyle: 'none',
    bodyBuildStyle: 'lean',
    skinTone: 'tan',
    markingStyle: 'cheekScar',
  },
  secutor: {
    sourceQuality: 'production',
    portrait: GLADIATOR_CLASS_PORTRAIT_ASSET_PATHS.secutor,
    avatar: GLADIATOR_CLASS_PORTRAIT_ASSET_PATHS.secutor,
    paletteId: 'indigo-umber',
    bodyType: 'stocky',
    hairStyle: 'ironMask',
    armorStyle: 'paddedManica',
    clothingStyle: 'paddedManica',
    clothingColor: 'indigo',
    hairAndBeardStyle: 'shaved',
    headwearStyle: 'ironMask',
    bodyBuildStyle: 'stocky',
    skinTone: 'umber',
    markingStyle: 'arenaDust',
  },
} as const satisfies Record<GladiatorClassId, GladiatorAssetSet>;

export function getGladiatorClassVisualAssetId(classId: GladiatorClassId) {
  return GLADIATOR_CLASS_VISUAL_ASSET_IDS[classId];
}

export function getGladiatorClassPortraitAssetPath(classId: GladiatorClassId) {
  return GLADIATOR_CLASS_PORTRAIT_ASSET_PATHS[classId];
}

export function getGladiatorAssetSet(assetId: string): GladiatorAssetSet | undefined {
  const classEntry = Object.entries(GLADIATOR_CLASS_VISUAL_ASSET_IDS).find(
    ([, classAssetId]) => classAssetId === assetId,
  );
  const classId = classEntry?.[0] as GladiatorClassId | undefined;

  return classId ? GLADIATOR_CLASS_ASSET_SETS[classId] : VISUAL_ASSET_MANIFEST.gladiators[assetId];
}

export function getFallbackGladiatorAssetSet(classId?: GladiatorClassId) {
  return GLADIATOR_CLASS_ASSET_SETS[classId ?? DEFAULT_GLADIATOR_CLASS_ID];
}
