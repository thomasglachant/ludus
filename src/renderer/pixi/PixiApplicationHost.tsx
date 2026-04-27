import { useEffect, useRef, type RefObject } from 'react';
import { Application } from 'pixi.js';
import { PixiAssetLoader } from './PixiAssetLoader';
import type { PixiScene, PixiSceneContext } from './PixiScene';

interface PixiApplicationHostProps<TSnapshot> {
  className?: string;
  createScene: (context: PixiSceneContext) => PixiScene<TSnapshot>;
  debugMode?: boolean;
  maxFps?: number;
  resizeTo?: RefObject<HTMLElement | null>;
  sceneKey?: string | number;
  snapshot: TSnapshot;
}

export function PixiApplicationHost<TSnapshot>({
  className,
  createScene,
  debugMode = false,
  maxFps = 20,
  resizeTo,
  sceneKey,
  snapshot,
}: PixiApplicationHostProps<TSnapshot>) {
  const isTestMode = import.meta.env.MODE === 'test';
  const recreateKey = sceneKey ?? createScene;
  const hostRef = useRef<HTMLDivElement | null>(null);
  const createSceneRef = useRef(createScene);
  const sceneRef = useRef<PixiScene<TSnapshot> | null>(null);
  const snapshotRef = useRef(snapshot);

  useEffect(() => {
    createSceneRef.current = createScene;
  }, [createScene]);

  useEffect(() => {
    snapshotRef.current = snapshot;
    void sceneRef.current?.update(snapshot);
  }, [snapshot]);

  useEffect(() => {
    if (isTestMode) {
      return;
    }

    const host = hostRef.current;

    if (!host) {
      return;
    }

    const hostElement = host;
    let isDisposed = false;
    let isInitialized = false;
    let isAppDestroyed = false;
    const app = new Application();
    const assetLoader = new PixiAssetLoader();
    const handleTick = () => {
      sceneRef.current?.tick?.(app.ticker.deltaMS);
    };
    const destroySceneAndAssets = () => {
      sceneRef.current?.destroy();
      sceneRef.current = null;
      assetLoader.destroy();
    };
    const destroyInitializedApp = () => {
      if (!isInitialized || isAppDestroyed) {
        return;
      }

      isAppDestroyed = true;
      app.destroy({ removeView: true }, { children: true });
    };

    async function initApplication() {
      await app.init({
        autoDensity: true,
        autoStart: true,
        antialias: false,
        backgroundAlpha: 0,
        powerPreference: 'low-power',
        preference: 'webgl',
        resizeTo: resizeTo?.current ?? hostElement,
        resolution: 1,
        roundPixels: true,
      });
      isInitialized = true;
      app.canvas.style.imageRendering = 'pixelated';

      if (isDisposed) {
        destroyInitializedApp();
        return;
      }

      app.ticker.maxFPS = maxFps;
      hostElement.appendChild(app.canvas);

      const context: PixiSceneContext = { app, assetLoader, debugMode };
      const scene = createSceneRef.current(context);

      sceneRef.current = scene;
      app.stage.addChild(scene.root);
      await scene.mount?.(context);

      if (isDisposed) {
        scene.destroy();
        destroyInitializedApp();
        return;
      }

      await scene.update(snapshotRef.current);
      app.ticker.add(handleTick);
    }

    void initApplication().catch((error: unknown) => {
      if (!isDisposed) {
        console.error('Pixi application initialization failed.', error);
      }

      destroySceneAndAssets();
      destroyInitializedApp();
    });

    return () => {
      isDisposed = true;
      app.ticker?.remove(handleTick);
      destroySceneAndAssets();
      destroyInitializedApp();
    };
  }, [debugMode, isTestMode, maxFps, recreateKey, resizeTo]);

  if (isTestMode) {
    return <div className={className} data-testid="pixi-test-host" ref={hostRef} />;
  }

  return <div className={className} data-testid="pixi-test-host" ref={hostRef} />;
}
