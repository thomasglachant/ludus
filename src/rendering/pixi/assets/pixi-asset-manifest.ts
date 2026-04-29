import { PRODUCTION_VISUAL_ASSET_MANIFEST } from '../../../game-data/visual-assets';
import {
  PIXI_ASSET_BUNDLE_IDS,
  PIXI_BUILDING_IDS,
  PIXI_BUILDING_PARTS,
  PIXI_COMBAT_ANIMATION_KEYS,
  PIXI_GLADIATOR_FRAME_COUNT,
  PIXI_HOMEPAGE_PHASES,
  PIXI_MAP_ANIMATION_KEYS,
  PIXI_RENDER_LAYERS,
  pixiSpritesheetAliases,
  pixiTextureAliases,
  type PixiAnimationKey,
  type PixiAssetBundleId,
  type PixiCombatAnimationKey,
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
  src: string;
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
  src?: string;
  atlasSrc?: string;
  textureAliases: string[];
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
  bundles: Record<PixiAssetBundleId, PixiAssetBundleDefinition>;
  textures: Record<string, PixiTextureAsset>;
  spritesheets: Record<string, PixiSpritesheetAsset>;
}

const productionManifest = PRODUCTION_VISUAL_ASSET_MANIFEST;
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

function createTextureAsset(
  alias: string,
  bundleId: PixiAssetBundleId,
  src: string,
  renderLayer: PixiRenderLayerId,
  options: { anchor?: PixiPoint; hitbox?: PixiRect; tags?: string[] } = {},
): PixiTextureAsset {
  return {
    alias,
    bundleId,
    sourceQuality: productionQuality,
    src,
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
  for (const [assetId, src] of Object.entries(productionManifest.ui)) {
    addTexture(
      textures,
      createTextureAsset(
        pixiTextureAliases.coreUi(assetId),
        'core-ui',
        src,
        PIXI_RENDER_LAYERS.uiBase,
        {
          tags: ['ui'],
        },
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
    const src = productionManifest.homepage.backgrounds[phase];

    if (!src) {
      continue;
    }

    addTexture(
      textures,
      createTextureAsset(
        pixiTextureAliases.homepageBackground(phase),
        'main-menu',
        src,
        PIXI_RENDER_LAYERS.homepageBackground,
        { hitbox: rect(1440, 980), tags: ['homepage', phase] },
      ),
      bundles,
    );
  }

  if (productionManifest.homepage.lastSaveThumbnail) {
    addTexture(
      textures,
      createTextureAsset(
        pixiTextureAliases.homepageLastSaveThumbnail,
        'main-menu',
        productionManifest.homepage.lastSaveThumbnail,
        PIXI_RENDER_LAYERS.homepageBackground,
        { hitbox: rect(320, 180), tags: ['homepage', 'thumbnail'] },
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
    for (const [levelKey, assetSet] of Object.entries(
      productionManifest.buildings[buildingId] ?? {},
    )) {
      const level = Number(levelKey.replace('level-', ''));

      if (!Number.isFinite(level)) {
        continue;
      }

      for (const part of PIXI_BUILDING_PARTS) {
        const src = assetSet[part];

        if (!src) {
          continue;
        }

        addTexture(
          textures,
          createTextureAsset(
            pixiTextureAliases.building(buildingId, level, part),
            'buildings',
            src,
            PIXI_RENDER_LAYERS.mapBuildings,
            {
              anchor: point(0.5, 1),
              hitbox: rect(assetSet.width, assetSet.height, -assetSet.width / 2, -assetSet.height),
              tags: ['building', buildingId, `level-${level}`, part],
            },
          ),
          bundles,
        );
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
    addTexture(
      textures,
      createTextureAsset(
        pixiTextureAliases.gladiatorPortrait(variantId),
        'core-ui',
        assetSet.portrait,
        PIXI_RENDER_LAYERS.uiBase,
        {
          anchor: point(0.5, 0.5),
          hitbox: rect(128, 128, -64, -64),
          tags: ['gladiator', 'portrait'],
        },
      ),
      bundles,
    );

    const mapAnimations: Record<string, PixiAnimationDefinition> = {};
    const mapFrameAliases: string[] = [];

    for (const animationKey of PIXI_MAP_ANIMATION_KEYS) {
      const frameAliases = (assetSet.frames[animationKey] ?? [])
        .slice(0, PIXI_GLADIATOR_FRAME_COUNT)
        .map((src, index) => {
          const alias = pixiTextureAliases.gladiatorMapFrame(variantId, animationKey, index);
          addTexture(
            textures,
            createTextureAsset(alias, 'gladiators-map', src, PIXI_RENDER_LAYERS.mapCharacters, {
              anchor: point(0.5, 1),
              hitbox: rect(64, 96, -32, -96),
              tags: ['gladiator', 'map', variantId, animationKey],
            }),
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
        sourceQuality: productionQuality,
        src: assetSet.mapSpritesheet,
        atlasSrc: assetSet.mapAtlas,
        textureAliases: mapFrameAliases,
        animations: mapAnimations,
        tags: ['gladiator', 'map', variantId],
      },
      bundles,
    );

    const combatAnimations: Record<string, PixiAnimationDefinition> = {};
    const combatFrameAliases: string[] = [];

    for (const animationKey of PIXI_COMBAT_ANIMATION_KEYS) {
      const sourceAnimationKey = combatAnimationSourceKeyByAnimationKey[animationKey];
      const frameAliases = (assetSet.frames[sourceAnimationKey] ?? [])
        .slice(0, PIXI_GLADIATOR_FRAME_COUNT)
        .map((src, index) => {
          const alias = pixiTextureAliases.gladiatorCombatFrame(variantId, animationKey, index);
          addTexture(
            textures,
            createTextureAsset(alias, 'gladiators-combat', src, PIXI_RENDER_LAYERS.combatFighters, {
              anchor: point(0.5, 1),
              hitbox: rect(120, 180, -60, -180),
              tags: ['gladiator', 'combat', variantId, animationKey],
            }),
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
        sourceQuality: productionQuality,
        src: assetSet.combatSpritesheet,
        atlasSrc: assetSet.combatAtlas,
        textureAliases: combatFrameAliases,
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
    createTextureAsset(
      pixiTextureAliases.combatBackground,
      'combat',
      productionManifest.locations.arena.combatBackground,
      PIXI_RENDER_LAYERS.combatBackground,
      { hitbox: rect(960, 480), tags: ['combat', 'arena'] },
    ),
    bundles,
  );

  addTexture(
    textures,
    createTextureAsset(
      pixiTextureAliases.combatCrowd,
      'combat',
      productionManifest.locations.arena.crowd,
      PIXI_RENDER_LAYERS.combatCrowd,
      { hitbox: rect(960, 160), tags: ['combat', 'crowd'] },
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
  addBuildingAssets(textures, bundles);
  addGladiatorAssets(textures, spritesheets, bundles);
  addCombatAssets(textures, bundles);

  return {
    version: 1,
    generatedAt: productionManifest.generatedAt,
    bundles,
    textures,
    spritesheets,
  };
}

export const PIXI_PRODUCTION_ASSET_MANIFEST = createPixiProductionAssetManifest();

export function getPixiTextureSource(asset: PixiTextureAsset) {
  return asset.src;
}
