#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const fallbackManifestPath = join(
  root,
  'src',
  'game-data',
  'generated',
  'asset-manifest.visual-migration.json',
);
const productionManifestPath = join(
  root,
  'src',
  'game-data',
  'generated',
  'asset-manifest.production.json',
);
const defaultOutputPath = join(root, 'public', 'assets', 'pixi-production-asset-manifest.json');

const bundleIds = [
  'core-ui',
  'main-menu',
  'map-base',
  'map-ambient',
  'buildings',
  'gladiators-map',
  'gladiators-combat',
  'combat',
];
const mapPhases = ['dawn', 'day', 'dusk', 'night'];
const homepagePhases = ['day', 'dusk'];
const buildingIds = [
  'domus',
  'canteen',
  'dormitory',
  'trainingGround',
  'pleasureHall',
  'infirmary',
];
const buildingLevels = [0, 1, 2, 3];
const buildingParts = ['exterior', 'roof', 'interior', 'props'];
const mapAnimationKeys = [
  'map-idle',
  'map-walk',
  'map-train',
  'map-eat',
  'map-rest',
  'map-celebrate',
  'map-healing',
];
const combatAnimationKeys = [
  'combat-idle',
  'combat-attack',
  'combat-hit',
  'combat-block',
  'combat-defeat',
  'combat-victory',
];
const combatAnimationSourceKeyByAnimationKey = {
  'combat-idle': 'combat-idle',
  'combat-attack': 'combat-attack',
  'combat-hit': 'combat-idle',
  'combat-block': 'combat-idle',
  'combat-defeat': 'combat-idle',
  'combat-victory': 'combat-idle',
};

const renderLayers = {
  uiBase: 'ui.base',
  homepageBackground: 'homepage.background',
  mapBackground: 'map.background',
  mapBuildings: 'map.buildings',
  mapAmbientFront: 'map.ambient.front',
  mapCharacters: 'map.characters',
  combatBackground: 'combat.background',
  combatCrowd: 'combat.crowd',
  combatFighters: 'combat.fighters',
};

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function point(x, y) {
  return { x, y };
}

function rect(width, height, x = 0, y = 0) {
  return { x, y, width, height };
}

function createBundles() {
  return Object.fromEntries(
    bundleIds.map((id) => [id, { id, textureAliases: [], spritesheetAliases: [] }]),
  );
}

function textureAlias(kind, ...parts) {
  return [kind, ...parts].join(':');
}

function spritesheetAlias(...parts) {
  return ['spritesheet', ...parts].join(':');
}

function createTexture(alias, bundleId, fallbackSrc, renderLayer, options = {}) {
  return {
    alias,
    bundleId,
    sourceQuality: options.productionSrc ? 'production' : 'placeholder',
    productionSrc: options.productionSrc,
    fallbackSrc,
    anchor: options.anchor ?? point(0, 0),
    hitbox: options.hitbox,
    renderLayer,
    tags: options.tags ?? [],
  };
}

function addTexture(manifest, asset) {
  manifest.textures[asset.alias] = asset;
  manifest.bundles[asset.bundleId].textureAliases.push(asset.alias);
}

function addSpritesheet(manifest, spritesheet) {
  manifest.spritesheets[spritesheet.alias] = spritesheet;
  manifest.bundles[spritesheet.bundleId].spritesheetAliases.push(spritesheet.alias);
}

function createFrameAnimation(key, frameAliases, renderLayer, fps, hitbox, ySortOffset = 0) {
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

export function buildPixiProductionAssetManifest(options = {}) {
  const fallbackManifest = options.fallbackManifest ?? readJson(fallbackManifestPath);
  const productionManifest = options.productionManifest ?? readJson(productionManifestPath);
  const manifest = {
    version: 1,
    generatedAt: fallbackManifest.generatedAt,
    fallbackManifest: {
      id: 'visual-migration-svg',
      generatedAt: fallbackManifest.generatedAt,
    },
    bundles: createBundles(),
    textures: {},
    spritesheets: {},
  };

  for (const [assetId, fallbackSrc] of Object.entries(fallbackManifest.ui)) {
    addTexture(
      manifest,
      createTexture(textureAlias('ui', assetId), 'core-ui', fallbackSrc, renderLayers.uiBase, {
        productionSrc: productionManifest.ui[assetId],
        tags: ['ui'],
      }),
    );
  }

  for (const phase of homepagePhases) {
    const fallbackSrc = fallbackManifest.homepage.backgrounds[phase];
    const productionSrc = productionManifest.homepage.backgrounds[phase];

    if (fallbackSrc) {
      addTexture(
        manifest,
        createTexture(
          textureAlias('homepage', 'background', phase),
          'main-menu',
          fallbackSrc,
          renderLayers.homepageBackground,
          { hitbox: rect(1440, 980), productionSrc, tags: ['homepage', phase] },
        ),
      );
    }
  }

  addTexture(
    manifest,
    createTexture(
      textureAlias('homepage', 'last-save-thumbnail'),
      'main-menu',
      fallbackManifest.homepage.lastSaveThumbnail,
      renderLayers.homepageBackground,
      {
        hitbox: rect(320, 180),
        productionSrc: productionManifest.homepage.lastSaveThumbnail,
        tags: ['homepage', 'thumbnail'],
      },
    ),
  );

  for (const phase of mapPhases) {
    addTexture(
      manifest,
      createTexture(
        textureAlias('map', 'background', phase),
        'map-base',
        fallbackManifest.map.backgrounds[phase],
        renderLayers.mapBackground,
        {
          hitbox: rect(3200, 2000),
          productionSrc: productionManifest.map.backgrounds[phase],
          tags: ['map', 'background', phase],
        },
      ),
    );
  }

  for (const [part, fallbackSrc] of Object.entries(fallbackManifest.locations.market)) {
    const productionSrc = productionManifest.locations.market[part];

    if (!productionSrc) {
      continue;
    }

    addTexture(
      manifest,
      createTexture(
        textureAlias('location', 'market', part),
        'map-base',
        fallbackSrc,
        renderLayers.mapBuildings,
        {
          anchor: point(0.5, 1),
          hitbox: rect(260, 180, -130, -180),
          productionSrc,
          tags: ['map', 'market'],
        },
      ),
    );
  }

  addTexture(
    manifest,
    createTexture(
      textureAlias('location', 'arena', 'exterior'),
      'map-base',
      fallbackManifest.locations.arena.exterior,
      renderLayers.mapBuildings,
      {
        anchor: point(0.5, 1),
        hitbox: rect(310, 240, -155, -240),
        productionSrc: productionManifest.locations.arena.exterior,
        tags: ['map', 'arena'],
      },
    ),
  );

  for (const [assetId, fallbackSrc] of Object.entries(fallbackManifest.map.ambient)) {
    addTexture(
      manifest,
      createTexture(
        textureAlias('map', 'ambient', assetId),
        'map-ambient',
        fallbackSrc,
        renderLayers.mapAmbientFront,
        {
          anchor: point(0.5, 0.5),
          productionSrc: productionManifest.map.ambient[assetId],
          tags: ['map', 'ambient'],
        },
      ),
    );
  }

  for (const buildingId of buildingIds) {
    for (const level of buildingLevels) {
      const assetSet = fallbackManifest.buildings[buildingId][`level-${level}`];
      const productionAssetSet = productionManifest.buildings[buildingId]?.[`level-${level}`];

      for (const part of buildingParts) {
        const fallbackSrc = assetSet[part];
        const productionSrc = productionAssetSet?.[part];

        if (fallbackSrc && productionSrc) {
          addTexture(
            manifest,
            createTexture(
              textureAlias('building', buildingId, `level-${level}`, part),
              'buildings',
              fallbackSrc,
              renderLayers.mapBuildings,
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
          );
        }
      }
    }
  }

  for (const [variantId, assetSet] of Object.entries(productionManifest.gladiators)) {
    const fallbackAssetSet = fallbackManifest.gladiators[variantId] ?? assetSet;

    addTexture(
      manifest,
      createTexture(
        textureAlias('gladiator', variantId, 'portrait'),
        'core-ui',
        fallbackAssetSet.portrait,
        renderLayers.uiBase,
        {
          anchor: point(0.5, 0.5),
          hitbox: rect(128, 128, -64, -64),
          productionSrc: assetSet.portrait,
          tags: ['gladiator', 'portrait'],
        },
      ),
    );

    const mapAnimations = {};
    const mapFrameAliases = [];

    for (const animationKey of mapAnimationKeys) {
      const productionFrames = assetSet.frames[animationKey] ?? [];
      const fallbackFrames = fallbackAssetSet.frames[animationKey] ?? productionFrames;
      const frameAliases = productionFrames.slice(0, 2).map((productionSrc, index) => {
        const fallbackSrc = fallbackFrames[index] ?? productionSrc;
        const alias = textureAlias('gladiator', variantId, animationKey, String(index));
        addTexture(
          manifest,
          createTexture(alias, 'gladiators-map', fallbackSrc, renderLayers.mapCharacters, {
            anchor: point(0.5, 1),
            hitbox: rect(64, 96, -32, -96),
            productionSrc,
            tags: ['gladiator', 'map', variantId, animationKey],
          }),
        );
        return alias;
      });

      mapFrameAliases.push(...frameAliases);
      mapAnimations[animationKey] = createFrameAnimation(
        animationKey,
        frameAliases,
        renderLayers.mapCharacters,
        animationKey === 'map-walk' ? 7 : 3,
        rect(64, 96, -32, -96),
      );
    }

    addSpritesheet(manifest, {
      alias: spritesheetAlias('gladiator', variantId, 'map'),
      bundleId: 'gladiators-map',
      sourceQuality: assetSet.mapSpritesheet ? 'production' : 'placeholder',
      productionSrc: assetSet.mapSpritesheet,
      productionAtlasSrc: assetSet.mapAtlas,
      fallbackTextureAliases: mapFrameAliases,
      animations: mapAnimations,
      tags: ['gladiator', 'map', variantId],
    });

    const combatAnimations = {};
    const combatFrameAliases = [];

    for (const animationKey of combatAnimationKeys) {
      const sourceAnimationKey = combatAnimationSourceKeyByAnimationKey[animationKey];
      const productionFrames = assetSet.frames[sourceAnimationKey] ?? [];
      const fallbackFrames = fallbackAssetSet.frames[sourceAnimationKey] ?? productionFrames;
      const frameAliases = productionFrames.slice(0, 2).map((productionSrc, index) => {
        const fallbackSrc = fallbackFrames[index] ?? productionSrc;
        const alias = textureAlias('gladiator', variantId, animationKey, String(index));
        addTexture(
          manifest,
          createTexture(alias, 'gladiators-combat', fallbackSrc, renderLayers.combatFighters, {
            anchor: point(0.5, 1),
            hitbox: rect(120, 180, -60, -180),
            productionSrc,
            tags: ['gladiator', 'combat', variantId, animationKey],
          }),
        );
        return alias;
      });

      combatFrameAliases.push(...frameAliases);
      combatAnimations[animationKey] = createFrameAnimation(
        animationKey,
        frameAliases,
        renderLayers.combatFighters,
        animationKey === 'combat-attack' ? 7 : 3,
        rect(120, 180, -60, -180),
        animationKey === 'combat-defeat' ? -8 : 0,
      );
    }

    addSpritesheet(manifest, {
      alias: spritesheetAlias('gladiator', variantId, 'combat'),
      bundleId: 'gladiators-combat',
      sourceQuality: assetSet.combatSpritesheet ? 'production' : 'placeholder',
      productionSrc: assetSet.combatSpritesheet,
      productionAtlasSrc: assetSet.combatAtlas,
      fallbackTextureAliases: combatFrameAliases,
      animations: combatAnimations,
      tags: ['gladiator', 'combat', variantId],
    });
  }

  addTexture(
    manifest,
    createTexture(
      textureAlias('combat', 'arena', 'background'),
      'combat',
      fallbackManifest.locations.arena.combatBackground,
      renderLayers.combatBackground,
      {
        hitbox: rect(960, 480),
        productionSrc: productionManifest.locations.arena.combatBackground,
        tags: ['combat', 'arena'],
      },
    ),
  );

  addTexture(
    manifest,
    createTexture(
      textureAlias('combat', 'arena', 'crowd'),
      'combat',
      fallbackManifest.locations.arena.crowd,
      renderLayers.combatCrowd,
      {
        hitbox: rect(960, 160),
        productionSrc: productionManifest.locations.arena.crowd,
        tags: ['combat', 'crowd'],
      },
    ),
  );

  return manifest;
}

function parseArgs(args) {
  return {
    stdout: args.includes('--stdout'),
    outputPath:
      args.find((arg) => arg.startsWith('--out='))?.slice('--out='.length) ?? defaultOutputPath,
  };
}

function run() {
  const options = parseArgs(process.argv.slice(2));
  const manifest = buildPixiProductionAssetManifest();
  const content = `${JSON.stringify(manifest, null, 2)}\n`;

  if (options.stdout) {
    process.stdout.write(content);
    return;
  }

  mkdirSync(dirname(options.outputPath), { recursive: true });
  writeFileSync(options.outputPath, content);
  console.log(`Pixi production asset manifest written to ${options.outputPath}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  run();
}
