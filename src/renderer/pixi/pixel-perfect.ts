import {
  Texture,
  type Sprite,
  type Spritesheet,
  type TextureSourceOptions,
  type UnresolvedAsset,
} from 'pixi.js';

export const PIXI_PIXEL_ART_SCALE_MODE = 'nearest' as const;

export const PIXI_PIXEL_ART_TEXTURE_OPTIONS = {
  autoGenerateMipmaps: false,
  scaleMode: PIXI_PIXEL_ART_SCALE_MODE,
} as const satisfies Pick<TextureSourceOptions, 'autoGenerateMipmaps' | 'scaleMode'>;

export interface PixelArtSpriteSizeOptions {
  preferIntegerScale?: boolean;
  maxIntegerScaleDeviation?: number;
}

const DEFAULT_INTEGER_SCALE_DEVIATION = 0.16;

export function createPixelArtTextureAsset(
  assetPath: string,
): UnresolvedAsset<TextureSourceOptions> {
  return {
    alias: assetPath,
    src: assetPath,
    data: PIXI_PIXEL_ART_TEXTURE_OPTIONS,
  };
}

export function createPixelArtSpritesheetAsset(
  assetPath: string,
): UnresolvedAsset<{ cachePrefix: string; textureOptions: TextureSourceOptions }> {
  return {
    alias: assetPath,
    src: assetPath,
    data: {
      cachePrefix: `${assetPath}#`,
      textureOptions: PIXI_PIXEL_ART_TEXTURE_OPTIONS,
    },
  };
}

export function configurePixelArtTexture(texture: Texture): Texture {
  if (texture === Texture.EMPTY || texture === Texture.WHITE) {
    return texture;
  }

  texture.source.scaleMode = PIXI_PIXEL_ART_SCALE_MODE;
  texture.source.autoGenerateMipmaps = false;

  return texture;
}

export function configurePixelArtSpritesheet(spritesheet: Spritesheet): Spritesheet {
  spritesheet.textureSource.scaleMode = PIXI_PIXEL_ART_SCALE_MODE;
  spritesheet.textureSource.autoGenerateMipmaps = false;

  for (const texture of Object.values(spritesheet.textures)) {
    configurePixelArtTexture(texture);
  }

  return spritesheet;
}

export function configurePixelArtSprite<TSprite extends Sprite>(sprite: TSprite): TSprite {
  sprite.roundPixels = true;
  configurePixelArtTexture(sprite.texture);

  return sprite;
}

export function getPixelArtScaleForSize(
  nativeWidth: number,
  nativeHeight: number,
  targetWidth: number,
  targetHeight: number,
  options: PixelArtSpriteSizeOptions = {},
): { scaleX: number; scaleY: number } {
  const safeNativeWidth = Math.max(nativeWidth, 1);
  const safeNativeHeight = Math.max(nativeHeight, 1);
  const scaleX = targetWidth / safeNativeWidth;
  const scaleY = targetHeight / safeNativeHeight;

  if (!options.preferIntegerScale) {
    return { scaleX, scaleY };
  }

  const uniformScale = (scaleX + scaleY) / 2;
  const roundedScale = Math.max(1, Math.round(uniformScale));
  const maxDeviation = options.maxIntegerScaleDeviation ?? DEFAULT_INTEGER_SCALE_DEVIATION;
  const isNearlyUniform = Math.abs(scaleX - scaleY) <= maxDeviation;
  const isNearIntegerScale = Math.abs(uniformScale - roundedScale) <= maxDeviation;

  if (isNearlyUniform && isNearIntegerScale) {
    return { scaleX: roundedScale, scaleY: roundedScale };
  }

  return { scaleX, scaleY };
}

export function setPixelArtSpriteSize(
  sprite: Sprite,
  width: number,
  height: number,
  options: PixelArtSpriteSizeOptions = {},
): void {
  configurePixelArtSprite(sprite);

  const nativeWidth = sprite.texture.width;
  const nativeHeight = sprite.texture.height;
  const scale = getPixelArtScaleForSize(nativeWidth, nativeHeight, width, height, options);

  sprite.scale.set(scale.scaleX, scale.scaleY);
}
