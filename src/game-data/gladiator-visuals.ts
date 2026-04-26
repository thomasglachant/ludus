import type { Gladiator, GladiatorVisualIdentity } from '../domain/gladiators/types';
import type { GladiatorAnimationState } from './gladiator-animations';
import {
  getFallbackGladiatorAssetSet,
  getGladiatorAssetSet,
  GLADIATOR_VISUAL_ASSET_IDS,
} from './visual-assets';
import type { CombatFrameKey, MapFrameKey } from './visual-assets';

export type CombatSpriteAnimationState = 'idle' | 'attack' | 'hit' | 'defeat';

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

const mapFrameKeyByAnimationState: Record<GladiatorAnimationState, MapFrameKey> = {
  idle: 'map-idle',
  walking: 'map-walk',
  training: 'map-train',
  eating: 'map-eat',
  resting: 'map-rest',
  celebrating: 'map-celebrate',
  healing: 'map-healing',
};

const combatFrameKeyByAnimationState: Record<CombatSpriteAnimationState, CombatFrameKey> = {
  idle: 'combat-idle',
  attack: 'combat-attack',
  hit: 'combat-idle',
  defeat: 'combat-idle',
};

function getStableIndex(seed: string, length: number) {
  const total = Array.from(seed).reduce((value, character) => value + character.charCodeAt(0), 0);

  return total % length;
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
  animation: GladiatorAnimationState,
) {
  const frameKey = mapFrameKeyByAnimationState[animation];
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
  const frameKey = combatFrameKeyByAnimationState[animation];
  const frames = getGeneratedSpriteAssetSet(visualIdentity)?.frames[frameKey];

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
