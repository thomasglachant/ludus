import { AnimatedSprite, Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import type { CombatScreenViewModel } from '../../../ui/combat/combat-screen-view-model';
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
import { createCombatSceneViewModel } from './createCombatSceneViewModel';
import type { CombatSceneCombatantViewModel, CombatSceneViewModel } from './CombatSceneViewModel';

type CombatLayerId =
  | 'background'
  | 'crowd'
  | 'tribune'
  | 'sand'
  | 'fighters'
  | 'effects'
  | 'vignette';

interface CombatSceneOptions {
  dodgeLabel?: string;
  fighterScale?: number;
  reducedMotion?: boolean;
  showBackdrop?: boolean;
}

interface CombatFighterDisplay {
  animationSignature?: string;
  combatant: CombatSceneCombatantViewModel;
  container: Container;
  fallback: Graphics;
  shadow: Graphics;
  sprite: AnimatedSprite;
}

interface CombatPoint {
  x: number;
  y: number;
}

const COMBAT_LAYER_IDS = [
  'background',
  'crowd',
  'tribune',
  'sand',
  'fighters',
  'effects',
  'vignette',
] as const satisfies readonly CombatLayerId[];
const ARENA_WIDTH = 960;
const ARENA_HEIGHT = 480;
const ACTION_DURATION_MS = 620;
const DUST_DURATION_MS = 760;
const FLOATING_HEALTH_DURATION_MS = 920;
const FIGHTER_BASE_SCALE = 2;
const FIGHTER_GROUND_Y = 388;
const FIGHTER_POSITIONS = {
  left: { x: 338, y: FIGHTER_GROUND_Y },
  right: { x: 622, y: FIGHTER_GROUND_Y },
} as const satisfies Record<'left' | 'right', CombatPoint>;
const ASSET_SIGNATURE_SEPARATOR = '\u0000';

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function getFacingDirection(side: 'left' | 'right') {
  return side === 'left' ? 1 : -1;
}

function collectCombatTextureAssetPaths(
  viewModel: CombatSceneViewModel,
  showBackdrop: boolean,
): string[] {
  return Array.from(
    new Set([
      ...(showBackdrop ? [viewModel.backgroundPath, viewModel.crowdPath] : []),
      ...(viewModel.left.spritesheetAtlasPath ? [] : viewModel.left.fallbackFramePaths),
      ...(viewModel.right.spritesheetAtlasPath ? [] : viewModel.right.fallbackFramePaths),
    ]),
  );
}

function collectCombatSpritesheetAssetPaths(viewModel: CombatSceneViewModel): string[] {
  return Array.from(
    new Set(
      [viewModel.left.spritesheetAtlasPath, viewModel.right.spritesheetAtlasPath].filter(
        (assetPath): assetPath is string => Boolean(assetPath),
      ),
    ),
  );
}

function createAssetSignature(viewModel: CombatSceneViewModel, showBackdrop: boolean): string {
  return [
    ...collectCombatTextureAssetPaths(viewModel, showBackdrop),
    ...collectCombatSpritesheetAssetPaths(viewModel),
  ].join(ASSET_SIGNATURE_SEPARATOR);
}

function drawArenaFallback(graphics: Graphics): void {
  graphics.clear();
  graphics.setFillStyle({ color: 0x4c3224 });
  graphics.rect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
  graphics.fill();
  graphics.setFillStyle({ color: 0x7b4932, alpha: 0.62 });
  graphics.rect(0, 0, ARENA_WIDTH, 190);
  graphics.fill();
  graphics.setFillStyle({ color: 0xd8a25a, alpha: 0.64 });
  graphics.rect(0, 190, ARENA_WIDTH, ARENA_HEIGHT - 190);
  graphics.fill();
}

function drawCrowdFallback(graphics: Graphics): void {
  graphics.clear();
  graphics.setFillStyle({ color: 0x271914, alpha: 0.64 });
  graphics.rect(0, 0, ARENA_WIDTH, 158);
  graphics.fill();

  for (let y = 18; y < 136; y += 18) {
    for (let x = 18; x < ARENA_WIDTH; x += 26) {
      const offset = (x + y) % 3;
      const color = offset === 0 ? 0xf0c16f : offset === 1 ? 0xa63c32 : 0xe5d0a1;

      graphics.setFillStyle({ color, alpha: 0.34 });
      graphics.rect(x, y, 8, 6);
      graphics.fill();
    }
  }
}

function drawTribune(graphics: Graphics): void {
  graphics.clear();
  graphics.setFillStyle({ color: 0x241710, alpha: 0.24 });
  graphics.rect(0, 152, ARENA_WIDTH, 18);
  graphics.fill();
  graphics.setFillStyle({ color: 0x8a6140, alpha: 0.2 });
  graphics.rect(0, 172, ARENA_WIDTH, 8);
  graphics.fill();
  graphics.rect(0, 204, ARENA_WIDTH, 10);
  graphics.fill();
  graphics.setFillStyle({ color: 0xd2a35b, alpha: 0.18 });
  graphics.rect(390, 126, 180, 10);
  graphics.fill();
  graphics.setFillStyle({ color: 0x241710, alpha: 0.14 });

  for (let x = 28; x < ARENA_WIDTH; x += 76) {
    graphics.rect(x, 150, 10, 58);
    graphics.fill();
  }
}

function drawSandFloor(graphics: Graphics): void {
  graphics.clear();
  graphics.setFillStyle({ color: 0xe0ad61, alpha: 0.54 });
  graphics.rect(0, 214, ARENA_WIDTH, ARENA_HEIGHT - 214);
  graphics.fill();
  graphics.setFillStyle({ color: 0xf2ca7a, alpha: 0.3 });
  graphics.ellipse(ARENA_WIDTH / 2, 362, 382, 94);
  graphics.fill();
  graphics.setStrokeStyle({ color: 0x8b5c35, width: 2, alpha: 0.18 });

  for (let y = 272; y < 450; y += 28) {
    graphics.moveTo(120, y);
    graphics.lineTo(ARENA_WIDTH - 120, y + 10);
  }

  graphics.stroke();
  graphics.setStrokeStyle({ color: 0xf8dda2, width: 1, alpha: 0.22 });

  for (let x = 124; x < ARENA_WIDTH - 100; x += 86) {
    graphics.moveTo(x, 236);
    graphics.lineTo(x - 56, 454);
  }

  graphics.stroke();
}

function drawVignette(graphics: Graphics): void {
  graphics.clear();
  graphics.setFillStyle({ color: 0x120c08, alpha: 0.16 });
  graphics.rect(0, 0, ARENA_WIDTH, 32);
  graphics.fill();
  graphics.rect(0, ARENA_HEIGHT - 44, ARENA_WIDTH, 44);
  graphics.fill();
  graphics.setFillStyle({ color: 0x120c08, alpha: 0.22 });
  graphics.rect(0, 0, 42, ARENA_HEIGHT);
  graphics.fill();
  graphics.rect(ARENA_WIDTH - 42, 0, 42, ARENA_HEIGHT);
  graphics.fill();
}

function drawFighterFallback(graphics: Graphics, combatant: CombatSceneCombatantViewModel): void {
  const color = combatant.side === 'left' ? 0x375f82 : 0x924535;

  graphics.clear();
  graphics.setFillStyle({ color: 0x221711, alpha: 0.36 });
  graphics.ellipse(0, 0, 54, 16);
  graphics.fill();
  graphics.setFillStyle({ color });
  graphics.roundRect(-36, -138, 72, 104, 12);
  graphics.fill();
  graphics.setFillStyle({ color: 0xd8b17a });
  graphics.circle(0, -154, 25);
  graphics.fill();
}

function drawFighterShadow(graphics: Graphics, intensity: number): void {
  graphics.clear();
  graphics.setFillStyle({ color: 0x17100c, alpha: 0.26 + intensity * 0.1 });
  graphics.ellipse(0, 2, 76 + intensity * 10, 20 + intensity * 3);
  graphics.fill();
}

function createFloatingHealthText(): Text {
  const label = new Text({
    text: '',
    style: {
      align: 'center',
      dropShadow: {
        alpha: 0.68,
        angle: Math.PI / 2,
        blur: 1,
        color: '#1a0c08',
        distance: 3,
      },
      fill: '#ff4a3d',
      fontFamily: 'serif',
      fontSize: 34,
      fontWeight: '900',
      stroke: { color: '#2b110c', width: 5 },
    },
  });

  label.anchor.set(0.5);
  label.eventMode = 'none';
  label.resolution = 2;
  label.roundPixels = true;
  label.visible = false;

  return label;
}

function createFloatingDodgeText(): Text {
  const label = new Text({
    text: '',
    style: {
      align: 'center',
      dropShadow: {
        alpha: 0.7,
        angle: Math.PI / 2,
        blur: 1,
        color: '#081521',
        distance: 3,
      },
      fill: '#66c7ff',
      fontFamily: 'serif',
      fontSize: 30,
      fontWeight: '900',
      stroke: { color: '#102c44', width: 5 },
    },
  });

  label.anchor.set(0.5);
  label.eventMode = 'none';
  label.resolution = 2;
  label.roundPixels = true;
  label.visible = false;

  return label;
}

function formatFloatingHealthDelta(healthDelta: number): string {
  const roundedDelta = Math.round(healthDelta);

  return `${roundedDelta > 0 ? '+' : ''}${roundedDelta}`;
}

function getFloatingHealthFill(healthDelta: number): string {
  return healthDelta >= 0 ? '#68ef7c' : '#ff4a3d';
}

function getFloatingHealthAlpha(progress: number): number {
  if (progress < 0.12) {
    return clamp(progress / 0.12, 0, 1);
  }

  return 1 - clamp((progress - 0.72) / 0.28, 0, 1);
}

function drawSlash(graphics: Graphics, attackerSide: 'left' | 'right', progress: number): void {
  const defender = FIGHTER_POSITIONS[attackerSide === 'left' ? 'right' : 'left'];
  const direction = getFacingDirection(attackerSide);
  const alpha = 1 - progress * 0.72;
  const centerX = defender.x - direction * (46 - progress * 18);
  const centerY = defender.y - 122;

  graphics.setStrokeStyle({ color: 0xffe4a6, width: 12, alpha, cap: 'round' });
  graphics.moveTo(centerX - direction * 48, centerY - 46);
  graphics.lineTo(centerX + direction * 42, centerY + 34);
  graphics.stroke();
  graphics.setStrokeStyle({ color: 0xffffff, width: 4, alpha: alpha * 0.72, cap: 'round' });
  graphics.moveTo(centerX - direction * 38, centerY - 34);
  graphics.lineTo(centerX + direction * 34, centerY + 24);
  graphics.stroke();
}

function drawImpactBurst(
  graphics: Graphics,
  defenderSide: 'left' | 'right',
  progress: number,
): void {
  const defender = FIGHTER_POSITIONS[defenderSide];
  const direction = getFacingDirection(defenderSide);
  const alpha = 1 - progress * 0.82;
  const centerX = defender.x + direction * 34;
  const centerY = defender.y - 118;
  const radius = 18 + progress * 24;

  graphics.setFillStyle({ color: 0xfff0be, alpha: alpha * 0.82 });
  graphics.circle(centerX, centerY, radius * 0.42);
  graphics.fill();
  graphics.setStrokeStyle({ color: 0xffcc66, width: 5, alpha, cap: 'round' });

  for (let index = 0; index < 8; index += 1) {
    const angle = (Math.PI * 2 * index) / 8;
    const innerRadius = radius * 0.38;
    const outerRadius = radius;

    graphics.moveTo(
      centerX + Math.cos(angle) * innerRadius,
      centerY + Math.sin(angle) * innerRadius,
    );
    graphics.lineTo(
      centerX + Math.cos(angle) * outerRadius,
      centerY + Math.sin(angle) * outerRadius,
    );
  }

  graphics.stroke();
}

function drawBlockedHit(
  graphics: Graphics,
  defenderSide: 'left' | 'right',
  progress: number,
): void {
  const defender = FIGHTER_POSITIONS[defenderSide];
  const direction = getFacingDirection(defenderSide);
  const alpha = 1 - progress * 0.74;
  const centerX = defender.x + direction * 44;
  const centerY = defender.y - 122;

  graphics.setStrokeStyle({ color: 0xb9d1df, width: 6, alpha, cap: 'round' });
  graphics.moveTo(centerX - direction * 26, centerY - 30);
  graphics.lineTo(centerX + direction * 26, centerY + 30);
  graphics.stroke();
  graphics.moveTo(centerX - direction * 28, centerY + 26);
  graphics.lineTo(centerX + direction * 28, centerY - 26);
  graphics.stroke();
}

function drawDust(graphics: Graphics, side: 'left' | 'right', progress: number): void {
  const position = FIGHTER_POSITIONS[side];
  const direction = getFacingDirection(side);
  const alpha = 0.34 * (1 - progress);

  for (let index = 0; index < 14; index += 1) {
    const wave = ((index * 37) % 100) / 100;
    const drift = progress * (34 + wave * 48);
    const x = position.x - direction * (20 + drift) + (wave - 0.5) * 28;
    const y = position.y + 2 + Math.sin((progress + wave) * Math.PI) * 12;
    const radius = 3 + wave * 5 + progress * 4;

    graphics.setFillStyle({ color: 0xf0c87a, alpha: alpha * (0.55 + wave * 0.45) });
    graphics.circle(x, y, radius);
    graphics.fill();
  }
}

export class CombatScene implements PixiScene<CombatScreenViewModel> {
  readonly root = new Container();

  private readonly app: PixiSceneContext['app'];
  private readonly assetLoader: PixiAssetLoader;
  private readonly backgroundFallback = new Graphics({ roundPixels: true });
  private readonly backgroundSprite = configurePixelArtSprite(new Sprite(Texture.EMPTY));
  private readonly crowdFallback = new Graphics({ roundPixels: true });
  private readonly crowdSprite = configurePixelArtSprite(new Sprite(Texture.EMPTY));
  private readonly debugOverlay: PixiVisualDebugOverlay | null;
  private readonly dodgeLabel: string;
  private readonly dustGraphics = new Graphics({ roundPixels: true });
  private readonly effectGraphics = new Graphics({ roundPixels: true });
  private readonly fighterScale: number;
  private readonly fighters = new Map<string, CombatFighterDisplay>();
  private readonly floatingDodgeText = createFloatingDodgeText();
  private readonly floatingHealthText = createFloatingHealthText();
  private readonly layers = createRenderLayerSetup(COMBAT_LAYER_IDS, {
    fighters: { sortableChildren: true },
  });
  private readonly reducedMotion: boolean;
  private readonly sandGraphics = new Graphics({ roundPixels: true });
  private readonly showBackdrop: boolean;
  private readonly tribuneGraphics = new Graphics({ roundPixels: true });
  private readonly vignetteGraphics = new Graphics({ roundPixels: true });
  private actionSignature?: string;
  private actionStartedAt = performance.now();
  private assetLoadId = 0;
  private assetSignature?: string;
  private isDestroyed = false;
  private sceneViewModel: CombatSceneViewModel | null = null;
  private spritesheets: PixiSpritesheetMap = new Map();
  private textures: PixiTextureMap = new Map();

  constructor(context: PixiSceneContext, options: CombatSceneOptions = {}) {
    this.app = context.app;
    this.assetLoader = context.assetLoader;
    this.debugOverlay = context.debugMode ? new PixiVisualDebugOverlay() : null;
    this.dodgeLabel = options.dodgeLabel ?? 'Dodge';
    this.fighterScale = options.fighterScale ?? FIGHTER_BASE_SCALE;
    this.reducedMotion = options.reducedMotion ?? false;
    this.showBackdrop = options.showBackdrop ?? true;
    this.root.label = 'combat-scene';
    this.root.addChild(this.layers.root);
    this.layers.layers.background.addChild(this.backgroundFallback, this.backgroundSprite);
    this.layers.layers.crowd.addChild(this.crowdSprite, this.crowdFallback);
    this.layers.layers.tribune.addChild(this.tribuneGraphics);
    this.layers.layers.sand.addChild(this.sandGraphics);
    this.layers.layers.effects.addChild(
      this.dustGraphics,
      this.effectGraphics,
      this.floatingHealthText,
      this.floatingDodgeText,
    );
    this.layers.layers.vignette.addChild(this.vignetteGraphics);

    if (this.debugOverlay) {
      this.layers.root.addChild(this.debugOverlay.root);
    }
  }

  destroy(): void {
    this.isDestroyed = true;
    this.debugOverlay?.destroy();
    this.fighters.clear();
    destroyDisplayObject(this.root);
  }

  tick(): void {
    if (!this.sceneViewModel) {
      return;
    }

    const now = performance.now();

    this.layoutScene();
    this.updateCrowd(now, this.sceneViewModel.reducedMotion);
    this.updateEffects(this.sceneViewModel, now);

    for (const fighter of this.fighters.values()) {
      this.updateFighterAnimation(fighter, now);
    }

    this.updateDebugOverlay();
  }

  update(viewModel: CombatScreenViewModel): void {
    const sceneViewModel = createCombatSceneViewModel(viewModel, {
      dodgeLabel: this.dodgeLabel,
      reducedMotion: this.reducedMotion,
    });
    const nextActionSignature = [
      sceneViewModel.currentActionId ?? 'ready',
      sceneViewModel.effect?.id ?? 'no-effect',
    ].join(':');

    if (nextActionSignature !== this.actionSignature) {
      this.actionSignature = nextActionSignature;
      this.actionStartedAt = performance.now();
    }

    this.sceneViewModel = sceneViewModel;
    this.root.label = sceneViewModel.currentActionId ?? 'combat-scene';
    this.layoutScene();
    this.reconcile(sceneViewModel);
    this.loadAssetsIfNeeded(sceneViewModel);
  }

  private createFighter(combatant: CombatSceneCombatantViewModel): CombatFighterDisplay {
    const container = new Container();
    const shadow = new Graphics({ roundPixels: true });
    const sprite = configurePixelArtSprite(new AnimatedSprite([Texture.EMPTY], false));
    const fallback = new Graphics({ roundPixels: true });

    container.label = combatant.id;
    sprite.anchor.set(combatant.animation.anchor.x, combatant.animation.anchor.y);
    drawFighterShadow(shadow, 0);
    container.addChild(shadow, sprite, fallback);
    this.layers.layers.fighters.addChild(container);

    return {
      combatant,
      container,
      fallback,
      shadow,
      sprite,
    };
  }

  private getActionProgress(now: number, duration: number): number {
    if (this.reducedMotion) {
      return 0.58;
    }

    return clamp((now - this.actionStartedAt) / duration, 0, 1);
  }

  private getFighterAnimationTextures(combatant: CombatSceneCombatantViewModel): Texture[] {
    const spritesheet = combatant.spritesheetAtlasPath
      ? this.spritesheets.get(combatant.spritesheetAtlasPath)
      : undefined;
    const spritesheetTextures =
      spritesheet && combatant.frameNames.length > 0
        ? combatant.frameNames.flatMap((frameName) => {
            const texture = spritesheet.textures[frameName];

            return texture ? [texture] : [];
          })
        : [];

    if (spritesheetTextures.length > 0) {
      return spritesheetTextures;
    }

    return combatant.fallbackFramePaths.flatMap((framePath) => {
      const texture = this.textures.get(framePath);

      return texture ? [texture] : [];
    });
  }

  private async loadAssets(viewModel: CombatSceneViewModel): Promise<void> {
    const loadId = ++this.assetLoadId;
    const [textures, spritesheets] = await Promise.all([
      this.assetLoader.loadTextures(collectCombatTextureAssetPaths(viewModel, this.showBackdrop)),
      this.assetLoader.loadSpritesheets(collectCombatSpritesheetAssetPaths(viewModel)),
    ]);

    if (this.isDestroyed || loadId !== this.assetLoadId) {
      return;
    }

    this.textures = textures;
    this.spritesheets = spritesheets;

    if (this.sceneViewModel) {
      this.reconcile(this.sceneViewModel);
    }
  }

  private loadAssetsIfNeeded(viewModel: CombatSceneViewModel): void {
    const nextAssetSignature = createAssetSignature(viewModel, this.showBackdrop);

    if (nextAssetSignature === this.assetSignature) {
      return;
    }

    this.assetSignature = nextAssetSignature;
    void this.loadAssets(viewModel);
  }

  private layoutScene(): void {
    const width = this.app.screen.width;
    const height = this.app.screen.height;

    if (width <= 0 || height <= 0) {
      return;
    }

    const scale = Math.max(width / ARENA_WIDTH, height / ARENA_HEIGHT);

    this.layers.root.scale.set(scale);
    this.layers.root.position.set(
      (width - ARENA_WIDTH * scale) / 2,
      (height - ARENA_HEIGHT * scale) / 2,
    );
  }

  private reconcile(viewModel: CombatSceneViewModel): void {
    if (this.showBackdrop) {
      const backgroundTexture = this.textures.get(viewModel.backgroundPath);
      const crowdTexture = this.textures.get(viewModel.crowdPath);

      this.backgroundSprite.visible = Boolean(backgroundTexture);
      this.backgroundSprite.texture = backgroundTexture ?? Texture.EMPTY;
      setPixelArtSpriteSize(this.backgroundSprite, ARENA_WIDTH, ARENA_HEIGHT);
      this.backgroundFallback.alpha = backgroundTexture ? 0.22 : 1;
      drawArenaFallback(this.backgroundFallback);

      this.crowdSprite.visible = Boolean(crowdTexture);
      this.crowdSprite.texture = crowdTexture ?? Texture.EMPTY;
      setPixelArtSpriteSize(this.crowdSprite, ARENA_WIDTH, 160);
      this.crowdFallback.visible = !crowdTexture;
      drawCrowdFallback(this.crowdFallback);
      drawTribune(this.tribuneGraphics);
      drawSandFloor(this.sandGraphics);
      drawVignette(this.vignetteGraphics);
    } else {
      this.backgroundSprite.visible = false;
      this.backgroundSprite.texture = Texture.EMPTY;
      this.backgroundFallback.clear();
      this.crowdSprite.visible = false;
      this.crowdSprite.texture = Texture.EMPTY;
      this.crowdFallback.clear();
      this.tribuneGraphics.clear();
      this.sandGraphics.clear();
      this.vignetteGraphics.clear();
    }

    const activeCombatants = [viewModel.left, viewModel.right];
    const activeIds = new Set(activeCombatants.map((combatant) => combatant.id));

    for (const [combatantId, fighter] of this.fighters) {
      if (!activeIds.has(combatantId)) {
        destroyDisplayObject(fighter.container);
        this.fighters.delete(combatantId);
      }
    }

    for (const combatant of activeCombatants) {
      const fighter = this.fighters.get(combatant.id) ?? this.createFighter(combatant);

      this.fighters.set(combatant.id, fighter);
      this.updateFighterDisplay(fighter, combatant, viewModel.reducedMotion);
    }

    this.updateEffects(viewModel, performance.now());
    this.updateDebugOverlay();
  }

  private updateCrowd(now: number, reducedMotion: boolean): void {
    if (!this.showBackdrop) {
      return;
    }

    if (reducedMotion) {
      this.crowdSprite.alpha = 0.78;
      this.crowdFallback.alpha = 0.78;
      this.crowdSprite.x = 0;
      return;
    }

    const shimmer = 0.76 + Math.sin(now / 420) * 0.05;

    this.crowdSprite.alpha = shimmer;
    this.crowdFallback.alpha = shimmer;
    this.crowdSprite.x = Math.sin(now / 1100) * 1.5;
  }

  private updateEffects(viewModel: CombatSceneViewModel, now: number): void {
    this.effectGraphics.clear();
    this.dustGraphics.clear();
    this.floatingDodgeText.visible = false;
    this.floatingHealthText.visible = false;

    if (!viewModel.effect) {
      return;
    }

    const actionProgress = this.getActionProgress(now, ACTION_DURATION_MS);
    const dustProgress = this.getActionProgress(now, DUST_DURATION_MS);
    const floatingHealthProgress = this.getActionProgress(now, FLOATING_HEALTH_DURATION_MS);

    if (actionProgress < 1 || viewModel.reducedMotion) {
      drawSlash(this.effectGraphics, viewModel.effect.attackerSide, actionProgress);

      if (viewModel.effect.didHit) {
        drawImpactBurst(this.effectGraphics, viewModel.effect.defenderSide, actionProgress);
      } else {
        drawBlockedHit(this.effectGraphics, viewModel.effect.defenderSide, actionProgress);
      }
    }

    if (!viewModel.reducedMotion && dustProgress < 1) {
      drawDust(this.dustGraphics, viewModel.effect.attackerSide, dustProgress);
    }

    this.updateFloatingHealthText(viewModel.effect, floatingHealthProgress);
    this.updateFloatingDodgeText(viewModel.effect, floatingHealthProgress);
  }

  private updateFloatingHealthText(
    effect: NonNullable<CombatSceneViewModel['effect']>,
    progress: number,
  ): void {
    const healthDelta = Math.round(effect.healthDelta);

    if (healthDelta === 0 || (!this.reducedMotion && progress >= 1)) {
      return;
    }

    const defender = FIGHTER_POSITIONS[effect.defenderSide];
    const direction = getFacingDirection(effect.defenderSide);
    const lift = this.reducedMotion ? 34 : progress * 58;
    const wobble = this.reducedMotion ? 0 : Math.sin(progress * Math.PI * 2) * 7;
    const popScale = this.reducedMotion ? 1.05 : 0.84 + Math.sin(progress * Math.PI) * 0.34;

    this.floatingHealthText.text = formatFloatingHealthDelta(healthDelta);
    this.floatingHealthText.style.fill = getFloatingHealthFill(healthDelta);
    this.floatingHealthText.x = defender.x + direction * 8 + wobble;
    this.floatingHealthText.y = defender.y - 218 - lift;
    this.floatingHealthText.alpha = this.reducedMotion ? 1 : getFloatingHealthAlpha(progress);
    this.floatingHealthText.scale.set(popScale);
    this.floatingHealthText.visible = true;
  }

  private updateFloatingDodgeText(
    effect: NonNullable<CombatSceneViewModel['effect']>,
    progress: number,
  ): void {
    if (!effect.dodgeLabel || (!this.reducedMotion && progress >= 1)) {
      return;
    }

    const defender = FIGHTER_POSITIONS[effect.defenderSide];
    const direction = getFacingDirection(effect.defenderSide);
    const lift = this.reducedMotion ? 28 : progress * 52;
    const drift = this.reducedMotion ? 0 : Math.sin(progress * Math.PI) * 18 * direction;
    const popScale = this.reducedMotion ? 1.04 : 0.82 + Math.sin(progress * Math.PI) * 0.28;

    this.floatingDodgeText.text = effect.dodgeLabel.toUpperCase();
    this.floatingDodgeText.x = defender.x - direction * 18 + drift;
    this.floatingDodgeText.y = defender.y - 210 - lift;
    this.floatingDodgeText.alpha = this.reducedMotion ? 1 : getFloatingHealthAlpha(progress);
    this.floatingDodgeText.scale.set(popScale);
    this.floatingDodgeText.visible = true;
  }

  private updateFighterAnimation(fighter: CombatFighterDisplay, now: number): void {
    const combatant = fighter.combatant;
    const basePosition = FIGHTER_POSITIONS[combatant.side];
    const direction = getFacingDirection(combatant.side);
    const actionProgress = this.getActionProgress(now, ACTION_DURATION_MS);
    const actionEnvelope = actionProgress >= 1 ? 0 : Math.sin(actionProgress * Math.PI);
    const idleLift = this.reducedMotion ? 0 : Math.sin(now / 460) * 3;
    const attackOffset =
      combatant.animationId === 'attack' && !this.reducedMotion
        ? actionEnvelope * 48 * direction
        : 0;
    const hitOffset =
      combatant.animationId === 'hit' && !this.reducedMotion ? actionEnvelope * -20 * direction : 0;
    const blockOffset =
      combatant.animationId === 'block' && !this.reducedMotion
        ? actionEnvelope * -10 * direction
        : 0;

    fighter.container.x = basePosition.x + attackOffset + hitOffset + blockOffset;
    fighter.container.y = basePosition.y + idleLift;
    fighter.container.zIndex = fighter.container.y + combatant.animation.ySortOffset;
    fighter.sprite.scale.set(this.fighterScale * direction, this.fighterScale);
    drawFighterShadow(fighter.shadow, actionEnvelope);

    if (!this.reducedMotion && fighter.sprite.visible) {
      fighter.sprite.update(this.app.ticker);
    }
  }

  private updateFighterDisplay(
    fighter: CombatFighterDisplay,
    combatant: CombatSceneCombatantViewModel,
    reducedMotion: boolean,
  ): void {
    fighter.combatant = combatant;
    drawFighterFallback(fighter.fallback, combatant);
    this.updateFighterSprite(fighter, reducedMotion);
    this.updateFighterAnimation(fighter, performance.now());
  }

  private updateFighterSprite(fighter: CombatFighterDisplay, reducedMotion: boolean): void {
    const { animation } = fighter.combatant;
    const textures = this.getFighterAnimationTextures(fighter.combatant);
    const animationSignature = [
      fighter.combatant.animationRevision,
      fighter.combatant.animationId,
      fighter.combatant.spritesheetAtlasPath ?? 'fallback',
      fighter.combatant.frameNames.join('|'),
      fighter.combatant.fallbackFramePaths.join('|'),
    ].join(':');

    fighter.sprite.visible = textures.length > 0;
    fighter.fallback.visible = textures.length === 0;

    if (textures.length === 0) {
      return;
    }

    fighter.sprite.anchor.set(animation.anchor.x, animation.anchor.y);
    fighter.sprite.loop = animation.loop && !reducedMotion;
    fighter.sprite.animationSpeed = reducedMotion ? 0 : animation.fps / 60;

    if (fighter.animationSignature !== animationSignature) {
      fighter.animationSignature = animationSignature;
      fighter.sprite.textures = textures;

      if (reducedMotion || textures.length === 1) {
        fighter.sprite.gotoAndStop(0);
      } else {
        fighter.sprite.gotoAndPlay(0);
      }
    }

    if (reducedMotion || textures.length === 1) {
      fighter.sprite.gotoAndStop(0);
      return;
    }

    if (animation.loop && !fighter.sprite.playing) {
      fighter.sprite.play();
    }
  }

  private updateDebugOverlay(): void {
    if (!this.debugOverlay) {
      return;
    }

    this.debugOverlay.draw([
      this.createSceneSpriteDebugMetric('arena:background', this.backgroundSprite, 0, 0),
      this.createSceneSpriteDebugMetric('arena:crowd', this.crowdSprite, 0, 0),
      ...Array.from(this.fighters.values()).map((fighter) =>
        this.createFighterDebugMetric(fighter),
      ),
    ]);
  }

  private createSceneSpriteDebugMetric(
    label: string,
    sprite: Sprite,
    x: number,
    y: number,
  ): PixiVisualDebugMetric {
    return {
      label,
      x,
      y,
      width: Math.abs(sprite.width),
      height: Math.abs(sprite.height),
      nativeWidth: sprite.texture === Texture.EMPTY ? undefined : sprite.texture.width,
      nativeHeight: sprite.texture === Texture.EMPTY ? undefined : sprite.texture.height,
      scaleX: sprite.texture === Texture.EMPTY ? undefined : sprite.scale.x,
      scaleY: sprite.texture === Texture.EMPTY ? undefined : sprite.scale.y,
      anchor: { x: sprite.anchor.x, y: sprite.anchor.y },
      anchorPosition: {
        x: x + Math.abs(sprite.width) * sprite.anchor.x,
        y: y + Math.abs(sprite.height) * sprite.anchor.y,
      },
      color: 0x86e7ff,
    };
  }

  private createFighterDebugMetric(fighter: CombatFighterDisplay): PixiVisualDebugMetric {
    const { animation } = fighter.combatant;
    const { sprite } = fighter;
    const width = Math.abs(sprite.width);
    const height = Math.abs(sprite.height);
    const originX = fighter.container.x + sprite.x;
    const originY = fighter.container.y + sprite.y;

    return {
      label: `fighter:${fighter.combatant.id}`,
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
        x: fighter.container.x + animation.hitbox.x * Math.abs(sprite.scale.x),
        y: fighter.container.y + animation.hitbox.y * Math.abs(sprite.scale.y),
        width: animation.hitbox.width * Math.abs(sprite.scale.x),
        height: animation.hitbox.height * Math.abs(sprite.scale.y),
      },
      color: 0xf8e56b,
    };
  }
}
