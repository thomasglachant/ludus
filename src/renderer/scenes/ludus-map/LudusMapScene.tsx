import {
  Container,
  FillPattern,
  Graphics,
  Matrix,
  Rectangle,
  Sprite,
  Text,
  Texture,
  type FederatedPointerEvent,
} from 'pixi.js';
import { CameraController } from '../../pixi/CameraController';
import type { PixiAssetLoader, PixiTextureMap } from '../../pixi/PixiAssetLoader';
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
  LudusMapSceneLocationViewModel,
  LudusMapSceneThemeViewModel,
  LudusMapSceneTileViewModel,
  LudusMapSceneViewModel,
  LudusMapSceneWallViewModel,
} from './LudusMapSceneViewModel';
import { ParticleEffectSystem } from './ParticleEffectSystem';
import { TimeOfDayLightingSystem } from './TimeOfDayLightingSystem';

type LudusMapLayerId =
  | 'background'
  | 'terrain-overlays'
  | 'paths'
  | 'selection-highlight'
  | 'static-props'
  | 'buildings-back'
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

interface LabelDisplay {
  container: Container;
  detail: Text;
  plaque: Graphics;
  title: Text;
  subtitle: Text;
}

interface LocationDisplay {
  backContainer: Container;
  exteriorSprite: Sprite;
  fallbackFrame: Graphics;
  frontContainer: Container;
  highlight: Graphics;
  interaction: Container;
  labelDisplay: LabelDisplay;
  locationDetails: Graphics;
  location: LudusMapSceneLocationViewModel;
  propsContainer: Container;
  propsSprite: Sprite;
  roofSprite: Sprite;
}

type LudusMapTexturePatterns = Partial<
  Record<keyof LudusMapSceneViewModel['textures'], FillPattern>
>;

const ASSET_PATH_SEPARATOR = '\u0000';
const LUDUS_MAP_LAYER_IDS = [
  'background',
  'terrain-overlays',
  'paths',
  'selection-highlight',
  'static-props',
  'buildings-back',
  'buildings-front',
  'ambient-effects',
  'lighting-overlay',
  'light-sprites',
  'labels',
] as const satisfies readonly LudusMapLayerId[];

const MAP_TEXTURE_PATTERN_SCALE = 0.25;
const TIME_OF_DAY_THEME_TRANSITION_MILLISECONDS = 2_400;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function interpolate(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

function easeInOut(progress: number): number {
  return progress * progress * (3 - 2 * progress);
}

function interpolateColor(start: number, end: number, progress: number): number {
  const startRed = (start >> 16) & 255;
  const startGreen = (start >> 8) & 255;
  const startBlue = start & 255;
  const endRed = (end >> 16) & 255;
  const endGreen = (end >> 8) & 255;
  const endBlue = end & 255;

  return (
    (Math.round(interpolate(startRed, endRed, progress)) << 16) |
    (Math.round(interpolate(startGreen, endGreen, progress)) << 8) |
    Math.round(interpolate(startBlue, endBlue, progress))
  );
}

function interpolateTheme(
  start: LudusMapSceneThemeViewModel,
  end: LudusMapSceneThemeViewModel,
  progress: number,
): LudusMapSceneThemeViewModel {
  return {
    skyColor: interpolateColor(start.skyColor, end.skyColor, progress),
    terrainColor: interpolateColor(start.terrainColor, end.terrainColor, progress),
    terrainHighlightColor: interpolateColor(
      start.terrainHighlightColor,
      end.terrainHighlightColor,
      progress,
    ),
    overlayColor: interpolateColor(start.overlayColor, end.overlayColor, progress),
    overlayOpacity: interpolate(start.overlayOpacity, end.overlayOpacity, progress),
    lightColor: interpolateColor(start.lightColor, end.lightColor, progress),
    shadowColor: interpolateColor(start.shadowColor, end.shadowColor, progress),
    spriteBrightness: interpolate(start.spriteBrightness, end.spriteBrightness, progress),
    buildingLightOpacity: interpolate(
      start.buildingLightOpacity,
      end.buildingLightOpacity,
      progress,
    ),
    backgroundAssetPath: progress < 1 ? start.backgroundAssetPath : end.backgroundAssetPath,
  };
}

function areThemesEqual(
  left: LudusMapSceneThemeViewModel,
  right: LudusMapSceneThemeViewModel,
): boolean {
  return (
    left.skyColor === right.skyColor &&
    left.terrainColor === right.terrainColor &&
    left.terrainHighlightColor === right.terrainHighlightColor &&
    left.overlayColor === right.overlayColor &&
    left.overlayOpacity === right.overlayOpacity &&
    left.lightColor === right.lightColor &&
    left.shadowColor === right.shadowColor &&
    left.spriteBrightness === right.spriteBrightness &&
    left.buildingLightOpacity === right.buildingLightOpacity &&
    left.backgroundAssetPath === right.backgroundAssetPath
  );
}

function isAssetPath(assetPath: string | undefined): assetPath is string {
  return Boolean(assetPath);
}

function collectLudusMapTextureAssetPaths(viewModel: LudusMapSceneViewModel): string[] {
  return Array.from(
    new Set([
      ...Object.values(viewModel.textures),
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
      ...viewModel.ambientElements.map((element) => element.assetPath),
      ...(viewModel.theme.backgroundAssetPath ? [viewModel.theme.backgroundAssetPath] : []),
    ]),
  );
}

function isRenderableTexture(texture: Texture | undefined): texture is Texture {
  return Boolean(texture && texture !== Texture.EMPTY);
}

function createTexturePattern(texture: Texture | undefined): FillPattern | undefined {
  if (!isRenderableTexture(texture)) {
    return undefined;
  }

  const pattern = new FillPattern(texture, 'repeat');

  pattern.setTransform(new Matrix().scale(MAP_TEXTURE_PATTERN_SCALE, MAP_TEXTURE_PATTERN_SCALE));

  return pattern;
}

function createLudusMapTexturePatterns(
  viewModel: LudusMapSceneViewModel,
  textures: PixiTextureMap,
): LudusMapTexturePatterns {
  return {
    grass: createTexturePattern(textures.get(viewModel.textures.grass)),
    sand: createTexturePattern(textures.get(viewModel.textures.sand)),
    stonePath: createTexturePattern(textures.get(viewModel.textures.stonePath)),
    wallStone: createTexturePattern(textures.get(viewModel.textures.wallStone)),
  };
}

function fillRectWithPattern(
  graphics: Graphics,
  pattern: FillPattern | undefined,
  fallback: {
    alpha?: number;
    color: number;
  },
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  graphics.rect(x, y, width, height);
  graphics.fill(pattern ? { alpha: fallback.alpha ?? 1, fill: pattern } : fallback);
}

function fillRoundRectWithPattern(
  graphics: Graphics,
  pattern: FillPattern | undefined,
  fallback: {
    alpha?: number;
    color: number;
  },
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  graphics.roundRect(x, y, width, height, radius);
  graphics.fill(pattern ? { alpha: fallback.alpha ?? 1, fill: pattern } : fallback);
}

function drawFallbackBackground(graphics: Graphics, viewModel: LudusMapSceneViewModel): void {
  graphics.clear();
  graphics.setFillStyle({ color: viewModel.theme.terrainColor });
  graphics.rect(0, 0, viewModel.width, viewModel.height);
  graphics.fill();
}

function drawViewportTerrainFill(
  graphics: Graphics,
  viewModel: LudusMapSceneViewModel,
  width: number,
  height: number,
  grassPattern?: FillPattern,
): void {
  const tileSize = Math.max(32, Math.round(viewModel.grid.cellSize * 0.85));

  graphics.clear();
  fillRectWithPattern(graphics, grassPattern, { color: 0x7d8e56, alpha: 1 }, 0, 0, width, height);

  for (let row = 0; row < Math.ceil(height / tileSize) + 1; row += 1) {
    for (let column = 0; column < Math.ceil(width / tileSize) + 1; column += 1) {
      const x = column * tileSize;
      const y = row * tileSize;
      const warmPatch = (column * 7 + row * 11) % 5 === 0;
      const coolPatch = (column * 5 + row * 3) % 7 === 0;

      graphics.setFillStyle({
        color: warmPatch ? viewModel.theme.terrainColor : coolPatch ? 0x6f8150 : 0x87985d,
        alpha: warmPatch ? 0.3 : 0.18,
      });
      graphics.rect(x, y, tileSize, tileSize);
      graphics.fill();
      graphics.setFillStyle({ color: 0xe3c477, alpha: 0.08 });
      graphics.rect(x + 7, y + 9, tileSize - 14, 3);
      graphics.fill();
    }
  }

  graphics.setFillStyle({ color: viewModel.theme.lightColor, alpha: 0.06 });
  graphics.ellipse(width * 0.5, height * 0.42, width * 0.34, height * 0.28);
  graphics.fill();
}

function drawViewportLightingOverlay(
  graphics: Graphics,
  viewModel: LudusMapSceneViewModel,
  width: number,
  height: number,
): void {
  graphics.clear();
  graphics.setFillStyle({
    color: viewModel.theme.overlayColor,
    alpha: viewModel.theme.overlayOpacity,
  });
  graphics.rect(0, 0, width, height);
  graphics.fill();
}

function drawTerrainOverlay(
  graphics: Graphics,
  viewModel: LudusMapSceneViewModel,
  patterns: LudusMapTexturePatterns,
): void {
  graphics.clear();

  for (const tile of viewModel.tiles) {
    drawTerrainTile(graphics, tile, viewModel, patterns);
  }
}

function drawTerrainTile(
  graphics: Graphics,
  tile: LudusMapSceneTileViewModel,
  viewModel: LudusMapSceneViewModel,
  patterns: LudusMapTexturePatterns,
): void {
  const terrainColorById = {
    compoundDirt: viewModel.theme.terrainColor,
    grass: 0x7c8d55,
    rock: 0x8b7356,
  } satisfies Record<LudusMapSceneTileViewModel['terrainId'], number>;
  const groundColorById = {
    courtyard: 0xb98a52,
    packedRoad: 0x8e6d47,
  } satisfies Record<NonNullable<LudusMapSceneTileViewModel['groundId']>, number>;
  const terrainPatternById = {
    compoundDirt: patterns.sand,
    grass: patterns.grass,
    rock: patterns.wallStone,
  } satisfies Record<LudusMapSceneTileViewModel['terrainId'], FillPattern | undefined>;
  const groundPatternById = {
    courtyard: patterns.sand,
    packedRoad: patterns.stonePath,
  } satisfies Record<NonNullable<LudusMapSceneTileViewModel['groundId']>, FillPattern | undefined>;
  const variationAlpha = (tile.column + tile.row) % 2 === 0 ? 0.04 : 0.08;

  fillRectWithPattern(
    graphics,
    terrainPatternById[tile.terrainId],
    { color: terrainColorById[tile.terrainId], alpha: 1 },
    tile.x,
    tile.y,
    tile.width,
    tile.height,
  );

  graphics.setFillStyle({ color: 0xf1d083, alpha: variationAlpha });
  graphics.rect(tile.x + 6, tile.y + 8, tile.width - 12, 4);
  graphics.fill();

  if (tile.groundId) {
    const inset = tile.groundId === 'packedRoad' ? 4 : 2;
    const alpha = tile.groundId === 'packedRoad' ? 1 : 0.18;

    fillRoundRectWithPattern(
      graphics,
      groundPatternById[tile.groundId],
      { color: groundColorById[tile.groundId], alpha },
      tile.x + inset,
      tile.y + inset,
      tile.width - inset * 2,
      tile.height - inset * 2,
      tile.groundId === 'packedRoad' ? 4 : 1,
    );
  }

  graphics.setStrokeStyle({ color: 0x4b3925, width: 1, alpha: 0.08 });
  graphics.rect(tile.x, tile.y, tile.width, tile.height);
  graphics.stroke();
}

function drawMapWalls(
  graphics: Graphics,
  walls: LudusMapSceneWallViewModel[],
  wallPattern?: FillPattern,
): void {
  graphics.clear();

  for (const wall of walls) {
    graphics.setFillStyle({ color: 0x1b130e, alpha: 0.24 });
    graphics.rect(wall.x + 5, wall.y + 12, wall.width - 10, wall.height - 8);
    graphics.fill();
    fillRoundRectWithPattern(
      graphics,
      wallPattern,
      { color: 0x7e6b57, alpha: 0.98 },
      wall.x + 6,
      wall.y + 5,
      wall.width - 12,
      wall.height - 14,
      3,
    );
    graphics.setFillStyle({ color: 0xbfa06a, alpha: 0.62 });
    graphics.rect(wall.x + 10, wall.y + 9, wall.width - 20, 5);
    graphics.fill();
    graphics.setStrokeStyle({ color: 0x453425, width: 3, alpha: 0.64 });
    graphics.roundRect(wall.x + 6, wall.y + 5, wall.width - 12, wall.height - 14, 3);
    graphics.stroke();
  }
}

function drawLocationFallbackFrame(
  graphics: Graphics,
  location: LudusMapSceneLocationViewModel,
): void {
  const fillColor =
    location.kind === 'external'
      ? 0x7b4c32
      : location.ownershipStatus === 'owned'
        ? 0x9b6535
        : location.ownershipStatus === 'available'
          ? 0x6d5a37
          : 0x3f3a34;
  const strokeColor =
    location.kind === 'external'
      ? 0xe0b15e
      : location.ownershipStatus === 'owned'
        ? 0xd6a557
        : location.ownershipStatus === 'available'
          ? 0xd0a85a
          : 0x756a5b;

  graphics.clear();
  graphics.setFillStyle({
    color: fillColor,
    alpha: 0.28,
  });
  graphics.rect(0, 0, location.width, location.height);
  graphics.fill();
  graphics.setStrokeStyle({
    color: strokeColor,
    width: 4,
    alpha: 0.72,
  });
  graphics.rect(0, 0, location.width, location.height);
  graphics.stroke();
}

function drawConstructionSite(graphics: Graphics, location: LudusMapSceneLocationViewModel): void {
  const isAvailable = location.ownershipStatus === 'available';
  const foundationColor = isAvailable ? 0xc6a15e : 0x7a6b59;
  const stakeColor = isAvailable ? 0x8b5a2f : 0x51483d;
  const strokeColor = isAvailable ? 0xe0bd72 : 0x8c7d68;
  const markerFillColor = isAvailable ? 0x28563b : 0x3a3630;
  const markerStrokeColor = isAvailable ? 0xa8d27c : 0xa39780;
  const markerIconColor = isAvailable ? 0xe9f0b3 : 0xc1b49b;
  const insetX = Math.max(28, location.width * 0.12);
  const insetY = Math.max(24, location.height * 0.14);
  const foundationWidth = location.width - insetX * 2;
  const foundationHeight = location.height - insetY * 2;
  const markerX = location.width / 2;
  const markerY = Math.max(34, insetY - 4);

  graphics.setFillStyle({ color: 0x1d1712, alpha: isAvailable ? 0.18 : 0.24 });
  graphics.roundRect(10, 18, location.width - 20, location.height - 16, 8);
  graphics.fill();

  graphics.setFillStyle({ color: foundationColor, alpha: isAvailable ? 0.48 : 0.26 });
  graphics.roundRect(insetX, insetY, foundationWidth, foundationHeight, 8);
  graphics.fill();
  graphics.setStrokeStyle({ color: strokeColor, width: 5, alpha: isAvailable ? 0.78 : 0.45 });
  graphics.roundRect(insetX, insetY, foundationWidth, foundationHeight, 8);
  graphics.stroke();

  graphics.setStrokeStyle({ color: strokeColor, width: 3, alpha: isAvailable ? 0.45 : 0.26 });
  for (let lineIndex = 0; lineIndex < 4; lineIndex += 1) {
    const x = insetX + foundationWidth * ((lineIndex + 1) / 5);

    graphics.moveTo(x, insetY + 12);
    graphics.lineTo(x, insetY + foundationHeight - 12);
    graphics.stroke();
  }

  graphics.setStrokeStyle({ color: stakeColor, width: 5, alpha: isAvailable ? 0.72 : 0.42 });
  graphics.moveTo(insetX + 10, insetY + foundationHeight - 10);
  graphics.lineTo(insetX + foundationWidth - 10, insetY + 10);
  graphics.stroke();
  graphics.moveTo(insetX + 10, insetY + 10);
  graphics.lineTo(insetX + foundationWidth - 10, insetY + foundationHeight - 10);
  graphics.stroke();

  const postRadius = isAvailable ? 8 : 6;

  graphics.setFillStyle({ color: stakeColor, alpha: isAvailable ? 0.9 : 0.48 });
  graphics.circle(insetX, insetY, postRadius);
  graphics.circle(insetX + foundationWidth, insetY, postRadius);
  graphics.circle(insetX, insetY + foundationHeight, postRadius);
  graphics.circle(insetX + foundationWidth, insetY + foundationHeight, postRadius);
  graphics.fill();

  graphics.setFillStyle({ color: markerFillColor, alpha: isAvailable ? 0.94 : 0.86 });
  graphics.roundRect(markerX - 36, markerY - 24, 72, 44, 6);
  graphics.fill();
  graphics.setStrokeStyle({
    color: markerStrokeColor,
    width: isAvailable ? 4 : 3,
    alpha: isAvailable ? 0.94 : 0.72,
  });
  graphics.roundRect(markerX - 36, markerY - 24, 72, 44, 6);
  graphics.stroke();

  graphics.setStrokeStyle({ color: markerIconColor, width: 6, alpha: 0.95 });

  if (isAvailable) {
    graphics.moveTo(markerX - 15, markerY - 2);
    graphics.lineTo(markerX + 15, markerY - 2);
    graphics.stroke();
    graphics.moveTo(markerX, markerY - 17);
    graphics.lineTo(markerX, markerY + 13);
    graphics.stroke();
    return;
  }

  graphics.roundRect(markerX - 17, markerY - 4, 34, 21, 4);
  graphics.stroke();
  graphics.arc(markerX, markerY - 4, 14, Math.PI, 0);
  graphics.stroke();
}

function drawLocationDetails(graphics: Graphics, location: LudusMapSceneLocationViewModel): void {
  graphics.clear();

  if (location.kind === 'building' && !location.isOwned) {
    drawConstructionSite(graphics, location);
    return;
  }

  const isArena = location.id === 'arena';
  const wallColor = isArena ? 0x9c6a3d : 0x7b5a3b;
  const floorColor = isArena ? 0xc09352 : 0xbe8c55;
  const roomColor = location.id === 'infirmary' ? 0xd6c28f : 0xe0b879;
  const roofColor = location.id === 'pleasureHall' ? 0x9f4438 : 0x8c5130;
  const inset = isArena ? 42 : 34;

  graphics.setFillStyle({ color: 0x2b2118, alpha: 0.2 });
  graphics.roundRect(10, 18, location.width - 20, location.height - 16, 8);
  graphics.fill();

  graphics.setFillStyle({ color: wallColor, alpha: 0.92 });
  graphics.roundRect(18, 24, location.width - 36, location.height - 44, isArena ? 84 : 8);
  graphics.fill();

  graphics.setFillStyle({ color: floorColor, alpha: 0.96 });
  graphics.roundRect(
    inset,
    inset,
    location.width - inset * 2,
    location.height - inset * 1.55,
    isArena ? 62 : 5,
  );
  graphics.fill();

  if (!isArena) {
    graphics.setFillStyle({ color: roofColor, alpha: 0.82 });
    graphics.rect(26, 18, location.width - 52, 42);
    graphics.fill();
    graphics.setFillStyle({ color: roomColor, alpha: 0.78 });
    graphics.rect(48, 78, location.width - 96, location.height - 120);
    graphics.fill();

    const dividerY = location.height * 0.52;
    graphics.setStrokeStyle({ color: 0x6d4a31, width: 5, alpha: 0.68 });
    graphics.moveTo(56, dividerY);
    graphics.lineTo(location.width - 56, dividerY);
    graphics.stroke();
    graphics.moveTo(location.width / 2, 76);
    graphics.lineTo(location.width / 2, location.height - 60);
    graphics.stroke();
  } else {
    graphics.setFillStyle({ color: 0x8c5435, alpha: 0.78 });
    graphics.ellipse(
      location.width / 2,
      location.height / 2 + 5,
      location.width * 0.29,
      location.height * 0.24,
    );
    graphics.fill();
    graphics.setStrokeStyle({ color: 0xe3c06e, width: 6, alpha: 0.48 });
    graphics.ellipse(
      location.width / 2,
      location.height / 2 + 5,
      location.width * 0.38,
      location.height * 0.32,
    );
    graphics.stroke();
  }

  for (const slot of location.activitySlots) {
    const x = slot.x - location.x;
    const y = slot.y - location.y;

    graphics.setFillStyle({ color: 0x1f1711, alpha: 0.28 });
    graphics.ellipse(x, y + 9, 24, 9);
    graphics.fill();
    graphics.setFillStyle({ color: 0xe0bd72, alpha: 0.86 });
    graphics.roundRect(x - 20, y - 15, 40, 30, 4);
    graphics.fill();
    graphics.setStrokeStyle({ color: 0x6e3f25, width: 4, alpha: 0.72 });
    graphics.roundRect(x - 20, y - 15, 40, 30, 4);
    graphics.stroke();
  }

  const entranceX = location.entrancePosition.x - location.x;
  const entranceY = location.entrancePosition.y - location.y;

  graphics.setFillStyle({ color: 0x22160f, alpha: 0.36 });
  graphics.ellipse(entranceX, entranceY + 12, 32, 11);
  graphics.fill();
  graphics.setFillStyle({ color: 0x352114, alpha: 0.95 });
  graphics.roundRect(entranceX - 25, entranceY - 20, 50, 36, 5);
  graphics.fill();
  graphics.setStrokeStyle({ color: 0xf0c46d, width: 4, alpha: 0.95 });
  graphics.roundRect(entranceX - 25, entranceY - 20, 50, 36, 5);
  graphics.stroke();
  graphics.setFillStyle({ color: 0xf0c46d, alpha: 0.9 });
  graphics.poly([
    entranceX,
    entranceY + 18,
    entranceX - 10,
    entranceY + 2,
    entranceX + 10,
    entranceY + 2,
  ]);
  graphics.fill();

  graphics.setStrokeStyle({ color: 0xe2bd67, width: 3, alpha: 0.64 });
  graphics.roundRect(18, 24, location.width - 36, location.height - 44, isArena ? 84 : 8);
  graphics.stroke();
}

function drawLabelPlaque(labelDisplay: LabelDisplay, isActive: boolean): void {
  const { detail, plaque, title, subtitle } = labelDisplay;
  const paddingX = 18;
  const paddingTop = 8;
  const hasSubtitle = subtitle.visible && Boolean(subtitle.text);
  const hasDetail = detail.visible && Boolean(detail.text);
  const paddingBottom = hasSubtitle || hasDetail ? 10 : 8;
  const titleWidth = Math.ceil(title.width);
  const subtitleWidth = hasSubtitle ? Math.ceil(subtitle.width) : 0;
  const detailWidth = hasDetail ? Math.ceil(detail.width) : 0;
  const width = Math.max(118, titleWidth, subtitleWidth, detailWidth) + paddingX * 2;
  const height =
    paddingTop +
    Math.ceil(title.height) +
    (hasSubtitle ? Math.ceil(subtitle.height) + 1 : 0) +
    (hasDetail ? Math.ceil(detail.height) + 2 : 0) +
    paddingBottom;
  const x = -width / 2;
  const y = 0;
  const borderColor = isActive ? 0xf1c46b : 0xc18a3e;

  plaque.clear();
  plaque.setFillStyle({ color: 0x15110f, alpha: isActive ? 0.98 : 0.9 });
  plaque.roundRect(x, y, width, height, 5);
  plaque.fill();
  plaque.setFillStyle({ color: 0x3b2a1c, alpha: isActive ? 0.5 : 0.34 });
  plaque.roundRect(x + 5, y + 5, width - 10, height - 10, 3);
  plaque.fill();
  plaque.setStrokeStyle({ color: borderColor, width: isActive ? 4 : 3, alpha: isActive ? 1 : 0.9 });
  plaque.roundRect(x, y, width, height, 5);
  plaque.stroke();
  plaque.setStrokeStyle({ color: 0x6d4826, width: 1, alpha: 0.72 });
  plaque.roundRect(x + 5, y + 5, width - 10, height - 10, 3);
  plaque.stroke();
  plaque.setFillStyle({ color: borderColor, alpha: 0.95 });
  plaque.circle(x + 9, y + 9, 2.5);
  plaque.circle(x + width - 9, y + 9, 2.5);
  plaque.circle(x + 9, y + height - 9, 2.5);
  plaque.circle(x + width - 9, y + height - 9, 2.5);
  plaque.fill();
  plaque.setFillStyle({ color: 0x8f5f2f, alpha: 0.9 });
  plaque.rect(x + 16, y + 7, 22, 3);
  plaque.rect(x + width - 38, y + 7, 22, 3);
  plaque.fill();

  title.x = 0;
  title.y = y + paddingTop;
  subtitle.x = 0;
  subtitle.y = title.y + title.height + 1;
  detail.x = 0;
  detail.y = hasSubtitle ? subtitle.y + subtitle.height + 1 : title.y + title.height + 1;
}

function drawLocationHighlight(
  graphics: Graphics,
  location: LudusMapSceneLocationViewModel,
  isSelected: boolean,
): void {
  graphics.clear();

  if (!isSelected) {
    graphics.visible = false;
    return;
  }

  graphics.visible = true;
  graphics.setFillStyle({
    color: 0x7a4f2a,
    alpha: 0.08,
  });
  graphics.roundRect(0, 0, location.hitArea.width, location.hitArea.height, 10);
  graphics.fill();
  graphics.setStrokeStyle({
    color: 0xc78b3d,
    width: 3,
    alpha: 0.52,
  });
  graphics.roundRect(0, 0, location.hitArea.width, location.hitArea.height, 10);
  graphics.stroke();
}

function shouldRenderDecoration(decoration: LudusMapSceneDecorationViewModel): boolean {
  return Boolean(decoration.assetPath);
}

function getDecorationLayerId(decoration: LudusMapSceneDecorationViewModel): LudusMapLayerId {
  void decoration;
  return 'static-props';
}

function shouldSwayDecoration(decoration: LudusMapSceneDecorationViewModel): boolean {
  void decoration;
  return false;
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

function createPlaqueText(text: string, fontSize: number, fill: string): Text {
  const label = new Text({
    text,
    style: {
      align: 'center',
      dropShadow: {
        alpha: 0.76,
        angle: Math.PI / 2,
        blur: 1,
        color: '#1c130c',
        distance: 2,
      },
      fill,
      fontFamily: 'serif',
      fontSize,
      fontWeight: '700',
      stroke: { color: '#2f2117', width: 3 },
    },
  });

  label.anchor.set(0.5, 0);
  label.eventMode = 'none';
  label.resolution = 2;
  label.roundPixels = true;

  return label;
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
  private readonly layers = createRenderLayerSetup(LUDUS_MAP_LAYER_IDS, {
    'ambient-effects': { sortableChildren: true },
    'buildings-back': { sortableChildren: true },
    'light-sprites': { sortableChildren: true },
    'static-props': { sortableChildren: true },
  });
  private readonly lightingSystem: TimeOfDayLightingSystem;
  private readonly locations = new Map<string, LocationDisplay>();
  private readonly options: LudusMapSceneOptions;
  private readonly particleEffectSystem: ParticleEffectSystem;
  private readonly pathGraphics = new Graphics({ roundPixels: true });
  private readonly terrainOverlay = new Graphics({ roundPixels: true });
  private readonly viewportLightingOverlay = new Graphics({ roundPixels: true });
  private readonly viewportTerrainFill = new Graphics({ roundPixels: true });
  private assetLoadId = 0;
  private assetPathKey = '';
  private cameraController: CameraController | null = null;
  private hoveredLocationId: string | null = null;
  private isDestroyed = false;
  private displayedTheme: LudusMapSceneThemeViewModel | null = null;
  private themeTransitionFrom: LudusMapSceneThemeViewModel | null = null;
  private themeTransitionStartedAt = 0;
  private themeTransitionTarget: LudusMapSceneThemeViewModel | null = null;
  private textures: PixiTextureMap = new Map();
  private viewModel: LudusMapSceneViewModel | null = null;

  constructor(context: PixiSceneContext, options: LudusMapSceneOptions = {}) {
    this.app = context.app;
    this.assetLoader = context.assetLoader;
    this.debugOverlay = context.debugMode ? new PixiVisualDebugOverlay() : null;
    this.options = options;
    this.root.label = 'ludus-map-scene';
    this.viewportLightingOverlay.eventMode = 'none';
    this.viewportLightingOverlay.label = 'viewport-time-of-day-overlay';
    this.viewportTerrainFill.label = 'viewport-terrain-fill';
    this.root.addChild(this.viewportTerrainFill, this.viewportLightingOverlay, this.layers.root);
    this.backgroundSprite.label = 'map-background-raster';
    this.backgroundFallback.label = 'map-background-fallback';
    this.pathGraphics.label = 'map-paths';
    this.terrainOverlay.label = 'terrain-overlay';
    this.layers.layers.background.addChild(this.backgroundFallback, this.backgroundSprite);
    this.layers.layers['terrain-overlays'].addChild(this.terrainOverlay);
    this.layers.layers.paths.addChild(this.pathGraphics);
    this.ambientAnimationSystem = new AmbientAnimationSystem({
      ambientLayer: this.layers.layers['ambient-effects'],
      ticker: this.app.ticker,
    });
    this.particleEffectSystem = new ParticleEffectSystem({
      layer: this.layers.layers['ambient-effects'],
      ticker: this.app.ticker,
    });
    this.lightingSystem = new TimeOfDayLightingSystem({
      brightnessTargets: [
        this.layers.layers['static-props'],
        this.layers.layers['buildings-back'],
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
    this.locations.clear();
    destroyDisplayObject(this.root);
  }

  resize(): void {
    this.cameraController?.resize();

    if (this.viewModel) {
      this.redrawThemeElements(this.getThemedViewModel(this.viewModel));
    }
  }

  tick(): void {
    if (!this.viewModel) {
      return;
    }

    const now = performance.now();

    if (this.themeTransitionFrom && this.themeTransitionTarget) {
      this.redrawThemeElements(this.getThemedViewModel(this.viewModel, now));
    }

    for (const decorationDisplay of this.decorations.values()) {
      this.updateDecorationAnimation(decorationDisplay, now);
    }

    this.updateDebugOverlay();
  }

  update(viewModel: LudusMapSceneViewModel): void {
    const now = performance.now();

    this.viewModel = viewModel;
    this.prepareThemeTransition(viewModel, now);
    this.ensureCamera(viewModel);
    this.reconcile(this.getThemedViewModel(viewModel, now));
    this.loadAssetsWhenNeeded(viewModel);
  }

  private prepareThemeTransition(viewModel: LudusMapSceneViewModel, now: number): void {
    if (!this.displayedTheme) {
      this.displayedTheme = viewModel.theme;
      this.themeTransitionTarget = viewModel.theme;
      return;
    }

    const currentTarget = this.themeTransitionTarget ?? this.displayedTheme;

    if (areThemesEqual(currentTarget, viewModel.theme)) {
      return;
    }

    this.displayedTheme = this.getDisplayedTheme(now);
    this.themeTransitionFrom = this.displayedTheme;
    this.themeTransitionTarget = viewModel.theme;
    this.themeTransitionStartedAt = now;
  }

  private getDisplayedTheme(now: number): LudusMapSceneThemeViewModel {
    if (!this.themeTransitionFrom || !this.themeTransitionTarget) {
      return this.displayedTheme ?? this.viewModel?.theme ?? this.themeTransitionTarget!;
    }

    const progress = clamp(
      (now - this.themeTransitionStartedAt) / TIME_OF_DAY_THEME_TRANSITION_MILLISECONDS,
      0,
      1,
    );

    if (progress >= 1) {
      this.displayedTheme = this.themeTransitionTarget;
      this.themeTransitionFrom = null;

      return this.displayedTheme;
    }

    this.displayedTheme = interpolateTheme(
      this.themeTransitionFrom,
      this.themeTransitionTarget,
      easeInOut(progress),
    );

    return this.displayedTheme;
  }

  private getThemedViewModel(
    viewModel: LudusMapSceneViewModel,
    now = performance.now(),
  ): LudusMapSceneViewModel {
    const theme = this.getDisplayedTheme(now);

    return theme === viewModel.theme ? viewModel : { ...viewModel, theme };
  }

  private redrawThemeElements(viewModel: LudusMapSceneViewModel): void {
    const backgroundTexture = viewModel.theme.backgroundAssetPath
      ? this.textures.get(viewModel.theme.backgroundAssetPath)
      : undefined;
    const texturePatterns = createLudusMapTexturePatterns(viewModel, this.textures);

    drawFallbackBackground(this.backgroundFallback, viewModel);
    this.drawViewportTerrainFill(viewModel, texturePatterns);
    this.drawViewportLightingOverlay(viewModel);
    this.backgroundFallback.visible = !backgroundTexture;
    this.backgroundSprite.visible = Boolean(backgroundTexture);
    this.backgroundSprite.texture = backgroundTexture ?? Texture.EMPTY;
    setPixelArtSpriteSize(this.backgroundSprite, viewModel.width, viewModel.height);
    drawTerrainOverlay(this.terrainOverlay, viewModel, texturePatterns);
    this.lightingSystem.reconcile(viewModel);
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

  private createLocationDisplay(location: LudusMapSceneLocationViewModel): LocationDisplay {
    const backContainer = new Container();
    const frontContainer = new Container();
    const propsContainer = new Container();
    const interaction = new Container();
    const highlight = new Graphics({ roundPixels: true });
    const fallbackFrame = new Graphics({ roundPixels: true });
    const locationDetails = new Graphics({ roundPixels: true });
    const labelPlaque = new Graphics({ roundPixels: true });
    const labelContainer = new Container();
    const exteriorSprite = configurePixelArtSprite(new Sprite(Texture.EMPTY));
    const propsSprite = configurePixelArtSprite(new Sprite(Texture.EMPTY));
    const roofSprite = configurePixelArtSprite(new Sprite(Texture.EMPTY));
    const titleLabel = createPlaqueText(location.labelTitle, 20, '#f6ddb0');
    const subtitleLabel = createPlaqueText(location.labelSubtitle, 16, '#d9a94f');
    const detailLabel = createPlaqueText(location.labelDetail, 14, '#c9b98f');
    const labelDisplay: LabelDisplay = {
      container: labelContainer,
      detail: detailLabel,
      plaque: labelPlaque,
      title: titleLabel,
      subtitle: subtitleLabel,
    };
    const display: LocationDisplay = {
      backContainer,
      exteriorSprite,
      fallbackFrame,
      frontContainer,
      highlight,
      interaction,
      labelDisplay,
      locationDetails,
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
    labelContainer.eventMode = 'none';
    labelContainer.label = `${location.id}:label`;
    titleLabel.label = `${location.id}:label-title`;
    subtitleLabel.label = `${location.id}:label-subtitle`;
    detailLabel.label = `${location.id}:label-detail`;
    exteriorSprite.eventMode = 'none';
    propsSprite.eventMode = 'none';
    roofSprite.eventMode = 'none';
    labelPlaque.eventMode = 'none';
    labelPlaque.label = `${location.id}:label-plaque`;
    labelContainer.addChild(labelPlaque, titleLabel, subtitleLabel, detailLabel);
    backContainer.addChild(fallbackFrame, exteriorSprite, locationDetails);
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
    this.layers.layers['static-props'].addChild(propsContainer);
    this.layers.layers['buildings-front'].addChild(frontContainer);
    this.layers.layers['selection-highlight'].addChild(highlight, interaction);
    this.layers.layers.labels.addChild(labelContainer);

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
        },
        overscrollRatio: 0,
        target: this.layers.root,
      });
      return;
    }

    this.cameraController.configure(bounds, limits);
  }

  private loadAssetsWhenNeeded(viewModel: LudusMapSceneViewModel): void {
    const textureAssetPaths = collectLudusMapTextureAssetPaths(viewModel);
    const assetPathKey = textureAssetPaths.join(ASSET_PATH_SEPARATOR);

    if (assetPathKey === this.assetPathKey) {
      return;
    }

    this.assetPathKey = assetPathKey;
    void this.loadAssets(textureAssetPaths, viewModel);
  }

  private async loadAssets(
    textureAssetPaths: string[],
    viewModel: LudusMapSceneViewModel,
  ): Promise<void> {
    const loadId = ++this.assetLoadId;
    const textures = await this.assetLoader.loadTextures(textureAssetPaths);

    if (this.isDestroyed || loadId !== this.assetLoadId) {
      return;
    }

    this.textures = textures;
    this.reconcile(viewModel);
  }

  private reconcile(viewModel: LudusMapSceneViewModel): void {
    const texturePatterns = createLudusMapTexturePatterns(viewModel, this.textures);

    this.redrawThemeElements(viewModel);
    drawMapWalls(this.pathGraphics, viewModel.walls, texturePatterns.wallStone);
    this.reconcileDecorations(viewModel.decorations);
    this.reconcileLocations(viewModel.locations);
    this.ambientAnimationSystem.reconcile(viewModel, this.textures);
    this.particleEffectSystem.reconcile(viewModel, this.textures);
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

    const elapsedSeconds = now / 1000 + decoration.animationDelaySeconds;
    const durationSeconds = Math.max(decoration.animationDurationSeconds, 1);
    const wave = Math.sin((elapsedSeconds / durationSeconds) * Math.PI * 2);

    display.container.rotation = baseRotation + (wave * Math.PI) / 180;
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
        destroyDisplayObject(display.labelDisplay.container);
        this.locations.delete(locationId);
      }
    }

    for (const location of locations) {
      const display = this.locations.get(location.id) ?? this.createLocationDisplay(location);

      this.locations.set(location.id, display);
      display.location = location;
      display.labelDisplay.title.text = location.labelTitle;
      display.labelDisplay.subtitle.text = location.labelSubtitle;
      display.labelDisplay.detail.text = location.labelDetail;
      this.updateLocationDisplay(display);
    }
  }

  private updateLocationAffordances(): void {
    const viewModel = this.viewModel;

    if (!viewModel) {
      return;
    }

    for (const display of this.locations.values()) {
      const { location } = display;
      const isHovered = this.hoveredLocationId === location.id;
      const isSelected = viewModel.selectedLocationId === location.mapLocationId;
      const isActive = isSelected || isHovered;

      display.labelDisplay.container.visible = true;
      display.labelDisplay.container.alpha = isActive ? 1 : 0.88;
      display.labelDisplay.title.alpha = isActive ? 1 : 0.92;
      display.labelDisplay.subtitle.alpha = isActive ? 1 : 0.9;
      display.labelDisplay.detail.alpha = isActive ? 1 : 0.9;
      drawLabelPlaque(display.labelDisplay, isActive);
      drawLocationHighlight(display.highlight, location, isSelected);
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
    ]);
  }

  private drawViewportTerrainFill(
    viewModel: LudusMapSceneViewModel,
    texturePatterns: LudusMapTexturePatterns,
  ): void {
    drawViewportTerrainFill(
      this.viewportTerrainFill,
      viewModel,
      this.app.screen.width,
      this.app.screen.height,
      texturePatterns.grass,
    );
  }

  private drawViewportLightingOverlay(viewModel: LudusMapSceneViewModel): void {
    drawViewportLightingOverlay(
      this.viewportLightingOverlay,
      viewModel,
      this.app.screen.width,
      this.app.screen.height,
    );
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
    const visualAlpha =
      location.ownershipStatus === 'owned'
        ? 1
        : location.ownershipStatus === 'available'
          ? 0.72
          : 0.46;

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
    display.labelDisplay.container.x = location.labelPosition.x;
    display.labelDisplay.container.y = location.labelPosition.y;
    display.labelDisplay.subtitle.visible = Boolean(location.labelSubtitle);
    display.labelDisplay.detail.visible = Boolean(location.labelDetail);
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
    display.roofSprite.alpha = visualAlpha * 0.32;
    display.fallbackFrame.visible = false;
    drawLocationFallbackFrame(display.fallbackFrame, location);
    drawLocationDetails(display.locationDetails, location);
    display.locationDetails.visible = !exteriorTexture;
    display.locationDetails.alpha = visualAlpha;
    drawLabelPlaque(display.labelDisplay, false);
  }
}
