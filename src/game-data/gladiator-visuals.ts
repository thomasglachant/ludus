import type { GladiatorClassId, GladiatorVisualIdentity } from '../domain/gladiators/types';
import { createGladiatorVisualVariantSet } from './gladiator-visual-variants';
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
  PRODUCTION_VISUAL_ASSET_MANIFEST,
  getFallbackGladiatorAssetSet,
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

function getStableIndex(seed: string, length: number) {
  const total = Array.from(seed).reduce((value, character) => value + character.charCodeAt(0), 0);

  return total % length;
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

export function createGladiatorVisualIdentity(
  seed: string,
  classId?: GladiatorClassId,
): GladiatorVisualIdentity {
  const assetId =
    GLADIATOR_VISUAL_ASSET_IDS[getStableIndex(seed, GLADIATOR_VISUAL_ASSET_IDS.length)];
  const assetSet = getGladiatorAssetSet(assetId) ?? getFallbackGladiatorAssetSet();
  const variants = createGladiatorVisualVariantSet(seed, classId);

  return {
    portraitAssetId: assetId,
    spriteAssetId: assetId,
    paletteId: assetSet.paletteId,
    bodyType: assetSet.bodyType,
    hairStyle: assetSet.hairStyle,
    armorStyle: assetSet.armorStyle,
    clothingStyle: assetSet.clothingStyle ?? variants.clothingStyle,
    clothingColor: assetSet.clothingColor ?? variants.clothingColor,
    hairAndBeardStyle: assetSet.hairAndBeardStyle ?? variants.hairAndBeardStyle,
    headwearStyle: assetSet.headwearStyle ?? variants.headwearStyle,
    accessoryStyle: assetSet.accessoryStyle ?? variants.accessoryStyle,
    bodyBuildStyle: assetSet.bodyBuildStyle ?? variants.bodyBuildStyle,
    skinTone: assetSet.skinTone ?? variants.skinTone,
    markingStyle: assetSet.markingStyle ?? variants.markingStyle,
  };
}

export function getGladiatorVisualIdentity(
  seed: string,
  visualIdentity?: GladiatorVisualIdentity,
  classId?: GladiatorClassId,
): GladiatorVisualIdentity {
  return visualIdentity ?? createGladiatorVisualIdentity(seed, classId);
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
    getGladiatorAssetSet(visualIdentity.portraitAssetId)
  );
}

function getProductionSpriteAssetSet(visualIdentity: GladiatorVisualIdentity) {
  const productionGladiators = PRODUCTION_VISUAL_ASSET_MANIFEST.gladiators;

  return (
    productionGladiators[visualIdentity.spriteAssetId] ??
    productionGladiators[visualIdentity.portraitAssetId] ??
    productionGladiators[Object.keys(productionGladiators)[0]]
  );
}

export function getGladiatorPortraitAssetPath(visualIdentity: GladiatorVisualIdentity) {
  return (
    getGeneratedPortraitAssetSet(visualIdentity)?.portrait ??
    getFallbackGladiatorAssetSet().portrait
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
