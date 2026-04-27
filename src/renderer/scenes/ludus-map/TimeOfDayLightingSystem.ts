import { Container, Graphics, Sprite, Texture, type Ticker } from 'pixi.js';
import { destroyDisplayObject } from '../../pixi/destroy';
import type {
  LudusMapSceneAmbientElementViewModel,
  LudusMapSceneThemeViewModel,
  LudusMapSceneViewModel,
} from './LudusMapSceneViewModel';

interface TimeOfDayLightingSystemOptions {
  brightnessTargets: Container[];
  lightLayer: Container;
  overlayLayer: Container;
  ticker: Ticker;
}

interface TorchLightDisplay {
  source: LudusMapSceneAmbientElementViewModel;
  sprite: Sprite;
}

const LIGHT_UPDATE_MILLISECONDS = 90;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function getBrightnessTint(brightness: number): number {
  const channel = clamp(Math.round(255 * brightness), 0, 255);

  return (channel << 16) | (channel << 8) | channel;
}

function getCycle(elapsedSeconds: number, durationSeconds: number): number {
  const duration = Math.max(durationSeconds, 0.1);
  const cycle = (elapsedSeconds % duration) / duration;

  return cycle < 0 ? cycle + 1 : cycle;
}

export class TimeOfDayLightingSystem {
  private readonly brightnessTargets: Container[];
  private readonly lightLayer: Container;
  private readonly lights = new Map<string, TorchLightDisplay>();
  private readonly overlay = new Graphics();
  private readonly overlayLayer: Container;
  private readonly ticker: Ticker;
  private lastLightUpdateAt = 0;
  private reducedMotion = false;
  private theme: LudusMapSceneThemeViewModel | null = null;

  constructor(options: TimeOfDayLightingSystemOptions) {
    this.brightnessTargets = options.brightnessTargets;
    this.lightLayer = options.lightLayer;
    this.overlayLayer = options.overlayLayer;
    this.ticker = options.ticker;
    this.overlay.eventMode = 'none';
    this.overlay.label = 'time-of-day-overlay';
    this.overlayLayer.addChild(this.overlay);
    this.ticker.add(this.handleTick);
  }

  destroy(): void {
    this.ticker.remove(this.handleTick);

    for (const display of this.lights.values()) {
      destroyDisplayObject(display.sprite);
    }

    this.lights.clear();
    destroyDisplayObject(this.overlay);
  }

  reconcile(viewModel: LudusMapSceneViewModel): void {
    this.theme = viewModel.theme;
    this.reducedMotion = viewModel.reducedMotion;
    this.drawOverlay(viewModel);
    this.applySpriteBrightness(viewModel.theme);
    this.reconcileTorchLights(
      viewModel.ambientElements.filter((element) => element.kind === 'torch'),
    );
    this.updateLights(performance.now());
  }

  private readonly handleTick = (): void => {
    const now = performance.now();

    if (now - this.lastLightUpdateAt < LIGHT_UPDATE_MILLISECONDS) {
      return;
    }

    this.lastLightUpdateAt = now;
    this.updateLights(now);
  };

  private applySpriteBrightness(theme: LudusMapSceneThemeViewModel): void {
    const tint = getBrightnessTint(theme.spriteBrightness);

    for (const target of this.brightnessTargets) {
      target.tint = tint;
    }
  }

  private createLight(source: LudusMapSceneAmbientElementViewModel): TorchLightDisplay {
    const sprite = new Sprite(Texture.WHITE);

    sprite.anchor.set(0.5);
    sprite.blendMode = 'add';
    sprite.eventMode = 'none';
    sprite.label = `${source.id}:glow`;
    this.lightLayer.addChild(sprite);

    return { source, sprite };
  }

  private drawOverlay(viewModel: LudusMapSceneViewModel): void {
    this.overlay.clear();
    this.overlay.setFillStyle({
      color: viewModel.theme.overlayColor,
      alpha: viewModel.theme.overlayOpacity,
    });
    this.overlay.rect(0, 0, viewModel.width, viewModel.height);
    this.overlay.fill();
  }

  private reconcileTorchLights(sources: LudusMapSceneAmbientElementViewModel[]): void {
    const activeIds = new Set(sources.map((source) => source.id));

    for (const [sourceId, display] of this.lights) {
      if (!activeIds.has(sourceId)) {
        destroyDisplayObject(display.sprite);
        this.lights.delete(sourceId);
      }
    }

    for (const source of sources) {
      const existingDisplay = this.lights.get(source.id);

      if (source.opacity <= 0) {
        if (existingDisplay) {
          destroyDisplayObject(existingDisplay.sprite);
          this.lights.delete(source.id);
        }

        continue;
      }

      const display = existingDisplay ?? this.createLight(source);

      display.source = source;
      display.sprite.tint = this.theme?.lightColor ?? 0xffc25d;
      display.sprite.x = source.x + source.width / 2;
      display.sprite.y = source.y + source.height * 0.28;
      display.sprite.width = Math.max(118, source.width * 5.2);
      display.sprite.height = Math.max(92, source.height * 2.1);
      display.sprite.zIndex = source.zIndex + 1;
      this.lights.set(source.id, display);
    }
  }

  private updateLights(now: number): void {
    const theme = this.theme;

    if (!theme) {
      return;
    }

    for (const display of this.lights.values()) {
      const { source, sprite } = display;
      const elapsedSeconds = now / 1000 + source.animationDelaySeconds;
      const cycle = getCycle(elapsedSeconds, source.animationDurationSeconds);
      const wave = Math.sin(cycle * Math.PI * 2);
      const flicker = this.reducedMotion ? 0.86 : 0.72 + Math.abs(wave) * 0.28;

      sprite.tint = theme.lightColor;
      sprite.alpha = source.opacity * 0.38 * flicker;
      sprite.visible = sprite.alpha > 0.015;
    }
  }
}
