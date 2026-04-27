import { featureFlags } from '../../../config/features';
import productionManifestData from '../../../game-data/generated/asset-manifest.production.json';
import visualMigrationManifestData from '../../../game-data/generated/asset-manifest.visual-migration.json';
import {
  PIXI_ASSET_BUNDLE_IDS,
  PIXI_BUILDING_IDS,
  PIXI_BUILDING_LEVELS,
  PIXI_BUILDING_PARTS,
  PIXI_COMBAT_ANIMATION_KEYS,
  PIXI_GLADIATOR_FRAME_COUNT,
  PIXI_HOMEPAGE_PHASES,
  PIXI_MAP_ANIMATION_KEYS,
  PIXI_MAP_PHASES,
  PIXI_RENDER_LAYERS,
  pixiSpritesheetAliases,
  pixiTextureAliases,
  type PixiAnimationKey,
  type PixiAssetBundleId,
  type PixiBuildingId,
  type PixiCombatAnimationKey,
  type PixiHomepagePhase,
  type PixiMapPhase,
  type PixiRenderLayerId,
  type PixiSourceQuality,
} from './texture-aliases';

export interface PixiPoint {
  x: number;
  y: number;
}

export interface PixiRect extends PixiPoint {
  width: number;
  height: number;
}

export interface PixiTextureAsset {
  alias: string;
  bundleId: PixiAssetBundleId;
  sourceQuality: PixiSourceQuality;
  productionSrc?: string;
  fallbackSrc: string;
  anchor: PixiPoint;
  hitbox?: PixiRect;
  renderLayer: PixiRenderLayerId;
  tags: string[];
}

export interface PixiAnimationDefinition {
  key: PixiAnimationKey;
  frameAliases: string[];
  fps: number;
  loop: boolean;
  anchor: PixiPoint;
  hitbox?: PixiRect;
  renderLayer: PixiRenderLayerId;
  ySortOffset: number;
}

export interface PixiSpritesheetAsset {
  alias: string;
  bundleId: PixiAssetBundleId;
  sourceQuality: PixiSourceQuality;
  productionSrc?: string;
  productionAtlasSrc?: string;
  fallbackTextureAliases: string[];
  animations: Record<string, PixiAnimationDefinition>;
  tags: string[];
}

export interface PixiAssetBundleDefinition {
  id: PixiAssetBundleId;
  textureAliases: string[];
  spritesheetAliases: string[];
}

export interface PixiProductionAssetManifest {
  version: 1;
  generatedAt: string;
  fallbackManifest: {
    id: 'visual-migration-svg';
    generatedAt: string;
  };
  bundles: Record<PixiAssetBundleId, PixiAssetBundleDefinition>;
  textures: Record<string, PixiTextureAsset>;
  spritesheets: Record<string, PixiSpritesheetAsset>;
}

interface VisualMigrationBuildingAssetSet {
  sourceQuality?: string;
  exterior: string;
  roof?: string;
  interior?: string;
  props?: string;
  width: number;
  height: number;
}

interface VisualMigrationGladiatorAssetSet {
  sourceQuality?: string;
  portrait: string;
  mapSpritesheet?: string;
  mapAtlas?: string;
  combatSpritesheet?: string;
  combatAtlas?: string;
  frames: Partial<Record<PixiAnimationKey, string[]>>;
}

interface VisualMigrationManifest {
  sourceQuality?: string;
  generatedAt: string;
  homepage: {
    sourceQuality?: string;
    backgrounds: Partial<Record<PixiHomepagePhase, string>>;
    lastSaveThumbnail: string;
  };
  map: {
    sourceQuality?: string;
    backgrounds: Record<PixiMapPhase, string>;
    ambient: Record<string, string>;
  };
  buildings: Record<PixiBuildingId, Record<string, VisualMigrationBuildingAssetSet>>;
  locations: {
    market: Record<string, string>;
    arena: Record<string, string>;
  };
  gladiators: Record<string, VisualMigrationGladiatorAssetSet>;
  ui: Record<string, string>;
}

const fallbackManifest = visualMigrationManifestData as VisualMigrationManifest;
const productionManifest = productionManifestData as VisualMigrationManifest;
const placeholderQuality = 'placeholder' satisfies PixiSourceQuality;
const productionQuality = 'production' satisfies PixiSourceQuality;
const combatAnimationSourceKeyByAnimationKey: Record<
  PixiCombatAnimationKey,
  PixiCombatAnimationKey
> = {
  'combat-idle': 'combat-idle',
  'combat-attack': 'combat-attack',
  'combat-hit': 'combat-idle',
  'combat-block': 'combat-idle',
  'combat-defeat': 'combat-idle',
  'combat-victory': 'combat-idle',
};

function point(x: number, y: number): PixiPoint {
  return { x, y };
}

function rect(width: number, height: number, x = 0, y = 0): PixiRect {
  return { x, y, width, height };
}

function createFallbackTextureAsset(
  alias: string,
  bundleId: PixiAssetBundleId,
  fallbackSrc: string,
  renderLayer: PixiRenderLayerId,
  options: {
    anchor?: PixiPoint;
    hitbox?: PixiRect;
    productionSrc?: string;
    tags?: string[];
  } = {},
): PixiTextureAsset {
  const sourceQuality = options.productionSrc ? productionQuality : placeholderQuality;

  return {
    alias,
    bundleId,
    sourceQuality,
    productionSrc: options.productionSrc,
    fallbackSrc,
    anchor: options.anchor ?? point(0, 0),
    hitbox: options.hitbox,
    renderLayer,
    tags: options.tags ?? [],
  };
}

function addTexture(
  textures: Record<string, PixiTextureAsset>,
  asset: PixiTextureAsset,
  bundles: Record<PixiAssetBundleId, PixiAssetBundleDefinition>,
) {
  textures[asset.alias] = asset;
  bundles[asset.bundleId].textureAliases.push(asset.alias);
}

function addSpritesheet(
  spritesheets: Record<string, PixiSpritesheetAsset>,
  spritesheet: PixiSpritesheetAsset,
  bundles: Record<PixiAssetBundleId, PixiAssetBundleDefinition>,
) {
  spritesheets[spritesheet.alias] = spritesheet;
  bundles[spritesheet.bundleId].spritesheetAliases.push(spritesheet.alias);
}

function createBundleDefinitions(): Record<PixiAssetBundleId, PixiAssetBundleDefinition> {
  const bundles = {} as Record<PixiAssetBundleId, PixiAssetBundleDefinition>;

  for (const id of PIXI_ASSET_BUNDLE_IDS) {
    bundles[id] = { id, textureAliases: [], spritesheetAliases: [] };
  }

  return bundles;
}

function createFrameAnimation(
  key: PixiAnimationKey,
  frameAliases: string[],
  renderLayer: PixiRenderLayerId,
  fps: number,
  hitbox: PixiRect,
  ySortOffset = 0,
): PixiAnimationDefinition {
  return {
    key,
    frameAliases,
    fps,
    loop: true,
    anchor: point(0.5, 1),
    hitbox,
    renderLayer,
    ySortOffset,
  };
}

function addCoreUiAssets(
  textures: Record<string, PixiTextureAsset>,
  bundles: Record<PixiAssetBundleId, PixiAssetBundleDefinition>,
) {
  for (const [assetId, fallbackSrc] of Object.entries(fallbackManifest.ui)) {
    const productionSrc = productionManifest.ui[assetId];

    addTexture(
      textures,
      createFallbackTextureAsset(
        pixiTextureAliases.coreUi(assetId),
        'core-ui',
        fallbackSrc,
        PIXI_RENDER_LAYERS.uiBase,
        { productionSrc, tags: ['ui'] },
      ),
      bundles,
    );
  }
}

function addMainMenuAssets(
  textures: Record<string, PixiTextureAsset>,
  bundles: Record<PixiAssetBundleId, PixiAssetBundleDefinition>,
) {
  for (const phase of PIXI_HOMEPAGE_PHASES) {
    const fallbackSrc = fallbackManifest.homepage.backgrounds[phase];
    const productionSrc = productionManifest.homepage.backgrounds[phase];

    if (fallbackSrc) {
      addTexture(
        textures,
        createFallbackTextureAsset(
          pixiTextureAliases.homepageBackground(phase),
          'main-menu',
          fallbackSrc,
          PIXI_RENDER_LAYERS.homepageBackground,
          { hitbox: rect(1440, 980), productionSrc, tags: ['homepage', phase] },
        ),
        bundles,
      );
    }
  }

  addTexture(
    textures,
    createFallbackTextureAsset(
      pixiTextureAliases.homepageLastSaveThumbnail,
      'main-menu',
      fallbackManifest.homepage.lastSaveThumbnail,
      PIXI_RENDER_LAYERS.homepageBackground,
      {
        hitbox: rect(320, 180),
        productionSrc: productionManifest.homepage.lastSaveThumbnail,
        tags: ['homepage', 'thumbnail'],
      },
    ),
    bundles,
  );
}

function addMapBaseAssets(
  textures: Record<string, PixiTextureAsset>,
  bundles: Record<PixiAssetBundleId, PixiAssetBundleDefinition>,
) {
  for (const phase of PIXI_MAP_PHASES) {
    const productionSrc = productionManifest.map.backgrounds[phase];

    addTexture(
      textures,
      createFallbackTextureAsset(
        pixiTextureAliases.mapBackground(phase),
        'map-base',
        fallbackManifest.map.backgrounds[phase],
        PIXI_RENDER_LAYERS.mapBackground,
        { hitbox: rect(3200, 2000), productionSrc, tags: ['map', 'background', phase] },
      ),
      bundles,
    );
  }

  for (const [part, fallbackSrc] of Object.entries(fallbackManifest.locations.market)) {
    const productionSrc = productionManifest.locations.market[part];

    if (!productionSrc) {
      continue;
    }

    addTexture(
      textures,
      createFallbackTextureAsset(
        pixiTextureAliases.location('market', part),
        'map-base',
        fallbackSrc,
        PIXI_RENDER_LAYERS.mapBuildings,
        {
          anchor: point(0.5, 1),
          hitbox: rect(260, 180, -130, -180),
          productionSrc,
          tags: ['map', 'market'],
        },
      ),
      bundles,
    );
  }

  addTexture(
    textures,
    createFallbackTextureAsset(
      pixiTextureAliases.location('arena', 'exterior'),
      'map-base',
      fallbackManifest.locations.arena.exterior,
      PIXI_RENDER_LAYERS.mapBuildings,
      {
        anchor: point(0.5, 1),
        hitbox: rect(310, 240, -155, -240),
        productionSrc: productionManifest.locations.arena.exterior,
        tags: ['map', 'arena'],
      },
    ),
    bundles,
  );
}

function addMapAmbientAssets(
  textures: Record<string, PixiTextureAsset>,
  bundles: Record<PixiAssetBundleId, PixiAssetBundleDefinition>,
) {
  for (const [assetId, fallbackSrc] of Object.entries(fallbackManifest.map.ambient)) {
    const productionSrc = productionManifest.map.ambient[assetId];

    addTexture(
      textures,
      createFallbackTextureAsset(
        pixiTextureAliases.mapAmbient(assetId),
        'map-ambient',
        fallbackSrc,
        PIXI_RENDER_LAYERS.mapAmbientFront,
        { anchor: point(0.5, 0.5), productionSrc, tags: ['map', 'ambient'] },
      ),
      bundles,
    );
  }
}

function addBuildingAssets(
  textures: Record<string, PixiTextureAsset>,
  bundles: Record<PixiAssetBundleId, PixiAssetBundleDefinition>,
) {
  for (const buildingId of PIXI_BUILDING_IDS) {
    for (const level of PIXI_BUILDING_LEVELS) {
      const assetSet = fallbackManifest.buildings[buildingId][`level-${level}`];
      const productionAssetSet = productionManifest.buildings[buildingId]?.[`level-${level}`];

      for (const part of PIXI_BUILDING_PARTS) {
        const fallbackSrc = assetSet[part];
        const productionSrc = productionAssetSet?.[part];

        if (fallbackSrc && productionSrc) {
          addTexture(
            textures,
            createFallbackTextureAsset(
              pixiTextureAliases.building(buildingId, level, part),
              'buildings',
              fallbackSrc,
              PIXI_RENDER_LAYERS.mapBuildings,
              {
                anchor: point(0.5, 1),
                hitbox: rect(
                  assetSet.width,
                  assetSet.height,
                  -assetSet.width / 2,
                  -assetSet.height,
                ),
                productionSrc,
                tags: ['map', 'building', buildingId, `level-${level}`, part],
              },
            ),
            bundles,
          );
        }
      }
    }
  }
}

function addGladiatorAssets(
  textures: Record<string, PixiTextureAsset>,
  spritesheets: Record<string, PixiSpritesheetAsset>,
  bundles: Record<PixiAssetBundleId, PixiAssetBundleDefinition>,
) {
  for (const [variantId, assetSet] of Object.entries(productionManifest.gladiators)) {
    const fallbackAssetSet = fallbackManifest.gladiators[variantId] ?? assetSet;

    addTexture(
      textures,
      createFallbackTextureAsset(
        pixiTextureAliases.gladiatorPortrait(variantId),
        'core-ui',
        fallbackAssetSet.portrait,
        PIXI_RENDER_LAYERS.uiBase,
        {
          anchor: point(0.5, 0.5),
          hitbox: rect(128, 128, -64, -64),
          productionSrc: assetSet.portrait,
          tags: ['gladiator', 'portrait'],
        },
      ),
      bundles,
    );

    const mapAnimations: Record<string, PixiAnimationDefinition> = {};
    const mapFrameAliases: string[] = [];

    for (const animationKey of PIXI_MAP_ANIMATION_KEYS) {
      const productionFrames = assetSet.frames[animationKey] ?? [];
      const fallbackFrames = fallbackAssetSet.frames[animationKey] ?? productionFrames;
      const frameAliases = productionFrames
        .slice(0, PIXI_GLADIATOR_FRAME_COUNT)
        .map((productionSrc, index) => {
          const fallbackSrc = fallbackFrames[index] ?? productionSrc;
          const alias = pixiTextureAliases.gladiatorMapFrame(variantId, animationKey, index);
          addTexture(
            textures,
            createFallbackTextureAsset(
              alias,
              'gladiators-map',
              fallbackSrc,
              PIXI_RENDER_LAYERS.mapCharacters,
              {
                anchor: point(0.5, 1),
                hitbox: rect(64, 96, -32, -96),
                productionSrc,
                tags: ['gladiator', 'map', variantId, animationKey],
              },
            ),
            bundles,
          );
          return alias;
        });

      mapFrameAliases.push(...frameAliases);
      mapAnimations[animationKey] = createFrameAnimation(
        animationKey,
        frameAliases,
        PIXI_RENDER_LAYERS.mapCharacters,
        animationKey === 'map-walk' ? 7 : 3,
        rect(64, 96, -32, -96),
      );
    }

    addSpritesheet(
      spritesheets,
      {
        alias: pixiSpritesheetAliases.gladiatorMap(variantId),
        bundleId: 'gladiators-map',
        sourceQuality: assetSet.mapSpritesheet ? productionQuality : placeholderQuality,
        productionSrc: assetSet.mapSpritesheet,
        productionAtlasSrc: assetSet.mapAtlas,
        fallbackTextureAliases: mapFrameAliases,
        animations: mapAnimations,
        tags: ['gladiator', 'map', variantId],
      },
      bundles,
    );

    const combatAnimations: Record<string, PixiAnimationDefinition> = {};
    const combatFrameAliases: string[] = [];

    for (const animationKey of PIXI_COMBAT_ANIMATION_KEYS) {
      const sourceAnimationKey = combatAnimationSourceKeyByAnimationKey[animationKey];
      const productionFrames = assetSet.frames[sourceAnimationKey] ?? [];
      const fallbackFrames = fallbackAssetSet.frames[sourceAnimationKey] ?? productionFrames;
      const frameAliases = productionFrames
        .slice(0, PIXI_GLADIATOR_FRAME_COUNT)
        .map((productionSrc, index) => {
          const fallbackSrc = fallbackFrames[index] ?? productionSrc;
          const alias = pixiTextureAliases.gladiatorCombatFrame(variantId, animationKey, index);
          addTexture(
            textures,
            createFallbackTextureAsset(
              alias,
              'gladiators-combat',
              fallbackSrc,
              PIXI_RENDER_LAYERS.combatFighters,
              {
                anchor: point(0.5, 1),
                hitbox: rect(120, 180, -60, -180),
                productionSrc,
                tags: ['gladiator', 'combat', variantId, animationKey],
              },
            ),
            bundles,
          );
          return alias;
        });

      combatFrameAliases.push(...frameAliases);
      combatAnimations[animationKey] = createFrameAnimation(
        animationKey,
        frameAliases,
        PIXI_RENDER_LAYERS.combatFighters,
        animationKey === 'combat-attack' ? 7 : 3,
        rect(120, 180, -60, -180),
        animationKey === 'combat-defeat' ? -8 : 0,
      );
    }

    addSpritesheet(
      spritesheets,
      {
        alias: pixiSpritesheetAliases.gladiatorCombat(variantId),
        bundleId: 'gladiators-combat',
        sourceQuality: assetSet.combatSpritesheet ? productionQuality : placeholderQuality,
        productionSrc: assetSet.combatSpritesheet,
        productionAtlasSrc: assetSet.combatAtlas,
        fallbackTextureAliases: combatFrameAliases,
        animations: combatAnimations,
        tags: ['gladiator', 'combat', variantId],
      },
      bundles,
    );
  }
}

function addCombatAssets(
  textures: Record<string, PixiTextureAsset>,
  bundles: Record<PixiAssetBundleId, PixiAssetBundleDefinition>,
) {
  addTexture(
    textures,
    createFallbackTextureAsset(
      pixiTextureAliases.combatBackground,
      'combat',
      fallbackManifest.locations.arena.combatBackground,
      PIXI_RENDER_LAYERS.combatBackground,
      {
        hitbox: rect(960, 480),
        productionSrc: productionManifest.locations.arena.combatBackground,
        tags: ['combat', 'arena'],
      },
    ),
    bundles,
  );

  addTexture(
    textures,
    createFallbackTextureAsset(
      pixiTextureAliases.combatCrowd,
      'combat',
      fallbackManifest.locations.arena.crowd,
      PIXI_RENDER_LAYERS.combatCrowd,
      {
        hitbox: rect(960, 160),
        productionSrc: productionManifest.locations.arena.crowd,
        tags: ['combat', 'crowd'],
      },
    ),
    bundles,
  );
}

export function createPixiProductionAssetManifest(): PixiProductionAssetManifest {
  const bundles = createBundleDefinitions();
  const textures: Record<string, PixiTextureAsset> = {};
  const spritesheets: Record<string, PixiSpritesheetAsset> = {};

  addCoreUiAssets(textures, bundles);
  addMainMenuAssets(textures, bundles);
  addMapBaseAssets(textures, bundles);
  addMapAmbientAssets(textures, bundles);
  addBuildingAssets(textures, bundles);
  addGladiatorAssets(textures, spritesheets, bundles);
  addCombatAssets(textures, bundles);

  return {
    version: 1,
    generatedAt: fallbackManifest.generatedAt,
    fallbackManifest: {
      id: 'visual-migration-svg',
      generatedAt: fallbackManifest.generatedAt,
    },
    bundles,
    textures,
    spritesheets,
  };
}

export const PIXI_PRODUCTION_ASSET_MANIFEST = createPixiProductionAssetManifest();

export function getPixiTextureSource(
  asset: PixiTextureAsset,
  options: { allowPlaceholderFallback?: boolean } = {},
) {
  if (featureFlags.usePlaceholderArt) {
    return (options.allowPlaceholderFallback ?? true) ? asset.fallbackSrc : undefined;
  }

  if (asset.sourceQuality === 'production' && asset.productionSrc) {
    return asset.productionSrc;
  }

  if (options.allowPlaceholderFallback ?? true) {
    return asset.fallbackSrc;
  }

  return undefined;
}
