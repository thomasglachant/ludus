import { inferGladiatorClassId } from '../domain/gladiators/skills';
import type {
  GladiatorClassId,
  GladiatorSkillProfile,
  GladiatorVisualIdentity,
} from '../domain/gladiators/types';
import { GLADIATOR_CLASS_IDS } from '../domain/gladiators/types';
import {
  createGladiatorVisualVariantSet,
  type GladiatorClothingStyle,
  type GladiatorVisualVariantSet,
} from './gladiator-visual-variants';
import {
  getFallbackGladiatorAssetSet,
  getGladiatorClassPortraitAssetPath,
  getGladiatorClassVisualAssetId,
  getGladiatorAssetSet,
} from './visual-assets';
import type { GladiatorAssetSet } from './visual-assets';

export interface GladiatorVisualIdentityOptions {
  classId?: GladiatorClassId;
  skillProfile?: GladiatorSkillProfile;
}

function getStableIndex(seed: string, length: number) {
  const total = Array.from(seed).reduce((value, character) => value + character.charCodeAt(0), 0);

  return total % length;
}

function getArmorStyle(clothingStyle: GladiatorClothingStyle) {
  if (clothingStyle === 'bronzeCuirass') {
    return 'bronze';
  }

  if (clothingStyle === 'leatherHarness') {
    return 'leather';
  }

  return clothingStyle;
}

function getHairStyle(variants: GladiatorVisualVariantSet) {
  return variants.headwearStyle === 'none' ? variants.hairAndBeardStyle : variants.headwearStyle;
}

function getPaletteId(variants: GladiatorVisualVariantSet) {
  return `${variants.clothingColor}-${variants.skinTone}`;
}

function resolveClassId(options?: GladiatorVisualIdentityOptions) {
  return (
    options?.classId ??
    (options?.skillProfile ? inferGladiatorClassId(options.skillProfile) : undefined)
  );
}

function resolveFallbackClassId(seed: string) {
  return GLADIATOR_CLASS_IDS[getStableIndex(seed, GLADIATOR_CLASS_IDS.length)];
}

function createVisualIdentity(
  assetId: string,
  manifestAssetSet: GladiatorAssetSet | undefined,
  variants: GladiatorVisualVariantSet,
  classId?: GladiatorClassId,
): GladiatorVisualIdentity {
  return {
    classId,
    portraitAssetId: assetId,
    spriteAssetId: assetId,
    paletteId: manifestAssetSet?.paletteId ?? getPaletteId(variants),
    bodyType: manifestAssetSet?.bodyType ?? variants.bodyBuildStyle,
    hairStyle: manifestAssetSet?.hairStyle ?? getHairStyle(variants),
    armorStyle: manifestAssetSet?.armorStyle ?? getArmorStyle(variants.clothingStyle),
    clothingStyle: manifestAssetSet?.clothingStyle ?? variants.clothingStyle,
    clothingColor: manifestAssetSet?.clothingColor ?? variants.clothingColor,
    hairAndBeardStyle: manifestAssetSet?.hairAndBeardStyle ?? variants.hairAndBeardStyle,
    headwearStyle: manifestAssetSet?.headwearStyle ?? variants.headwearStyle,
    bodyBuildStyle: manifestAssetSet?.bodyBuildStyle ?? variants.bodyBuildStyle,
    skinTone: manifestAssetSet?.skinTone ?? variants.skinTone,
    markingStyle: manifestAssetSet?.markingStyle ?? variants.markingStyle,
  };
}

export function createGladiatorVisualIdentity(
  seed: string,
  options?: GladiatorVisualIdentityOptions,
): GladiatorVisualIdentity {
  const classId = resolveClassId(options) ?? resolveFallbackClassId(seed);
  const visualAssetId = getGladiatorClassVisualAssetId(classId);
  const assetSet = getGladiatorAssetSet(visualAssetId);
  const variants = createGladiatorVisualVariantSet(seed, classId);

  return createVisualIdentity(visualAssetId, assetSet, variants, classId);
}

export function getGladiatorVisualIdentity(
  seed: string,
  visualIdentity?: GladiatorVisualIdentity,
  options?: GladiatorVisualIdentityOptions,
): GladiatorVisualIdentity {
  const classId = resolveClassId(options);

  if (!classId) {
    return visualIdentity?.classId ? visualIdentity : createGladiatorVisualIdentity(seed);
  }

  return createGladiatorVisualIdentity(seed, {
    classId,
    skillProfile: options?.skillProfile,
  });
}

function getGeneratedPortraitAssetSet(visualIdentity: GladiatorVisualIdentity) {
  return (
    getGladiatorAssetSet(visualIdentity.portraitAssetId) ??
    getGladiatorAssetSet(visualIdentity.spriteAssetId)
  );
}

export function getGladiatorPortraitAssetPath(visualIdentity: GladiatorVisualIdentity) {
  const classPortraitPath = visualIdentity.classId
    ? getGladiatorClassPortraitAssetPath(visualIdentity.classId)
    : undefined;

  return (
    getGeneratedPortraitAssetSet(visualIdentity)?.portrait ??
    classPortraitPath ??
    getFallbackGladiatorAssetSet(visualIdentity.classId).portrait
  );
}

export function getGladiatorAvatarAssetPath(visualIdentity: GladiatorVisualIdentity) {
  const classAvatarPath = visualIdentity.classId
    ? getGladiatorClassPortraitAssetPath(visualIdentity.classId)
    : undefined;
  const generatedPortraitAssetSet = getGeneratedPortraitAssetSet(visualIdentity);
  const fallbackAssetSet = getFallbackGladiatorAssetSet(visualIdentity.classId);

  return (
    generatedPortraitAssetSet?.avatar ??
    classAvatarPath ??
    generatedPortraitAssetSet?.portrait ??
    fallbackAssetSet.avatar
  );
}
