import type { Application, Container } from 'pixi.js';
import type { PixiAssetLoader } from './PixiAssetLoader';

export interface PixiSceneContext {
  app: Application;
  assetLoader: PixiAssetLoader;
  debugMode: boolean;
}

export interface PixiScene<TSnapshot> {
  readonly root: Container;
  mount?(context: PixiSceneContext): void | Promise<void>;
  update(snapshot: TSnapshot): void | Promise<void>;
  tick?(deltaMilliseconds: number): void;
  resize?(): void;
  destroy(): void;
}
