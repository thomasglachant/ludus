export const PIXI_ASSET_BUNDLE_IDS = [
  'core-ui',
  'main-menu',
  'map-base',
  'map-ambient',
  'buildings',
  'gladiators-map',
  'gladiators-combat',
  'combat',
] as const;

export type PixiAssetBundleId = (typeof PIXI_ASSET_BUNDLE_IDS)[number];

export const PIXI_SOURCE_QUALITIES = ['placeholder', 'production'] as const;

export type PixiSourceQuality = (typeof PIXI_SOURCE_QUALITIES)[number];

export const PIXI_RENDER_LAYERS = {
  uiBase: 'ui.base',
  homepageBackground: 'homepage.background',
  mapBackground: 'map.background',
  mapTerrain: 'map.terrain',
  mapPaths: 'map.paths',
  mapDecorations: 'map.decorations',
  mapBuildings: 'map.buildings',
  mapAmbientBack: 'map.ambient.back',
  mapAmbientFront: 'map.ambient.front',
  mapCharacters: 'map.characters',
  combatBackground: 'combat.background',
  combatCrowd: 'combat.crowd',
  combatFighters: 'combat.fighters',
  combatFx: 'combat.fx',
} as const;

export type PixiRenderLayerId = (typeof PIXI_RENDER_LAYERS)[keyof typeof PIXI_RENDER_LAYERS];

export const PIXI_MAP_PHASES = ['dawn', 'day', 'dusk', 'night'] as const;
export type PixiMapPhase = (typeof PIXI_MAP_PHASES)[number];

export const PIXI_HOMEPAGE_PHASES = ['day', 'dusk'] as const;
export type PixiHomepagePhase = (typeof PIXI_HOMEPAGE_PHASES)[number];

export const PIXI_BUILDING_IDS = [
  'domus',
  'canteen',
  'dormitory',
  'trainingGround',
  'pleasureHall',
  'infirmary',
] as const;

export type PixiBuildingId = (typeof PIXI_BUILDING_IDS)[number];

export const PIXI_BUILDING_LEVELS = [0, 1, 2, 3] as const;
export type PixiBuildingLevel = (typeof PIXI_BUILDING_LEVELS)[number];

export const PIXI_BUILDING_PARTS = ['exterior', 'roof', 'interior', 'props'] as const;
export type PixiBuildingPart = (typeof PIXI_BUILDING_PARTS)[number];

export const PIXI_LOCATION_IDS = ['market', 'arena'] as const;
export type PixiLocationId = (typeof PIXI_LOCATION_IDS)[number];

export const PIXI_MAP_ANIMATION_KEYS = [
  'map-idle',
  'map-walk',
  'map-train',
  'map-eat',
  'map-rest',
  'map-celebrate',
  'map-healing',
] as const;

export type PixiMapAnimationKey = (typeof PIXI_MAP_ANIMATION_KEYS)[number];

export const PIXI_COMBAT_ANIMATION_KEYS = [
  'combat-idle',
  'combat-attack',
  'combat-hit',
  'combat-block',
  'combat-defeat',
  'combat-victory',
] as const;
export type PixiCombatAnimationKey = (typeof PIXI_COMBAT_ANIMATION_KEYS)[number];

export type PixiAnimationKey = PixiMapAnimationKey | PixiCombatAnimationKey;

export const PIXI_GLADIATOR_FRAME_COUNT = 2;

export const pixiTextureAliases = {
  coreUi: (assetId: string) => `ui:${assetId}`,
  homepageBackground: (phase: PixiHomepagePhase) => `homepage:background:${phase}`,
  homepageLastSaveThumbnail: 'homepage:last-save-thumbnail',
  mapBackground: (phase: PixiMapPhase) => `map:background:${phase}`,
  mapAmbient: (assetId: string) => `map:ambient:${assetId}`,
  building: (buildingId: PixiBuildingId, level: PixiBuildingLevel, part: PixiBuildingPart) =>
    `building:${buildingId}:level-${level}:${part}`,
  location: (locationId: PixiLocationId, part: string) => `location:${locationId}:${part}`,
  gladiatorPortrait: (variantId: string) => `gladiator:${variantId}:portrait`,
  gladiatorMapFrame: (variantId: string, animationKey: PixiMapAnimationKey, frameIndex: number) =>
    `gladiator:${variantId}:${animationKey}:${frameIndex}`,
  gladiatorCombatFrame: (
    variantId: string,
    animationKey: PixiCombatAnimationKey,
    frameIndex: number,
  ) => `gladiator:${variantId}:${animationKey}:${frameIndex}`,
  combatBackground: 'combat:arena:background',
  combatCrowd: 'combat:arena:crowd',
} as const;

export const pixiSpritesheetAliases = {
  gladiatorMap: (variantId: string) => `spritesheet:gladiator:${variantId}:map`,
  gladiatorCombat: (variantId: string) => `spritesheet:gladiator:${variantId}:combat`,
} as const;
