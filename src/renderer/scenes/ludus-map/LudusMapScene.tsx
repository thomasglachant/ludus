import {
  AnimatedSprite,
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Text,
  Texture,
  type FederatedPointerEvent,
} from 'pixi.js';
import { CameraController } from '../../pixi/CameraController';
import type {
  PixiAssetLoader,
  PixiSpritesheetMap,
  PixiTextureMap,
} from '../../pixi/PixiAssetLoader';
import {
  PixiVisualDebugOverlay,
  type PixiVisualDebugMetric,
} from '../../pixi/PixiVisualDebugOverlay';
import { destroyDisplayObject } from '../../pixi/destroy';
import { configurePixelArtSprite, setPixelArtSpriteSize } from '../../pixi/pixel-perfect';
import type { PixiScene, PixiSceneContext } from '../../pixi/PixiScene';
import { createRenderLayerSetup } from '../../pixi/render-layers';
import { AmbientAnimationSystem } from './AmbientAnimationSystem';
import type {
  LudusMapSceneDecorationViewModel,
  LudusMapSceneGladiatorViewModel,
  LudusMapSceneLocationViewModel,
  LudusMapScenePathViewModel,
  LudusMapSceneViewModel,
} from './LudusMapSceneViewModel';
import { ParticleEffectSystem } from './ParticleEffectSystem';
import { TimeOfDayLightingSystem } from './TimeOfDayLightingSystem';

type LudusMapLayerId =
  | 'background'
  | 'clouds'
  | 'terrain-overlays'
  | 'paths'
  | 'selection-highlight'
  | 'static-props'
  | 'buildings-back'
  | 'characters-y-sorted'
  | 'buildings-front'
  | 'ambient-effects'
  | 'lighting-overlay'
  | 'light-sprites'
  | 'labels';

interface LudusMapSceneOptions {
  onLocationSelect?: (locationId: string) => void;
}

interface DecorationDisplay {
  container: Container;
  decoration: LudusMapSceneDecorationViewModel;
  fallback: Graphics;
  sprite: Sprite;
}

interface GladiatorDisplay {
  animationSignature?: string;
  container: Container;
  fallback: Graphics;
  gladiator: LudusMapSceneGladiatorViewModel;
  sprite: AnimatedSprite;
}

interface LocationDisplay {
  backContainer: Container;
  exteriorSprite: Sprite;
  fallbackFrame: Graphics;
  frontContainer: Container;
  highlight: Graphics;
  interaction: Container;
  label: Text;
  location: LudusMapSceneLocationViewModel;
  propsContainer: Container;
  propsSprite: Sprite;
  roofSprite: Sprite;
}

const ASSET_PATH_SEPARATOR = '\u0000';
const LUDUS_MAP_LAYER_IDS = [
  'background',
  'clouds',
  'terrain-overlays',
  'paths',
  'selection-highlight',
  'static-props',
  'buildings-back',
  'characters-y-sorted',
  'buildings-front',
  'ambient-effects',
  'lighting-overlay',
  'light-sprites',
  'labels',
] as const satisfies readonly LudusMapLayerId[];
const LOCATION_LABEL_ZOOM_THRESHOLD = 1.05;
const EXTERNAL_LABEL_ZOOM_THRESHOLD = 0.72;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function interpolate(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

function isAssetPath(assetPath: string | undefined): assetPath is string {
  return Boolean(assetPath);
}

function collectLudusMapTextureAssetPaths(viewModel: LudusMapSceneViewModel): string[] {
  return Array.from(
    new Set([
      ...viewModel.locations.flatMap((location) =>
        [
          location.exteriorAssetPath,
          location.propsAssetPath,
          location.roofAssetPath,
          location.assetPath,
        ].filter(isAssetPath),
      ),
      ...viewModel.decorations.flatMap((decoration) =>
        decoration.assetPath ? [decoration.assetPath] : [],
      ),
      ...viewModel.gladiators.flatMap((gladiator) =>
        gladiator.spritesheetAtlasPath ? [] : gladiator.fallbackFramePaths,
      ),
      ...viewModel.ambientElements.map((element) => element.assetPath),
      ...(viewModel.theme.backgroundAssetPath ? [viewModel.theme.backgroundAssetPath] : []),
    ]),
  );
}

function collectLudusMapSpritesheetAssetPaths(viewModel: LudusMapSceneViewModel): string[] {
  return Array.from(
    new Set(
      viewModel.gladiators.flatMap((gladiator) =>
        gladiator.spritesheetAtlasPath ? [gladiator.spritesheetAtlasPath] : [],
      ),
    ),
  );
}

function drawFallbackBackground(graphics: Graphics, viewModel: LudusMapSceneViewModel): void {
  graphics.clear();
  graphics.setFillStyle({ color: viewModel.theme.terrainColor });
  graphics.rect(0, 0, viewModel.width, viewModel.height);
  graphics.fill();
}

function drawTerrainOverlay(graphics: Graphics, viewModel: LudusMapSceneViewModel): void {
  graphics.clear();
  graphics.setFillStyle({ color: viewModel.theme.terrainHighlightColor, alpha: 0.08 });
  graphics.rect(0, 0, viewModel.width, viewModel.height);
  graphics.fill();
}

function drawOceanWaves(graphics: Graphics, viewModel: LudusMapSceneViewModel, now: number): void {
  const water = viewModel.waterAnimation;

  graphics.clear();

  if (water.opacity <= 0) {
    return;
  }

  const elapsedSeconds = viewModel.reducedMotion ? 0 : now / 1000;
  const segmentCount = 12;
  const rowGap = water.height / Math.max(water.lineCount, 1);

  for (let row = 0; row < water.lineCount; row += 1) {
    const rowProgress = row / Math.max(water.lineCount - 1, 1);
    const y = water.y + row * rowGap;
    const waveOffset = elapsedSeconds * water.speed * 120 + row * 19;
    const alpha = water.opacity * (0.38 + rowProgress * 0.62);

    graphics.setStrokeStyle({
      color: water.color,
      width: water.lineWidth,
      alpha,
      cap: 'round',
      join: 'round',
    });
    graphics.moveTo(water.x, y);

    for (let segment = 1; segment <= segmentCount; segment += 1) {
      const segmentProgress = segment / segmentCount;
      const x = water.x + segmentProgress * water.width;
      const wave = Math.sin(segmentProgress * Math.PI * 4 + waveOffset * 0.04);

      graphics.lineTo(x, y + wave * (3 + rowProgress * 5));
    }

    graphics.stroke();
  }
}

function drawPaths(graphics: Graphics, paths: LudusMapScenePathViewModel[]): void {
  graphics.clear();

  for (const path of paths) {
    if (path.points.length < 2) {
      continue;
    }

    graphics.setStrokeStyle({
      color: path.kind === 'external' ? 0x7b5a35 : 0x8a693f,
      width: path.kind === 'external' ? 30 : 22,
      alpha: 0.52,
      cap: 'round',
      join: 'round',
    });
    graphics.moveTo(path.points[0].x, path.points[0].y);

    for (const point of path.points.slice(1)) {
      graphics.lineTo(point.x, point.y);
    }

    graphics.stroke();
    graphics.setStrokeStyle({
      color: path.kind === 'external' ? 0xd7b56b : 0xe1c27d,
      width: path.kind === 'external' ? 14 : 10,
      alpha: 0.54,
      cap: 'round',
      join: 'round',
    });
    graphics.moveTo(path.points[0].x, path.points[0].y);

    for (const point of path.points.slice(1)) {
      graphics.lineTo(point.x, point.y);
    }

    graphics.stroke();
  }
}

function drawGladiatorFallback(graphics: Graphics): void {
  graphics.clear();
  graphics.setFillStyle({ color: 0x8f3f2c });
  graphics.circle(0, -24, 18);
  graphics.fill();
}

function drawGladiatorShadow(graphics: Graphics): void {
  graphics.clear();
  graphics.setFillStyle({ color: 0x1e1712, alpha: 0.28 });
  graphics.ellipse(0, 8, 34, 12);
  graphics.fill();
}

function drawLocationFallbackFrame(
  graphics: Graphics,
  location: LudusMapSceneLocationViewModel,
): void {
  graphics.clear();
  graphics.setFillStyle({
    color: location.kind === 'external' ? 0x7b4c32 : location.isOwned ? 0x9b6535 : 0x4b3d33,
    alpha: 0.28,
  });
  graphics.rect(0, 0, location.width, location.height);
  graphics.fill();
  graphics.setStrokeStyle({
    color: location.kind === 'external' ? 0xe0b15e : location.isOwned ? 0xd6a557 : 0x7d6959,
    width: 4,
    alpha: 0.72,
  });
  graphics.rect(0, 0, location.width, location.height);
  graphics.stroke();
}

function drawLocationHighlight(
  graphics: Graphics,
  location: LudusMapSceneLocationViewModel,
  isHovered: boolean,
  isSelected: boolean,
): void {
  graphics.clear();

  if (!isHovered && !isSelected) {
    graphics.visible = false;
    return;
  }

  graphics.visible = true;
  graphics.setFillStyle({
    color: 0x7a4f2a,
    alpha: isSelected ? 0.08 : 0.04,
  });
  graphics.roundRect(0, 0, location.hitArea.width, location.hitArea.height, 10);
  graphics.fill();
  graphics.setStrokeStyle({
    color: isSelected ? 0xc78b3d : 0x8a6134,
    width: isSelected ? 3 : 2,
    alpha: isSelected ? 0.52 : 0.34,
  });
  graphics.roundRect(0, 0, location.hitArea.width, location.hitArea.height, 10);
  graphics.stroke();
}

function shouldRenderDecoration(decoration: LudusMapSceneDecorationViewModel): boolean {
  return Boolean(decoration.assetPath);
}

function getDecorationLayerId(decoration: LudusMapSceneDecorationViewModel): LudusMapLayerId {
  if (
    decoration.style === 'oliveTree' ||
    decoration.style === 'cypressTree' ||
    decoration.style === 'well' ||
    decoration.style === 'storage' ||
    decoration.style === 'torch' ||
    decoration.style === 'amphora'
  ) {
    return 'characters-y-sorted';
  }

  return 'static-props';
}

function shouldSwayDecoration(decoration: LudusMapSceneDecorationViewModel): boolean {
  return decoration.style === 'oliveTree' || decoration.style === 'cypressTree';
}

function getDecorationPivot(decoration: LudusMapSceneDecorationViewModel): {
  x: number;
  y: number;
} {
  if (shouldSwayDecoration(decoration)) {
    return {
      x: decoration.width / 2,
      y: decoration.height,
    };
  }

  return {
    x: decoration.width / 2,
    y: decoration.height / 2,
  };
}

function getLocationLabelZoomThreshold(location: LudusMapSceneLocationViewModel): number {
  return location.kind === 'external'
    ? EXTERNAL_LABEL_ZOOM_THRESHOLD
    : LOCATION_LABEL_ZOOM_THRESHOLD;
}

export class LudusMapScene implements PixiScene<LudusMapSceneViewModel> {
  readonly root = new Container();

  private readonly app: PixiSceneContext['app'];
  private readonly assetLoader: PixiAssetLoader;
  private readonly ambientAnimationSystem: AmbientAnimationSystem;
  private readonly backgroundFallback = new Graphics({ roundPixels: true });
  private readonly backgroundSprite = configurePixelArtSprite(new Sprite(Texture.EMPTY));
  private readonly decorations = new Map<string, DecorationDisplay>();
  private readonly debugOverlay: PixiVisualDebugOverlay | null;
  private readonly gladiators = new Map<string, GladiatorDisplay>();
  private readonly layers = createRenderLayerSetup(LUDUS_MAP_LAYER_IDS, {
    'ambient-effects': { sortableChildren: true },
    'buildings-back': { sortableChildren: true },
    'characters-y-sorted': { sortableChildren: true },
    clouds: { sortableChildren: true },
    'light-sprites': { sortableChildren: true },
    'static-props': { sortableChildren: true },
  });
  private readonly lightingSystem: TimeOfDayLightingSystem;
  private readonly locations = new Map<string, LocationDisplay>();
  private readonly options: LudusMapSceneOptions;
  private readonly oceanWaveGraphics = new Graphics({ roundPixels: true });
  private readonly particleEffectSystem: ParticleEffectSystem;
  private readonly pathGraphics = new Graphics({ roundPixels: true });
  private readonly terrainOverlay = new Graphics({ roundPixels: true });
  private assetLoadId = 0;
  private assetPathKey = '';
  private cameraController: CameraController | null = null;
  private gameMinuteAtSync = 0;
  private gameMinuteSyncedAt = 0;
  private hoveredLocationId: string | null = null;
  private isDestroyed = false;
  private spritesheets: PixiSpritesheetMap = new Map();
  private textures: PixiTextureMap = new Map();
  private viewModel: LudusMapSceneViewModel | null = null;

  constructor(context: PixiSceneContext, options: LudusMapSceneOptions = {}) {
    this.app = context.app;
    this.assetLoader = context.assetLoader;
    this.debugOverlay = context.debugMode ? new PixiVisualDebugOverlay() : null;
    this.options = options;
    this.root.label = 'ludus-map-scene';
    this.root.addChild(this.layers.root);
    this.backgroundSprite.label = 'map-background-raster';
    this.backgroundFallback.label = 'map-background-fallback';
    this.oceanWaveGraphics.label = 'map-ocean-waves';
    this.pathGraphics.label = 'map-paths';
    this.terrainOverlay.label = 'terrain-overlay';
    this.layers.layers.background.addChild(this.backgroundFallback, this.backgroundSprite);
    this.layers.layers['terrain-overlays'].addChild(this.terrainOverlay, this.oceanWaveGraphics);
    this.layers.layers.paths.addChild(this.pathGraphics);
    this.ambientAnimationSystem = new AmbientAnimationSystem({
      ambientLayer: this.layers.layers['ambient-effects'],
      cloudLayer: this.layers.layers.clouds,
      ticker: this.app.ticker,
    });
    this.particleEffectSystem = new ParticleEffectSystem({
      layer: this.layers.layers['ambient-effects'],
      ticker: this.app.ticker,
    });
    this.lightingSystem = new TimeOfDayLightingSystem({
      brightnessTargets: [
        this.layers.layers.clouds,
        this.layers.layers['static-props'],
        this.layers.layers['buildings-back'],
        this.layers.layers['characters-y-sorted'],
        this.layers.layers['buildings-front'],
        this.layers.layers['ambient-effects'],
      ],
      lightLayer: this.layers.layers['light-sprites'],
      overlayLayer: this.layers.layers['lighting-overlay'],
      ticker: this.app.ticker,
    });

    if (this.debugOverlay) {
      this.layers.root.addChild(this.debugOverlay.root);
    }
  }

  destroy(): void {
    this.isDestroyed = true;
    this.ambientAnimationSystem.destroy();
    this.particleEffectSystem.destroy();
    this.lightingSystem.destroy();
    this.debugOverlay?.destroy();
    this.cameraController?.destroy();
    this.cameraController = null;
    this.decorations.clear();
    this.gladiators.clear();
    this.locations.clear();
    destroyDisplayObject(this.root);
  }

  resize(): void {
    this.cameraController?.resize();
  }

  tick(): void {
    if (!this.viewModel) {
      return;
    }

    const now = performance.now();

    drawOceanWaves(this.oceanWaveGraphics, this.viewModel, now);

    for (const decorationDisplay of this.decorations.values()) {
      this.updateDecorationAnimation(decorationDisplay, now);
    }

    for (const gladiatorDisplay of this.gladiators.values()) {
      this.updateGladiatorAnimation(gladiatorDisplay, now);
    }

    this.updateDebugOverlay();
  }

  update(viewModel: LudusMapSceneViewModel): void {
    this.viewModel = viewModel;
    this.gameMinuteAtSync = viewModel.currentGameMinute;
    this.gameMinuteSyncedAt = performance.now();
    this.ensureCamera(viewModel);
    this.reconcile(viewModel);
    this.loadAssetsWhenNeeded(viewModel);
  }

  private createDecorationDisplay(decoration: LudusMapSceneDecorationViewModel): DecorationDisplay {
    const container = new Container();
    const sprite = configurePixelArtSprite(new Sprite(Texture.EMPTY));
    const fallback = new Graphics({ roundPixels: true });
    const display = { container, decoration, fallback, sprite };

    container.label = decoration.id;
    container.eventMode = 'none';
    sprite.eventMode = 'none';
    container.addChild(sprite, fallback);
    this.layers.layers[getDecorationLayerId(decoration)].addChild(container);

    return display;
  }

  private createGladiatorDisplay(gladiator: LudusMapSceneGladiatorViewModel): GladiatorDisplay {
    const container = new Container();
    const shadow = new Graphics({ roundPixels: true });
    const sprite = configurePixelArtSprite(new AnimatedSprite([Texture.EMPTY], false));
    const fallback = new Graphics({ roundPixels: true });

    container.label = gladiator.id;
    container.eventMode = 'none';
    sprite.eventMode = 'none';
    sprite.anchor.set(gladiator.animation.anchor.x, gladiator.animation.anchor.y);
    sprite.x = 0;
    sprite.y = 4;
    drawGladiatorShadow(shadow);
    drawGladiatorFallback(fallback);
    container.addChild(shadow, sprite, fallback);
    this.layers.layers['characters-y-sorted'].addChild(container);

    return { container, fallback, gladiator, sprite };
  }

  private createLocationDisplay(location: LudusMapSceneLocationViewModel): LocationDisplay {
    const backContainer = new Container();
    const frontContainer = new Container();
    const propsContainer = new Container();
    const interaction = new Container();
    const highlight = new Graphics({ roundPixels: true });
    const fallbackFrame = new Graphics({ roundPixels: true });
    const exteriorSprite = configurePixelArtSprite(new Sprite(Texture.EMPTY));
    const propsSprite = configurePixelArtSprite(new Sprite(Texture.EMPTY));
    const roofSprite = configurePixelArtSprite(new Sprite(Texture.EMPTY));
    const label = new Text({
      text: location.label,
      style: {
        align: 'center',
        dropShadow: {
          alpha: 0.72,
          angle: Math.PI / 2,
          blur: 1,
          color: '#1c130c',
          distance: 2,
        },
        fill: '#f5deb0',
        fontFamily: 'serif',
        fontSize: 22,
        fontWeight: '700',
        stroke: { color: '#2f2117', width: 4 },
      },
    });
    const display: LocationDisplay = {
      backContainer,
      exteriorSprite,
      fallbackFrame,
      frontContainer,
      highlight,
      interaction,
      label,
      location,
      propsContainer,
      propsSprite,
      roofSprite,
    };

    backContainer.label = `${location.id}:back`;
    frontContainer.label = `${location.id}:front`;
    propsContainer.label = `${location.id}:props`;
    interaction.cursor = 'pointer';
    interaction.eventMode = 'static';
    interaction.label = `${location.id}:hit-area`;
    highlight.label = `${location.id}:highlight`;
    highlight.eventMode = 'none';
    label.anchor.set(0.5, 0);
    label.eventMode = 'none';
    label.label = `${location.id}:label`;
    label.resolution = 2;
    label.roundPixels = true;
    exteriorSprite.eventMode = 'none';
    propsSprite.eventMode = 'none';
    roofSprite.eventMode = 'none';
    backContainer.addChild(fallbackFrame, exteriorSprite);
    propsContainer.addChild(propsSprite);
    frontContainer.addChild(roofSprite);
    interaction.on('pointertap', (event: FederatedPointerEvent) => {
      event.stopPropagation();

      if (this.cameraController?.shouldSuppressTap()) {
        return;
      }

      this.options.onLocationSelect?.(display.location.mapLocationId);
    });
    interaction.on('pointerover', () => {
      this.hoveredLocationId = display.location.id;
      this.updateLocationAffordances();
    });
    interaction.on('pointerout', () => {
      if (this.hoveredLocationId === display.location.id) {
        this.hoveredLocationId = null;
        this.updateLocationAffordances();
      }
    });
    this.layers.layers['buildings-back'].addChild(backContainer);
    this.layers.layers['characters-y-sorted'].addChild(propsContainer);
    this.layers.layers['buildings-front'].addChild(frontContainer);
    this.layers.layers['selection-highlight'].addChild(highlight, interaction);
    this.layers.layers.labels.addChild(label);

    return display;
  }

  private ensureCamera(viewModel: LudusMapSceneViewModel): void {
    const bounds = { height: viewModel.height, width: viewModel.width };
    const limits = {
      defaultCamera: viewModel.defaultCamera,
      defaultZoom: viewModel.defaultZoom,
      maxZoom: viewModel.maxZoom,
      minZoom: viewModel.minZoom,
      zoomPresets: viewModel.zoomPresets,
    };

    if (!this.cameraController) {
      this.cameraController = new CameraController({
        app: this.app,
        bounds,
        canvas: this.app.canvas,
        limits,
        onChange: () => {
          this.updateLocationAffordances();
          this.syncCameraParallax();
        },
        overscrollRatio: 0,
        target: this.layers.root,
      });
      this.syncCameraParallax();
      return;
    }

    this.cameraController.configure(bounds, limits);
    this.syncCameraParallax();
  }

  private syncCameraParallax(): void {
    const camera = this.cameraController?.getState();

    if (camera) {
      this.ambientAnimationSystem.syncCamera(camera);
    }
  }

  private loadAssetsWhenNeeded(viewModel: LudusMapSceneViewModel): void {
    const textureAssetPaths = collectLudusMapTextureAssetPaths(viewModel);
    const spritesheetAssetPaths = collectLudusMapSpritesheetAssetPaths(viewModel);
    const assetPathKey = [
      textureAssetPaths.join(ASSET_PATH_SEPARATOR),
      spritesheetAssetPaths.join(ASSET_PATH_SEPARATOR),
    ].join(ASSET_PATH_SEPARATOR);

    if (assetPathKey === this.assetPathKey) {
      return;
    }

    this.assetPathKey = assetPathKey;
    void this.loadAssets(textureAssetPaths, spritesheetAssetPaths, viewModel);
  }

  private async loadAssets(
    textureAssetPaths: string[],
    spritesheetAssetPaths: string[],
    viewModel: LudusMapSceneViewModel,
  ): Promise<void> {
    const loadId = ++this.assetLoadId;
    const [textures, spritesheets] = await Promise.all([
      this.assetLoader.loadTextures(textureAssetPaths),
      this.assetLoader.loadSpritesheets(spritesheetAssetPaths),
    ]);

    if (this.isDestroyed || loadId !== this.assetLoadId) {
      return;
    }

    this.textures = textures;
    this.spritesheets = spritesheets;
    this.reconcile(viewModel);
  }

  private reconcile(viewModel: LudusMapSceneViewModel): void {
    const backgroundTexture = viewModel.theme.backgroundAssetPath
      ? this.textures.get(viewModel.theme.backgroundAssetPath)
      : undefined;

    drawFallbackBackground(this.backgroundFallback, viewModel);
    this.backgroundFallback.visible = !backgroundTexture;
    this.backgroundSprite.visible = Boolean(backgroundTexture);
    this.backgroundSprite.texture = backgroundTexture ?? Texture.EMPTY;
    setPixelArtSpriteSize(this.backgroundSprite, viewModel.width, viewModel.height);
    drawTerrainOverlay(this.terrainOverlay, viewModel);
    drawOceanWaves(this.oceanWaveGraphics, viewModel, performance.now());
    drawPaths(this.pathGraphics, viewModel.paths);
    this.reconcileDecorations(viewModel.decorations);
    this.reconcileLocations(viewModel.locations);
    this.reconcileGladiators(viewModel.gladiators);
    this.ambientAnimationSystem.reconcile(viewModel, this.textures);
    this.particleEffectSystem.reconcile(viewModel, this.textures);
    this.lightingSystem.reconcile(viewModel);
    this.updateLocationAffordances();
    this.updateDebugOverlay();
  }

  private reconcileDecorations(decorations: LudusMapSceneDecorationViewModel[]): void {
    const renderableDecorations = decorations.filter(shouldRenderDecoration);
    const activeIds = new Set(renderableDecorations.map((decoration) => decoration.id));

    for (const [decorationId, display] of this.decorations) {
      if (!activeIds.has(decorationId)) {
        destroyDisplayObject(display.container);
        this.decorations.delete(decorationId);
      }
    }

    for (const decoration of renderableDecorations) {
      const texture = decoration.assetPath ? this.textures.get(decoration.assetPath) : undefined;
      const display =
        this.decorations.get(decoration.id) ?? this.createDecorationDisplay(decoration);

      this.decorations.set(decoration.id, display);
      display.decoration = decoration;
      const pivot = getDecorationPivot(decoration);

      display.container.label = decoration.id;
      display.container.pivot.set(pivot.x, pivot.y);
      display.container.rotation = (decoration.rotation * Math.PI) / 180;
      display.container.x = decoration.x + pivot.x;
      display.container.y = decoration.y + pivot.y;
      display.container.zIndex = decoration.sortY;
      display.sprite.texture = texture ?? Texture.EMPTY;
      display.sprite.visible = Boolean(texture);
      setPixelArtSpriteSize(display.sprite, decoration.width, decoration.height, {
        preferIntegerScale: true,
      });
      display.fallback.visible = false;
      display.fallback.clear();
      this.updateDecorationAnimation(display, performance.now());
    }
  }

  private updateDecorationAnimation(display: DecorationDisplay, now: number): void {
    const viewModel = this.viewModel;
    const { decoration } = display;
    const baseRotation = (decoration.rotation * Math.PI) / 180;

    if (!viewModel || viewModel.reducedMotion || !shouldSwayDecoration(decoration)) {
      display.container.rotation = baseRotation;
      return;
    }

    const elapsedSeconds = now / 1000 + decoration.sortY * 0.003;
    const amplitudeDegrees = decoration.style === 'cypressTree' ? 1.6 : 2.4;
    const wave = Math.sin(elapsedSeconds * 1.25);

    display.container.rotation = baseRotation + (wave * amplitudeDegrees * Math.PI) / 180;
  }

  private reconcileGladiators(gladiators: LudusMapSceneGladiatorViewModel[]): void {
    const activeIds = new Set(gladiators.map((gladiator) => gladiator.id));

    for (const [gladiatorId, display] of this.gladiators) {
      if (!activeIds.has(gladiatorId)) {
        destroyDisplayObject(display.container);
        this.gladiators.delete(gladiatorId);
      }
    }

    for (const gladiator of gladiators) {
      const display = this.gladiators.get(gladiator.id) ?? this.createGladiatorDisplay(gladiator);

      this.gladiators.set(gladiator.id, display);
      display.gladiator = gladiator;
      this.updateGladiatorSprite(display);
      this.updateGladiatorAnimation(display, performance.now());
    }
  }

  private reconcileLocations(locations: LudusMapSceneLocationViewModel[]): void {
    const activeIds = new Set(locations.map((location) => location.id));

    for (const [locationId, display] of this.locations) {
      if (!activeIds.has(locationId)) {
        destroyDisplayObject(display.backContainer);
        destroyDisplayObject(display.propsContainer);
        destroyDisplayObject(display.frontContainer);
        destroyDisplayObject(display.highlight);
        destroyDisplayObject(display.interaction);
        destroyDisplayObject(display.label);
        this.locations.delete(locationId);
      }
    }

    for (const location of locations) {
      const display = this.locations.get(location.id) ?? this.createLocationDisplay(location);

      this.locations.set(location.id, display);
      display.location = location;
      display.label.text = location.label;
      this.updateLocationDisplay(display);
    }
  }

  private updateGladiatorAnimation(display: GladiatorDisplay, now: number): void {
    const viewModel = this.viewModel;
    const gladiator = display.gladiator;

    if (!viewModel) {
      return;
    }

    const visualGameMinute =
      this.gameMinuteAtSync +
      (now - this.gameMinuteSyncedAt) * viewModel.gameMinutesPerRealMillisecond;
    const progress =
      viewModel.gameMinutesPerRealMillisecond === 0
        ? 1
        : clamp(
            (visualGameMinute - gladiator.movementStartedAt) /
              Math.max(gladiator.movementDuration, 1),
            0,
            1,
          );

    display.container.x = interpolate(gladiator.from.x, gladiator.to.x, progress);
    display.container.y = interpolate(gladiator.from.y, gladiator.to.y, progress);
    display.container.zIndex = display.container.y + gladiator.animation.ySortOffset;

    if (!viewModel.reducedMotion && display.sprite.visible) {
      display.sprite.update(this.app.ticker);
    }
  }

  private getGladiatorAnimationTextures(gladiator: LudusMapSceneGladiatorViewModel): Texture[] {
    const spritesheet = gladiator.spritesheetAtlasPath
      ? this.spritesheets.get(gladiator.spritesheetAtlasPath)
      : undefined;
    const spritesheetTextures =
      spritesheet && gladiator.frameNames.length > 0
        ? gladiator.frameNames.flatMap((frameName) => {
            const texture = spritesheet.textures[frameName];

            return texture ? [texture] : [];
          })
        : [];

    if (spritesheetTextures.length > 0) {
      return spritesheetTextures;
    }

    return gladiator.fallbackFramePaths.flatMap((framePath) => {
      const texture = this.textures.get(framePath);

      return texture ? [texture] : [];
    });
  }

  private updateGladiatorSprite(display: GladiatorDisplay): void {
    const viewModel = this.viewModel;
    const { animation } = display.gladiator;
    const textures = this.getGladiatorAnimationTextures(display.gladiator);
    const animationSignature = [
      display.gladiator.animationId,
      display.gladiator.spritesheetAtlasPath ?? 'fallback',
      display.gladiator.frameNames.join('|'),
      display.gladiator.fallbackFramePaths.join('|'),
    ].join(':');

    display.sprite.visible = textures.length > 0;
    display.fallback.visible = textures.length === 0;

    if (textures.length === 0) {
      return;
    }

    display.sprite.anchor.set(animation.anchor.x, animation.anchor.y);
    display.sprite.loop = animation.loop && !(viewModel?.reducedMotion ?? false);
    display.sprite.animationSpeed = (viewModel?.reducedMotion ?? false) ? 0 : animation.fps / 60;

    if (display.animationSignature !== animationSignature) {
      display.animationSignature = animationSignature;
      display.sprite.textures = textures;
      display.sprite.gotoAndStop(0);
    }

    if (viewModel?.reducedMotion || textures.length === 1) {
      display.sprite.gotoAndStop(0);
      return;
    }

    if (!display.sprite.playing) {
      display.sprite.play();
    }
  }

  private updateLocationAffordances(): void {
    const viewModel = this.viewModel;

    if (!viewModel) {
      return;
    }

    const zoom = this.cameraController?.getState().scale ?? viewModel.defaultZoom;

    for (const display of this.locations.values()) {
      const { location } = display;
      const isHovered = this.hoveredLocationId === location.id;
      const isSelected = viewModel.selectedLocationId === location.mapLocationId;
      const isStrategicZoom = zoom >= getLocationLabelZoomThreshold(location);
      const shouldShowLabel = isHovered || isSelected || isStrategicZoom;

      display.label.visible = shouldShowLabel;
      display.label.alpha = isSelected ? 1 : isHovered ? 0.96 : 0.74;
      drawLocationHighlight(display.highlight, location, isHovered, isSelected);
    }
  }

  private updateDebugOverlay(): void {
    if (!this.debugOverlay) {
      return;
    }

    this.debugOverlay.draw([
      ...Array.from(this.locations.values()).map((display) =>
        this.createLocationDebugMetric(display),
      ),
      ...Array.from(this.decorations.values()).map((display) =>
        this.createDecorationDebugMetric(display),
      ),
      ...Array.from(this.gladiators.values()).map((display) =>
        this.createGladiatorDebugMetric(display),
      ),
    ]);
  }

  private createLocationDebugMetric(display: LocationDisplay): PixiVisualDebugMetric {
    const { location } = display;
    const sourceSprite =
      display.exteriorSprite.texture !== Texture.EMPTY
        ? display.exteriorSprite
        : display.roofSprite.texture !== Texture.EMPTY
          ? display.roofSprite
          : display.propsSprite;

    return {
      label: `location:${location.id}`,
      x: location.x,
      y: location.y,
      width: location.width,
      height: location.height,
      nativeWidth: sourceSprite.texture === Texture.EMPTY ? undefined : sourceSprite.texture.width,
      nativeHeight:
        sourceSprite.texture === Texture.EMPTY ? undefined : sourceSprite.texture.height,
      scaleX: sourceSprite.texture === Texture.EMPTY ? undefined : sourceSprite.scale.x,
      scaleY: sourceSprite.texture === Texture.EMPTY ? undefined : sourceSprite.scale.y,
      anchor: { x: sourceSprite.anchor.x, y: sourceSprite.anchor.y },
      anchorPosition: {
        x: location.x + location.width * sourceSprite.anchor.x,
        y: location.y + location.height * sourceSprite.anchor.y,
      },
      hitbox: {
        x: location.x + location.hitArea.x,
        y: location.y + location.hitArea.y,
        width: location.hitArea.width,
        height: location.hitArea.height,
      },
      color: location.kind === 'external' ? 0xe0b15e : 0x86e7ff,
    };
  }

  private createDecorationDebugMetric(display: DecorationDisplay): PixiVisualDebugMetric {
    const { decoration, sprite } = display;

    return {
      label: `decoration:${decoration.id}`,
      x: decoration.x,
      y: decoration.y,
      width: Math.abs(sprite.width),
      height: Math.abs(sprite.height),
      nativeWidth: sprite.texture === Texture.EMPTY ? undefined : sprite.texture.width,
      nativeHeight: sprite.texture === Texture.EMPTY ? undefined : sprite.texture.height,
      scaleX: sprite.texture === Texture.EMPTY ? undefined : sprite.scale.x,
      scaleY: sprite.texture === Texture.EMPTY ? undefined : sprite.scale.y,
      anchor: { x: sprite.anchor.x, y: sprite.anchor.y },
      anchorPosition: {
        x: decoration.x + Math.abs(sprite.width) * sprite.anchor.x,
        y: decoration.y + Math.abs(sprite.height) * sprite.anchor.y,
      },
      color: 0xb3ff91,
    };
  }

  private createGladiatorDebugMetric(display: GladiatorDisplay): PixiVisualDebugMetric {
    const { animation } = display.gladiator;
    const { sprite } = display;
    const width = Math.abs(sprite.width);
    const height = Math.abs(sprite.height);
    const originX = display.container.x + sprite.x;
    const originY = display.container.y + sprite.y;

    return {
      label: `gladiator:${display.gladiator.id}`,
      x: originX - width * sprite.anchor.x,
      y: originY - height * sprite.anchor.y,
      width,
      height,
      nativeWidth: sprite.texture === Texture.EMPTY ? undefined : sprite.texture.width,
      nativeHeight: sprite.texture === Texture.EMPTY ? undefined : sprite.texture.height,
      scaleX: sprite.texture === Texture.EMPTY ? undefined : sprite.scale.x,
      scaleY: sprite.texture === Texture.EMPTY ? undefined : sprite.scale.y,
      anchor: { x: sprite.anchor.x, y: sprite.anchor.y },
      anchorPosition: { x: originX, y: originY },
      hitbox: {
        x: display.container.x + animation.hitbox.x,
        y: display.container.y + animation.hitbox.y,
        width: animation.hitbox.width,
        height: animation.hitbox.height,
      },
      color: 0xf8e56b,
    };
  }

  private updateLocationDisplay(display: LocationDisplay): void {
    const { location } = display;
    const exteriorTexture = location.exteriorAssetPath
      ? this.textures.get(location.exteriorAssetPath)
      : undefined;
    const propsTexture = location.propsAssetPath
      ? this.textures.get(location.propsAssetPath)
      : undefined;
    const roofTexture = location.roofAssetPath
      ? this.textures.get(location.roofAssetPath)
      : undefined;
    const visualAlpha = location.isOwned ? 1 : 0.58;

    display.backContainer.x = location.x;
    display.backContainer.y = location.y;
    display.backContainer.zIndex = location.sortY;
    display.propsContainer.x = location.x;
    display.propsContainer.y = location.y;
    display.propsContainer.zIndex = location.sortY + 1;
    display.frontContainer.x = location.x;
    display.frontContainer.y = location.y;
    display.frontContainer.zIndex = location.sortY;
    display.highlight.x = location.x + location.hitArea.x;
    display.highlight.y = location.y + location.hitArea.y;
    display.highlight.zIndex = 0;
    display.interaction.x = location.x + location.hitArea.x;
    display.interaction.y = location.y + location.hitArea.y;
    display.interaction.hitArea = new Rectangle(
      0,
      0,
      location.hitArea.width,
      location.hitArea.height,
    );
    display.label.x = location.labelPosition.x;
    display.label.y = location.labelPosition.y;
    display.exteriorSprite.texture = exteriorTexture ?? Texture.EMPTY;
    display.exteriorSprite.visible = Boolean(exteriorTexture);
    setPixelArtSpriteSize(display.exteriorSprite, location.width, location.height);
    display.exteriorSprite.alpha = visualAlpha;
    display.propsSprite.texture = propsTexture ?? Texture.EMPTY;
    display.propsSprite.visible = Boolean(propsTexture);
    setPixelArtSpriteSize(display.propsSprite, location.width, location.height);
    display.propsSprite.alpha = visualAlpha;
    display.roofSprite.texture = roofTexture ?? Texture.EMPTY;
    display.roofSprite.visible = Boolean(roofTexture);
    setPixelArtSpriteSize(display.roofSprite, location.width, location.height);
    display.roofSprite.alpha = visualAlpha;
    display.fallbackFrame.visible = !exteriorTexture;
    drawLocationFallbackFrame(display.fallbackFrame, location);
  }
}
