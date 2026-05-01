import { inferGladiatorClassId } from '../domain/gladiators/skills';
import type {
  GladiatorClassId,
  GladiatorSkillProfile,
  GladiatorVisualIdentity,
} from '../domain/gladiators/types';
import {
  createGladiatorVisualVariantSet,
  type GladiatorClothingStyle,
  type GladiatorVisualVariantSet,
} from './gladiator-visual-variants';
import {
  getGladiatorCombatAnimationDefinitionById,
  getGladiatorMapAnimationDefinitionById,
  type GladiatorAnimationDefinition,
  type GladiatorCombatAnimationDefinition,
  type GladiatorCombatAnimationId,
  type GladiatorMapAnimationDefinition,
  type GladiatorMapAnimationId,
} from './gladiator-animations';
import {
  getFallbackGladiatorAssetSet,
  getGladiatorClassPortraitAssetPath,
  getGladiatorClassVisualAssetId,
  getGladiatorAssetSet,
  GLADIATOR_VISUAL_ASSET_IDS,
} from './visual-assets';
import type { GladiatorAssetSet, GladiatorFrameKey } from './visual-assets';

export type CombatSpriteAnimationState = GladiatorCombatAnimationId;

export interface GladiatorAnimationAsset<
  TDefinition extends GladiatorAnimationDefinition<string, GladiatorFrameKey>,
> {
  atlasPath?: string;
  definition: TDefinition;
  fallbackFramePaths: string[];
  frameNames: string[];
  spritesheetPath?: string;
}

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

function getFrameNames(frameKey: GladiatorFrameKey, count: number) {
  return Array.from({ length: count }, (_, index) => `${frameKey}-${index}.png`);
}

function getAnimationFrameKey<TFrameKey extends GladiatorFrameKey>(
  assetSet: GladiatorAssetSet,
  definition: GladiatorAnimationDefinition<string, TFrameKey>,
) {
  const primaryFrames = assetSet.frames[definition.frameKey];

  if (primaryFrames?.length) {
    return definition.frameKey;
  }

  if (definition.fallbackFrameKey) {
    const fallbackFrames = assetSet.frames[definition.fallbackFrameKey];

    if (fallbackFrames?.length) {
      return definition.fallbackFrameKey;
    }
  }

  return definition.frameKey;
}

function getAnimationFramePaths(
  assetSet: GladiatorAssetSet,
  frameKey: GladiatorFrameKey,
): string[] {
  return assetSet.frames[frameKey] ?? [];
}

function createAnimationAsset<
  TDefinition extends GladiatorAnimationDefinition<string, GladiatorFrameKey>,
>(
  assetSet: GladiatorAssetSet,
  definition: TDefinition,
  options: {
    atlasPath?: string;
    spritesheetPath?: string;
  },
): GladiatorAnimationAsset<TDefinition> {
  const frameKey = getAnimationFrameKey(assetSet, definition);
  const fallbackFramePaths = getAnimationFramePaths(assetSet, frameKey);

  return {
    atlasPath: options.atlasPath,
    definition,
    fallbackFramePaths,
    frameNames: getFrameNames(frameKey, Math.max(fallbackFramePaths.length, 1)),
    spritesheetPath: options.spritesheetPath,
  };
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
  const classId = resolveClassId(options);
  const visualAssetId = classId
    ? getGladiatorClassVisualAssetId(classId)
    : GLADIATOR_VISUAL_ASSET_IDS[getStableIndex(seed, GLADIATOR_VISUAL_ASSET_IDS.length)];
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
    return visualIdentity ?? createGladiatorVisualIdentity(seed);
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

function getGeneratedSpriteAssetSet(visualIdentity: GladiatorVisualIdentity) {
  return (
    getGladiatorAssetSet(visualIdentity.spriteAssetId) ??
    getGladiatorAssetSet(visualIdentity.portraitAssetId) ??
    getFallbackGladiatorAssetSet(visualIdentity.classId)
  );
}

function getProductionSpriteAssetSet(visualIdentity: GladiatorVisualIdentity) {
  return (
    getGladiatorAssetSet(visualIdentity.spriteAssetId) ??
    getGladiatorAssetSet(visualIdentity.portraitAssetId) ??
    getFallbackGladiatorAssetSet(visualIdentity.classId)
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

export function getGladiatorMapAnimationAsset(
  visualIdentity: GladiatorVisualIdentity,
  animation: GladiatorMapAnimationId,
): GladiatorAnimationAsset<GladiatorMapAnimationDefinition> {
  const generatedAssetSet = getGeneratedSpriteAssetSet(visualIdentity);
  const definition = getGladiatorMapAnimationDefinitionById(animation);

  const assetSet = generatedAssetSet ?? getFallbackGladiatorAssetSet();

  return createAnimationAsset(assetSet, definition, {
    atlasPath: assetSet.mapAtlas,
    spritesheetPath: assetSet.mapSpritesheet,
  });
}

export function getProductionGladiatorCombatAnimationAsset(
  visualIdentity: GladiatorVisualIdentity,
  animation: GladiatorCombatAnimationId,
): GladiatorAnimationAsset<GladiatorCombatAnimationDefinition> {
  const assetSet = getProductionSpriteAssetSet(visualIdentity);

  return createAnimationAsset(assetSet, getGladiatorCombatAnimationDefinitionById(animation), {
    atlasPath: assetSet.combatAtlas,
    spritesheetPath: assetSet.combatSpritesheet,
  });
}
