import type { GladiatorVisualIdentity } from '../domain/gladiators/types';

export const GLADIATOR_PORTRAIT_ASSET_IDS = [
  'portrait-bronze-crop',
  'portrait-red-crest',
  'portrait-olive-scarf',
  'portrait-blue-tunic',
  'portrait-gold-helm',
  'portrait-ash-beard',
  'portrait-sand-wrap',
  'portrait-iron-mask',
] as const;

export const GLADIATOR_SPRITE_ASSET_IDS = [
  'sprite-bronze-crop',
  'sprite-red-crest',
  'sprite-olive-scarf',
  'sprite-blue-tunic',
  'sprite-gold-helm',
  'sprite-ash-beard',
  'sprite-sand-wrap',
  'sprite-iron-mask',
] as const;

export const GLADIATOR_PORTRAIT_ASSET_PATHS: Record<string, string> = Object.fromEntries(
  GLADIATOR_PORTRAIT_ASSET_IDS.map((assetId) => [assetId, `/assets/portraits/${assetId}.svg`]),
);

export const GLADIATOR_SPRITE_ASSET_PATHS: Record<string, string> = Object.fromEntries(
  GLADIATOR_SPRITE_ASSET_IDS.map((assetId) => [assetId, `/assets/sprites/${assetId}.svg`]),
);

const paletteIds = ['terracotta', 'olive', 'bronze', 'indigo', 'sand'] as const;
const bodyTypes = ['compact', 'broad', 'lean'] as const;
const hairStyles = ['cropped', 'curly', 'shaved', 'tied'] as const;
const armorStyles = ['cloth', 'leather', 'bronze', 'training'] as const;

function getStableIndex(seed: string, length: number) {
  const total = Array.from(seed).reduce((value, character) => value + character.charCodeAt(0), 0);

  return total % length;
}

export function createGladiatorVisualIdentity(seed: string): GladiatorVisualIdentity {
  const portraitIndex = getStableIndex(seed, GLADIATOR_PORTRAIT_ASSET_IDS.length);
  const spriteIndex = getStableIndex(`${seed}-sprite`, GLADIATOR_SPRITE_ASSET_IDS.length);

  return {
    portraitAssetId: GLADIATOR_PORTRAIT_ASSET_IDS[portraitIndex],
    spriteAssetId: GLADIATOR_SPRITE_ASSET_IDS[spriteIndex],
    paletteId: paletteIds[getStableIndex(`${seed}-palette`, paletteIds.length)],
    bodyType: bodyTypes[getStableIndex(`${seed}-body`, bodyTypes.length)],
    hairStyle: hairStyles[getStableIndex(`${seed}-hair`, hairStyles.length)],
    armorStyle: armorStyles[getStableIndex(`${seed}-armor`, armorStyles.length)],
  };
}

export function getGladiatorVisualIdentity(
  seed: string,
  visualIdentity?: GladiatorVisualIdentity,
): GladiatorVisualIdentity {
  return visualIdentity ?? createGladiatorVisualIdentity(seed);
}

export function getGladiatorPortraitAssetPath(visualIdentity: GladiatorVisualIdentity) {
  return GLADIATOR_PORTRAIT_ASSET_PATHS[visualIdentity.portraitAssetId];
}

export function getGladiatorSpriteAssetPath(visualIdentity: GladiatorVisualIdentity) {
  return GLADIATOR_SPRITE_ASSET_PATHS[visualIdentity.spriteAssetId];
}
