#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildPixiProductionAssetManifest } from './build-pixi-production-manifest.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const requiredBundleIds = [
  'core-ui',
  'main-menu',
  'map-base',
  'map-ambient',
  'buildings',
  'gladiators-map',
  'gladiators-combat',
  'combat',
];
const productionRequiredBundleIds = new Set([
  'main-menu',
  'map-base',
  'map-ambient',
  'buildings',
  'gladiators-map',
  'gladiators-combat',
  'combat',
]);
const validSourceQualities = new Set(['placeholder', 'production']);

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function parseArgs(args) {
  return {
    manifestPath: args.find((arg) => arg.startsWith('--manifest='))?.slice('--manifest='.length),
    useProductionArt:
      args.includes('--use-production-art') || process.env.VITE_USE_PRODUCTION_ART === 'true',
  };
}

function resolveManifestPath(manifestPath) {
  if (!manifestPath) {
    return undefined;
  }

  return manifestPath.startsWith('/') ? manifestPath : join(root, manifestPath);
}

function resolvePublicAssetPath(src) {
  if (!src?.startsWith('/assets/')) {
    return undefined;
  }

  return join(root, 'public', src.slice(1));
}

function validatePublicAssetExists(src, path, errors) {
  const assetPath = resolvePublicAssetPath(src);

  if (assetPath && !existsSync(assetPath)) {
    errors.push(`${path} references a missing public asset: ${src}`);
  }
}

function hasNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function validatePoint(value, path, errors) {
  if (!value || !hasNumber(value.x) || !hasNumber(value.y)) {
    errors.push(`${path} must include numeric x and y values.`);
  }
}

function validateRect(value, path, errors) {
  validatePoint(value, path, errors);

  if (!value || !hasNumber(value.width) || !hasNumber(value.height)) {
    errors.push(`${path} must include numeric width and height values.`);
  }
}

export function validatePixiProductionAssetManifest(manifest, options = {}) {
  const errors = [];

  if (manifest.version !== 1) {
    errors.push('Manifest version must be 1.');
  }

  for (const bundleId of requiredBundleIds) {
    if (!manifest.bundles?.[bundleId]) {
      errors.push(`Missing required bundle "${bundleId}".`);
    }
  }

  const textureAliases = new Set();

  for (const [alias, asset] of Object.entries(manifest.textures ?? {})) {
    if (alias !== asset.alias) {
      errors.push(`Texture key "${alias}" does not match asset alias "${asset.alias}".`);
    }

    if (textureAliases.has(asset.alias)) {
      errors.push(`Duplicate texture alias "${asset.alias}".`);
    }

    textureAliases.add(asset.alias);

    if (!manifest.bundles?.[asset.bundleId]) {
      errors.push(`Texture "${asset.alias}" references missing bundle "${asset.bundleId}".`);
    }

    if (!validSourceQualities.has(asset.sourceQuality)) {
      errors.push(`Texture "${asset.alias}" has invalid sourceQuality "${asset.sourceQuality}".`);
    }

    if (asset.sourceQuality === 'production' && !asset.productionSrc) {
      errors.push(`Production texture "${asset.alias}" must define productionSrc.`);
    }

    if (asset.productionSrc) {
      validatePublicAssetExists(
        asset.productionSrc,
        `Texture "${asset.alias}" productionSrc`,
        errors,
      );
    }

    validatePublicAssetExists(asset.fallbackSrc, `Texture "${asset.alias}" fallbackSrc`, errors);

    if (!asset.fallbackSrc) {
      errors.push(`Texture "${asset.alias}" must define fallbackSrc.`);
    }

    validatePoint(asset.anchor, `Texture "${asset.alias}" anchor`, errors);

    if (asset.hitbox) {
      validateRect(asset.hitbox, `Texture "${asset.alias}" hitbox`, errors);
    }

    if (!asset.renderLayer) {
      errors.push(`Texture "${asset.alias}" must define renderLayer.`);
    }

    if (options.useProductionArt && productionRequiredBundleIds.has(asset.bundleId)) {
      if (asset.sourceQuality === 'placeholder') {
        errors.push(
          `Production art is enabled, but player-facing texture "${asset.alias}" in bundle "${asset.bundleId}" is still placeholder quality.`,
        );
      }
    }
  }

  for (const [bundleId, bundle] of Object.entries(manifest.bundles ?? {})) {
    for (const alias of bundle.textureAliases ?? []) {
      if (!textureAliases.has(alias)) {
        errors.push(`Bundle "${bundleId}" references missing texture "${alias}".`);
      }
    }
  }

  const spritesheetAliases = new Set();

  for (const [alias, spritesheet] of Object.entries(manifest.spritesheets ?? {})) {
    if (alias !== spritesheet.alias) {
      errors.push(`Spritesheet key "${alias}" does not match asset alias "${spritesheet.alias}".`);
    }

    if (spritesheetAliases.has(spritesheet.alias)) {
      errors.push(`Duplicate spritesheet alias "${spritesheet.alias}".`);
    }

    spritesheetAliases.add(spritesheet.alias);

    if (!manifest.bundles?.[spritesheet.bundleId]) {
      errors.push(
        `Spritesheet "${spritesheet.alias}" references missing bundle "${spritesheet.bundleId}".`,
      );
    }

    if (!validSourceQualities.has(spritesheet.sourceQuality)) {
      errors.push(
        `Spritesheet "${spritesheet.alias}" has invalid sourceQuality "${spritesheet.sourceQuality}".`,
      );
    }

    if (spritesheet.sourceQuality === 'production' && !spritesheet.productionSrc) {
      errors.push(`Production spritesheet "${spritesheet.alias}" must define productionSrc.`);
    }

    if (spritesheet.productionSrc) {
      validatePublicAssetExists(
        spritesheet.productionSrc,
        `Spritesheet "${spritesheet.alias}" productionSrc`,
        errors,
      );
    }

    if (spritesheet.productionAtlasSrc) {
      validatePublicAssetExists(
        spritesheet.productionAtlasSrc,
        `Spritesheet "${spritesheet.alias}" productionAtlasSrc`,
        errors,
      );
    }

    if (options.useProductionArt && productionRequiredBundleIds.has(spritesheet.bundleId)) {
      if (spritesheet.sourceQuality === 'placeholder') {
        errors.push(
          `Production art is enabled, but player-facing spritesheet "${spritesheet.alias}" in bundle "${spritesheet.bundleId}" is still placeholder quality.`,
        );
      }
    }

    for (const textureAlias of spritesheet.fallbackTextureAliases ?? []) {
      if (!textureAliases.has(textureAlias)) {
        errors.push(
          `Spritesheet "${spritesheet.alias}" references missing fallback texture "${textureAlias}".`,
        );
      }
    }

    for (const [animationKey, animation] of Object.entries(spritesheet.animations ?? {})) {
      if (animationKey !== animation.key) {
        errors.push(
          `Spritesheet "${spritesheet.alias}" animation key "${animationKey}" does not match "${animation.key}".`,
        );
      }

      if (!Array.isArray(animation.frameAliases) || animation.frameAliases.length === 0) {
        errors.push(`Animation "${spritesheet.alias}:${animationKey}" must include frameAliases.`);
      }

      for (const frameAlias of animation.frameAliases ?? []) {
        if (!textureAliases.has(frameAlias)) {
          errors.push(
            `Animation "${spritesheet.alias}:${animationKey}" references missing frame "${frameAlias}".`,
          );
        }
      }

      validatePoint(
        animation.anchor,
        `Animation "${spritesheet.alias}:${animationKey}" anchor`,
        errors,
      );

      if (animation.hitbox) {
        validateRect(
          animation.hitbox,
          `Animation "${spritesheet.alias}:${animationKey}" hitbox`,
          errors,
        );
      }

      if (!animation.renderLayer) {
        errors.push(`Animation "${spritesheet.alias}:${animationKey}" must define renderLayer.`);
      }

      if (!hasNumber(animation.ySortOffset)) {
        errors.push(
          `Animation "${spritesheet.alias}:${animationKey}" must define numeric ySortOffset.`,
        );
      }
    }
  }

  for (const [bundleId, bundle] of Object.entries(manifest.bundles ?? {})) {
    for (const alias of bundle.spritesheetAliases ?? []) {
      if (!spritesheetAliases.has(alias)) {
        errors.push(`Bundle "${bundleId}" references missing spritesheet "${alias}".`);
      }
    }
  }

  return errors;
}

function run() {
  const options = parseArgs(process.argv.slice(2));
  const manifestPath = resolveManifestPath(options.manifestPath);

  if (manifestPath && !existsSync(manifestPath)) {
    throw new Error(`Manifest does not exist: ${manifestPath}`);
  }

  const manifest = manifestPath ? readJson(manifestPath) : buildPixiProductionAssetManifest();
  const errors = validatePixiProductionAssetManifest(manifest, options);

  if (errors.length > 0) {
    console.error(`Pixi production asset validation failed with ${errors.length} error(s):`);
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log('Pixi production asset validation passed.');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  run();
}
