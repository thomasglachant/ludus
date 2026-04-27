import type { Gladiator, GladiatorVisualIdentity } from '../domain/gladiators/types';
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

const LEGACY_GLADIATOR_PORTRAIT_ASSET_IDS = [
  'portrait-bronze-crop',
  'portrait-red-crest',
  'portrait-olive-scarf',
  'portrait-blue-tunic',
  'portrait-gold-helm',
  'portrait-ash-beard',
  'portrait-sand-wrap',
  'portrait-iron-mask',
] as const;

const LEGACY_GLADIATOR_SPRITE_ASSET_IDS = [
  'sprite-bronze-crop',
  'sprite-red-crest',
  'sprite-olive-scarf',
  'sprite-blue-tunic',
  'sprite-gold-helm',
  'sprite-ash-beard',
  'sprite-sand-wrap',
  'sprite-iron-mask',
] as const;

export const GLADIATOR_PORTRAIT_ASSET_IDS = GLADIATOR_VISUAL_ASSET_IDS;
export const GLADIATOR_SPRITE_ASSET_IDS = GLADIATOR_VISUAL_ASSET_IDS;

const LEGACY_GLADIATOR_PORTRAIT_ASSET_PATHS: Record<string, string> = Object.fromEntries(
  LEGACY_GLADIATOR_PORTRAIT_ASSET_IDS.map((assetId) => [
    assetId,
    `/assets/portraits/${assetId}.svg`,
  ]),
);

const LEGACY_GLADIATOR_SPRITE_ASSET_PATHS: Record<string, string> = Object.fromEntries(
  LEGACY_GLADIATOR_SPRITE_ASSET_IDS.map((assetId) => [assetId, `/assets/sprites/${assetId}.svg`]),
);

function getStableIndex(seed: string, length: number) {
  const total = Array.from(seed).reduce((value, character) => value + character.charCodeAt(0), 0);

  return total % length;
}

function getFrameNames(frameKey: GladiatorFrameKey, count: number) {
  return Array.from({ length: count }, (_, index) => `${frameKey}-${index}.png`);
}

function getUsableSpriteAssetSet(visualIdentity: GladiatorVisualIdentity) {
  return getGeneratedSpriteAssetSet(visualIdentity) ?? getFallbackGladiatorAssetSet();
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

export function createGladiatorVisualIdentity(seed: string): GladiatorVisualIdentity {
  const assetId =
    GLADIATOR_VISUAL_ASSET_IDS[getStableIndex(seed, GLADIATOR_VISUAL_ASSET_IDS.length)];
  const assetSet = getGladiatorAssetSet(assetId) ?? getFallbackGladiatorAssetSet();

  return {
    portraitAssetId: assetId,
    spriteAssetId: assetId,
    paletteId: assetSet.paletteId,
    bodyType: assetSet.bodyType,
    hairStyle: assetSet.hairStyle,
    armorStyle: assetSet.armorStyle,
  };
}

export function getGladiatorVisualIdentity(
  seed: string,
  visualIdentity?: GladiatorVisualIdentity,
): GladiatorVisualIdentity {
  return visualIdentity ?? createGladiatorVisualIdentity(seed);
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
    LEGACY_GLADIATOR_PORTRAIT_ASSET_PATHS[visualIdentity.portraitAssetId] ??
    getFallbackGladiatorAssetSet().portrait
  );
}

export function getGladiatorSpriteAssetPath(visualIdentity: GladiatorVisualIdentity) {
  return getGladiatorSpriteFrames(visualIdentity, 'idle')[0];
}

export function getGladiatorSpriteFrames(
  visualIdentity: GladiatorVisualIdentity,
  animation: GladiatorMapAnimationId,
) {
  const frameKey = getGladiatorMapAnimationDefinitionById(animation).frameKey;
  const frames = getGeneratedSpriteAssetSet(visualIdentity)?.frames[frameKey];

  if (frames?.length) {
    return frames;
  }

  const legacySprite = LEGACY_GLADIATOR_SPRITE_ASSET_PATHS[visualIdentity.spriteAssetId];

  return legacySprite ? [legacySprite] : (getFallbackGladiatorAssetSet().frames[frameKey] ?? []);
}

export function getCombatSpriteFrames(
  visualIdentity: GladiatorVisualIdentity,
  animation: CombatSpriteAnimationState,
) {
  const definition = getGladiatorCombatAnimationDefinitionById(animation);
  const assetSet = getUsableSpriteAssetSet(visualIdentity);
  const frameKey = getAnimationFrameKey(assetSet, definition);
  const frames = assetSet.frames[frameKey];

  if (frames?.length) {
    return frames;
  }

  return getFallbackGladiatorAssetSet().frames[frameKey] ?? [];
}

export function getGladiatorCombatSpriteFrames(
  gladiator: Pick<Gladiator, 'id' | 'visualIdentity'>,
  animation: CombatSpriteAnimationState,
) {
  return getCombatSpriteFrames(
    getGladiatorVisualIdentity(gladiator.id, gladiator.visualIdentity),
    animation,
  );
}

export function getGladiatorMapAnimationAsset(
  visualIdentity: GladiatorVisualIdentity,
  animation: GladiatorMapAnimationId,
): GladiatorAnimationAsset<GladiatorMapAnimationDefinition> {
  const generatedAssetSet = getGeneratedSpriteAssetSet(visualIdentity);
  const definition = getGladiatorMapAnimationDefinitionById(animation);
  const legacySprite = LEGACY_GLADIATOR_SPRITE_ASSET_PATHS[visualIdentity.spriteAssetId];

  if (!generatedAssetSet && legacySprite) {
    return {
      definition,
      fallbackFramePaths: [legacySprite],
      frameNames: [],
    };
  }

  const assetSet = generatedAssetSet ?? getFallbackGladiatorAssetSet();

  return createAnimationAsset(assetSet, definition, {
    atlasPath: assetSet.mapAtlas,
    spritesheetPath: assetSet.mapSpritesheet,
  });
}

export function getGladiatorCombatAnimationAsset(
  visualIdentity: GladiatorVisualIdentity,
  animation: GladiatorCombatAnimationId,
): GladiatorAnimationAsset<GladiatorCombatAnimationDefinition> {
  const assetSet = getUsableSpriteAssetSet(visualIdentity);

  return createAnimationAsset(assetSet, getGladiatorCombatAnimationDefinitionById(animation), {
    atlasPath: assetSet.combatAtlas,
    spritesheetPath: assetSet.combatSpritesheet,
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
