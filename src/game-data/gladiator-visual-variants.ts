import type { GladiatorClassId } from '../domain/gladiators/types';

export const GLADIATOR_CLOTHING_STYLES = [
  'subligaculum',
  'linenTunic',
  'leatherHarness',
  'paddedManica',
  'bronzeCuirass',
] as const;

export const GLADIATOR_CLOTHING_COLORS = [
  'madderRed',
  'ochre',
  'olive',
  'indigo',
  'linenWhite',
] as const;

export const GLADIATOR_HAIR_AND_BEARD_STYLES = [
  'cropped',
  'curly',
  'shaved',
  'braidedBeard',
  'fullBeard',
] as const;

export const GLADIATOR_HEADWEAR_STYLES = [
  'none',
  'clothWrap',
  'bronzeGalea',
  'crestedHelmet',
  'ironMask',
] as const;

export const GLADIATOR_ACCESSORY_STYLES = [
  'gladiusScutum',
  'sicaParmula',
  'tridentNet',
  'spearRoundShield',
  'dualDaggers',
] as const;

export const GLADIATOR_BODY_BUILD_STYLES = ['compact', 'lean', 'broad', 'tall', 'stocky'] as const;

export const GLADIATOR_SKIN_TONES = ['olive', 'tan', 'bronze', 'umber', 'dark'] as const;

export const GLADIATOR_MARKING_STYLES = [
  'none',
  'cheekScar',
  'browScar',
  'warPaint',
  'arenaDust',
] as const;

export type GladiatorClothingStyle = (typeof GLADIATOR_CLOTHING_STYLES)[number];
export type GladiatorClothingColor = (typeof GLADIATOR_CLOTHING_COLORS)[number];
export type GladiatorHairAndBeardStyle = (typeof GLADIATOR_HAIR_AND_BEARD_STYLES)[number];
export type GladiatorHeadwearStyle = (typeof GLADIATOR_HEADWEAR_STYLES)[number];
export type GladiatorAccessoryStyle = (typeof GLADIATOR_ACCESSORY_STYLES)[number];
export type GladiatorBodyBuildStyle = (typeof GLADIATOR_BODY_BUILD_STYLES)[number];
export type GladiatorSkinTone = (typeof GLADIATOR_SKIN_TONES)[number];
export type GladiatorMarkingStyle = (typeof GLADIATOR_MARKING_STYLES)[number];

export interface GladiatorVisualVariantSet {
  clothingStyle: GladiatorClothingStyle;
  clothingColor: GladiatorClothingColor;
  hairAndBeardStyle: GladiatorHairAndBeardStyle;
  headwearStyle: GladiatorHeadwearStyle;
  accessoryStyle: GladiatorAccessoryStyle;
  bodyBuildStyle: GladiatorBodyBuildStyle;
  skinTone: GladiatorSkinTone;
  markingStyle: GladiatorMarkingStyle;
}

export const GLADIATOR_VISUAL_VARIANTS = {
  clothingStyles: GLADIATOR_CLOTHING_STYLES,
  clothingColors: GLADIATOR_CLOTHING_COLORS,
  hairAndBeardStyles: GLADIATOR_HAIR_AND_BEARD_STYLES,
  headwearStyles: GLADIATOR_HEADWEAR_STYLES,
  accessoryStyles: GLADIATOR_ACCESSORY_STYLES,
  bodyBuildStyles: GLADIATOR_BODY_BUILD_STYLES,
  skinTones: GLADIATOR_SKIN_TONES,
  markingStyles: GLADIATOR_MARKING_STYLES,
} as const;

const ACCESSORY_BY_CLASS: Record<GladiatorClassId, GladiatorAccessoryStyle> = {
  murmillo: 'gladiusScutum',
  retiarius: 'tridentNet',
  secutor: 'gladiusScutum',
  thraex: 'sicaParmula',
  hoplomachus: 'spearRoundShield',
};

function getStableIndex(seed: string, length: number, salt: string) {
  const total = Array.from(`${seed}:${salt}`).reduce(
    (value, character) => value + character.charCodeAt(0),
    0,
  );

  return total % length;
}

function pickVariant<T extends readonly string[]>(
  variants: T,
  seed: string,
  salt: string,
): T[number] {
  return variants[getStableIndex(seed, variants.length, salt)];
}

export function createGladiatorVisualVariantSet(
  seed: string,
  classId?: GladiatorClassId,
): GladiatorVisualVariantSet {
  return {
    clothingStyle: pickVariant(GLADIATOR_CLOTHING_STYLES, seed, 'clothing-style'),
    clothingColor: pickVariant(GLADIATOR_CLOTHING_COLORS, seed, 'clothing-color'),
    hairAndBeardStyle: pickVariant(GLADIATOR_HAIR_AND_BEARD_STYLES, seed, 'hair-beard'),
    headwearStyle: pickVariant(GLADIATOR_HEADWEAR_STYLES, seed, 'headwear'),
    accessoryStyle: classId
      ? ACCESSORY_BY_CLASS[classId]
      : pickVariant(GLADIATOR_ACCESSORY_STYLES, seed, 'accessory'),
    bodyBuildStyle: pickVariant(GLADIATOR_BODY_BUILD_STYLES, seed, 'body-build'),
    skinTone: pickVariant(GLADIATOR_SKIN_TONES, seed, 'skin-tone'),
    markingStyle: pickVariant(GLADIATOR_MARKING_STYLES, seed, 'marking'),
  };
}
