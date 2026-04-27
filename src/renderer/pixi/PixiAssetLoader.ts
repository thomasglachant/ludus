import { Assets, Spritesheet, Texture } from 'pixi.js';
import {
  configurePixelArtSpritesheet,
  configurePixelArtTexture,
  createPixelArtSpritesheetAsset,
  createPixelArtTextureAsset,
} from './pixel-perfect';

export type PixiTextureMap = ReadonlyMap<string, Texture>;
export type PixiSpritesheetMap = ReadonlyMap<string, Spritesheet>;

export class PixiAssetLoader {
  private static readonly spritesheetPromises = new Map<string, Promise<Spritesheet>>();
  private static readonly texturePromises = new Map<string, Promise<Texture>>();

  loadSpritesheet(assetPath: string): Promise<Spritesheet> {
    const cachedPromise = PixiAssetLoader.spritesheetPromises.get(assetPath);

    if (cachedPromise) {
      return cachedPromise;
    }

    const spritesheetPromise = Assets.load<Spritesheet>(
      createPixelArtSpritesheetAsset(assetPath),
    ).then(configurePixelArtSpritesheet);
    PixiAssetLoader.spritesheetPromises.set(assetPath, spritesheetPromise);

    return spritesheetPromise;
  }

  loadTexture(assetPath: string): Promise<Texture> {
    const cachedPromise = PixiAssetLoader.texturePromises.get(assetPath);

    if (cachedPromise) {
      return cachedPromise;
    }

    const texturePromise = Assets.load<Texture>(createPixelArtTextureAsset(assetPath)).then(
      configurePixelArtTexture,
    );
    PixiAssetLoader.texturePromises.set(assetPath, texturePromise);

    return texturePromise;
  }

  async loadSpritesheets(assetPaths: Iterable<string>): Promise<PixiSpritesheetMap> {
    const uniqueAssetPaths = Array.from(new Set(Array.from(assetPaths).filter(Boolean)));
    const entries = await Promise.all(
      uniqueAssetPaths.map(
        async (assetPath) => [assetPath, await this.loadSpritesheet(assetPath)] as const,
      ),
    );

    return new Map(entries);
  }

  async loadTextures(assetPaths: Iterable<string>): Promise<PixiTextureMap> {
    const uniqueAssetPaths = Array.from(new Set(Array.from(assetPaths).filter(Boolean)));
    const entries = await Promise.all(
      uniqueAssetPaths.map(
        async (assetPath) => [assetPath, await this.loadTexture(assetPath)] as const,
      ),
    );

    return new Map(entries);
  }

  destroy(): void {
    // Pixi's asset cache is global; loaded asset promises intentionally survive scene teardown.
  }
}
