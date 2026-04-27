import { Container, Sprite, Texture, type Ticker } from 'pixi.js';
import type { PixiTextureMap } from '../../pixi/PixiAssetLoader';
import { destroyDisplayObject } from '../../pixi/destroy';
import { configurePixelArtSprite, setPixelArtSpriteSize } from '../../pixi/pixel-perfect';
import type {
  LudusMapSceneAmbientElementViewModel,
  LudusMapSceneViewModel,
} from './LudusMapSceneViewModel';

interface AmbientAnimationSystemOptions {
  ambientLayer: Container;
  cloudLayer: Container;
  ticker: Ticker;
}

interface AmbientDisplay {
  baseScaleX: number;
  baseScaleY: number;
  element: LudusMapSceneAmbientElementViewModel;
  sprite: Sprite;
}

interface CameraParallaxState {
  scale: number;
  x: number;
  y: number;
}

const CLOUD_PARALLAX_FACTOR = 0.58;
const LOW_FREQUENCY_UPDATE_MILLISECONDS = 120;

function getCycle(elapsedSeconds: number, durationSeconds: number): number {
  const duration = Math.max(durationSeconds, 0.1);
  const cycle = (elapsedSeconds % duration) / duration;

  return cycle < 0 ? cycle + 1 : cycle;
}

function radians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function usesBottomAnchor(element: LudusMapSceneAmbientElementViewModel): boolean {
  return element.kind === 'banner' || element.kind === 'grass';
}

export class AmbientAnimationSystem {
  private readonly ambientDisplays = new Map<string, AmbientDisplay>();
  private readonly ambientLayer: Container;
  private readonly cloudDisplays = new Map<string, AmbientDisplay>();
  private readonly cloudLayer: Container;
  private readonly ticker: Ticker;
  private height = 0;
  private lastLowFrequencyUpdateAt = 0;
  private reducedMotion = false;
  private width = 0;

  constructor(options: AmbientAnimationSystemOptions) {
    this.ambientLayer = options.ambientLayer;
    this.cloudLayer = options.cloudLayer;
    this.ticker = options.ticker;
    this.cloudLayer.label = 'map-cloud-parallax-layer';
    this.ticker.add(this.handleTick);
  }

  destroy(): void {
    this.ticker.remove(this.handleTick);

    for (const display of this.cloudDisplays.values()) {
      destroyDisplayObject(display.sprite);
    }

    for (const display of this.ambientDisplays.values()) {
      destroyDisplayObject(display.sprite);
    }

    this.cloudDisplays.clear();
    this.ambientDisplays.clear();
  }

  reconcile(viewModel: LudusMapSceneViewModel, textures: PixiTextureMap): void {
    this.width = viewModel.width;
    this.height = viewModel.height;
    this.reducedMotion = viewModel.reducedMotion;
    this.reconcileLayerDisplays(
      viewModel.ambientElements.filter((element) => element.kind === 'cloud'),
      textures,
      this.cloudLayer,
      this.cloudDisplays,
    );
    this.reconcileLayerDisplays(
      viewModel.ambientElements.filter(
        (element) => element.kind !== 'cloud' && element.kind !== 'crowd',
      ),
      textures,
      this.ambientLayer,
      this.ambientDisplays,
    );
  }

  syncCamera(camera: CameraParallaxState): void {
    if (camera.scale <= 0) {
      return;
    }

    this.cloudLayer.position.set(
      -(camera.x * (1 - CLOUD_PARALLAX_FACTOR)) / camera.scale,
      -(camera.y * (1 - CLOUD_PARALLAX_FACTOR)) / camera.scale,
    );
  }

  private readonly handleTick = (): void => {
    const now = performance.now();

    for (const display of this.cloudDisplays.values()) {
      this.updateCloud(display, now);
    }

    if (now - this.lastLowFrequencyUpdateAt < LOW_FREQUENCY_UPDATE_MILLISECONDS) {
      return;
    }

    this.lastLowFrequencyUpdateAt = now;

    for (const display of this.ambientDisplays.values()) {
      this.updateLowFrequencyAmbient(display, now);
    }
  };

  private createDisplay(
    element: LudusMapSceneAmbientElementViewModel,
    texture: Texture,
    layer: Container,
  ): AmbientDisplay {
    const sprite = configurePixelArtSprite(new Sprite(texture));
    const display = { baseScaleX: 1, baseScaleY: 1, element, sprite };

    sprite.eventMode = 'none';
    sprite.label = element.id;
    layer.addChild(sprite);

    return display;
  }

  private reconcileLayerDisplays(
    elements: LudusMapSceneAmbientElementViewModel[],
    textures: PixiTextureMap,
    layer: Container,
    displays: Map<string, AmbientDisplay>,
  ): void {
    const activeIds = new Set(elements.map((element) => element.id));

    for (const [elementId, display] of displays) {
      if (!activeIds.has(elementId)) {
        destroyDisplayObject(display.sprite);
        displays.delete(elementId);
      }
    }

    for (const element of elements) {
      const texture = textures.get(element.assetPath);
      const existingDisplay = displays.get(element.id);

      if (!texture || element.opacity <= 0) {
        if (existingDisplay) {
          destroyDisplayObject(existingDisplay.sprite);
          displays.delete(element.id);
        }

        continue;
      }

      const display = existingDisplay ?? this.createDisplay(element, texture, layer);

      displays.set(element.id, display);
      display.element = element;
      display.sprite.texture = texture;
      setPixelArtSpriteSize(display.sprite, element.width, element.height, {
        preferIntegerScale: true,
      });
      display.baseScaleX = display.sprite.scale.x;
      display.baseScaleY = display.sprite.scale.y;
      display.sprite.alpha = element.opacity;
      display.sprite.zIndex = element.zIndex;
      display.sprite.rotation = radians(element.rotation);
      this.positionSprite(display);

      if (this.reducedMotion) {
        this.updateReducedMotionDisplay(display);
      }
    }
  }

  private positionSprite(display: AmbientDisplay): void {
    const { element, sprite } = display;

    if (usesBottomAnchor(element)) {
      sprite.anchor.set(0.5, 1);
      sprite.position.set(element.x + element.width / 2, element.y + element.height);
      return;
    }

    sprite.anchor.set(0, 0);
    sprite.position.set(element.x, element.y);
  }

  private updateCloud(display: AmbientDisplay, now: number): void {
    const { element, sprite } = display;

    if (this.reducedMotion) {
      sprite.position.set(element.x, element.y);
      sprite.alpha = element.opacity * 0.72;
      return;
    }

    const elapsedSeconds = now / 1000 + element.animationDelaySeconds;
    const cycle = getCycle(elapsedSeconds, element.animationDurationSeconds);
    const travelDistance = this.width - element.x + element.width + 420;

    sprite.x = element.x + cycle * travelDistance;
    sprite.y = element.y + Math.sin(cycle * Math.PI * 2) * Math.max(4, this.height * 0.004);
    sprite.alpha = element.opacity;
  }

  private updateLowFrequencyAmbient(display: AmbientDisplay, now: number): void {
    if (this.reducedMotion) {
      this.updateReducedMotionDisplay(display);
      return;
    }

    const { element, sprite } = display;
    const elapsedSeconds = now / 1000 + element.animationDelaySeconds;
    const cycle = getCycle(elapsedSeconds, element.animationDurationSeconds);
    const wave = Math.sin(cycle * Math.PI * 2);

    if (element.kind === 'smoke') {
      sprite.y = element.y - cycle * 26;
      sprite.alpha = element.opacity * (1 - cycle * 0.55);
      return;
    }

    if (element.kind === 'torch') {
      sprite.alpha = element.opacity * (0.72 + Math.abs(wave) * 0.28);
      sprite.scale.set(
        display.baseScaleX * (1 + Math.abs(wave) * 0.045),
        display.baseScaleY * (1 + Math.abs(wave) * 0.02),
      );
      return;
    }

    if (element.kind === 'banner' || element.kind === 'grass') {
      sprite.rotation = radians(element.rotation + wave * 2.5);
      sprite.y = element.y + element.height + wave * 1.5;
    }
  }

  private updateReducedMotionDisplay(display: AmbientDisplay): void {
    const { element, sprite } = display;

    sprite.scale.set(display.baseScaleX, display.baseScaleY);
    sprite.alpha = element.kind === 'smoke' ? element.opacity * 0.45 : element.opacity;
    sprite.rotation = radians(element.rotation);
    this.positionSprite(display);
  }
}
