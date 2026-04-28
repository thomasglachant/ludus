import {
  PIXI_PRODUCTION_ASSET_MANIFEST,
  getPixiTextureSource,
  type PixiAnimationDefinition,
  type PixiAssetBundleDefinition,
  type PixiProductionAssetManifest,
  type PixiSpritesheetAsset,
  type PixiTextureAsset,
} from './pixi-asset-manifest';
import type { PixiAssetBundleId } from './texture-aliases';

export interface ResolvedPixiAnimationFrame {
  alias: string;
  src: string;
  texture: PixiTextureAsset;
}

export interface ResolvedPixiAnimation {
  animation: PixiAnimationDefinition;
  frames: ResolvedPixiAnimationFrame[];
  spritesheet: PixiSpritesheetAsset;
}

export function resolvePixiTextureAsset(
  alias: string,
  manifest: PixiProductionAssetManifest = PIXI_PRODUCTION_ASSET_MANIFEST,
) {
  return manifest.textures[alias];
}

export function resolvePixiTextureSource(
  alias: string,
  options: { manifest?: PixiProductionAssetManifest } = {},
) {
  const asset = resolvePixiTextureAsset(alias, options.manifest);

  return asset ? getPixiTextureSource(asset) : undefined;
}

export function resolvePixiSpritesheet(
  alias: string,
  manifest: PixiProductionAssetManifest = PIXI_PRODUCTION_ASSET_MANIFEST,
) {
  return manifest.spritesheets[alias];
}

export function resolvePixiAnimation(
  spritesheetAlias: string,
  animationKey: string,
  options: { manifest?: PixiProductionAssetManifest } = {},
): ResolvedPixiAnimation | undefined {
  const manifest = options.manifest ?? PIXI_PRODUCTION_ASSET_MANIFEST;
  const spritesheet = resolvePixiSpritesheet(spritesheetAlias, manifest);
  const animation = spritesheet?.animations[animationKey];

  if (!spritesheet || !animation) {
    return undefined;
  }

  const frames = animation.frameAliases.flatMap((alias) => {
    const texture = resolvePixiTextureAsset(alias, manifest);
    const src = texture ? getPixiTextureSource(texture) : undefined;

    return texture && src ? [{ alias, src, texture }] : [];
  });

  return {
    animation,
    frames,
    spritesheet,
  };
}

export function resolvePixiBundle(
  bundleId: PixiAssetBundleId,
  manifest: PixiProductionAssetManifest = PIXI_PRODUCTION_ASSET_MANIFEST,
): PixiAssetBundleDefinition | undefined {
  return manifest.bundles[bundleId];
}

export function resolvePixiBundleTextureSources(
  bundleId: PixiAssetBundleId,
  options: { manifest?: PixiProductionAssetManifest } = {},
) {
  const manifest = options.manifest ?? PIXI_PRODUCTION_ASSET_MANIFEST;
  const bundle = resolvePixiBundle(bundleId, manifest);

  if (!bundle) {
    return [];
  }

  return bundle.textureAliases.flatMap((alias) => {
    const texture = resolvePixiTextureAsset(alias, manifest);
    const src = texture ? getPixiTextureSource(texture) : undefined;

    return texture && src ? [{ alias, src, texture }] : [];
  });
}
