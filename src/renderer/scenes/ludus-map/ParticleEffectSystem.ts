import { Container, Particle, ParticleContainer, Texture, type Ticker } from 'pixi.js';
import type { PixiTextureMap } from '../../pixi/PixiAssetLoader';
import { destroyDisplayObject } from '../../pixi/destroy';
import { getPixelArtScaleForSize } from '../../pixi/pixel-perfect';
import type {
  LudusMapSceneAmbientElementViewModel,
  LudusMapSceneViewModel,
} from './LudusMapSceneViewModel';

interface ParticleEffectSystemOptions {
  layer: Container;
  ticker: Ticker;
}

interface CrowdParticleDisplay {
  baseX: number;
  baseY: number;
  element: LudusMapSceneAmbientElementViewModel;
  particle: Particle;
}

interface CrowdParticleGroup {
  assetPath: string;
  container: ParticleContainer<Particle>;
  particles: Map<string, CrowdParticleDisplay>;
  texture: Texture;
}

const CROWD_UPDATE_MILLISECONDS = 180;

function getCycle(elapsedSeconds: number, durationSeconds: number): number {
  const duration = Math.max(durationSeconds, 0.1);
  const cycle = (elapsedSeconds % duration) / duration;

  return cycle < 0 ? cycle + 1 : cycle;
}

export class ParticleEffectSystem {
  private readonly groups = new Map<string, CrowdParticleGroup>();
  private readonly layer: Container;
  private readonly ticker: Ticker;
  private lastUpdateAt = 0;
  private reducedMotion = false;

  constructor(options: ParticleEffectSystemOptions) {
    this.layer = options.layer;
    this.ticker = options.ticker;
    this.ticker.add(this.handleTick);
  }

  destroy(): void {
    this.ticker.remove(this.handleTick);

    for (const group of this.groups.values()) {
      destroyDisplayObject(group.container);
    }

    this.groups.clear();
  }

  reconcile(viewModel: LudusMapSceneViewModel, textures: PixiTextureMap): void {
    this.reducedMotion = viewModel.reducedMotion;

    const crowdElements = viewModel.ambientElements.filter((element) => element.kind === 'crowd');
    const activeAssetPaths = new Set(crowdElements.map((element) => element.assetPath));

    for (const [assetPath, group] of this.groups) {
      if (!activeAssetPaths.has(assetPath)) {
        destroyDisplayObject(group.container);
        this.groups.delete(assetPath);
      }
    }

    for (const assetPath of activeAssetPaths) {
      const texture = textures.get(assetPath);

      if (!texture) {
        continue;
      }

      const group = this.groups.get(assetPath) ?? this.createGroup(assetPath, texture);
      const elements = crowdElements.filter((element) => element.assetPath === assetPath);

      this.groups.set(assetPath, group);
      this.reconcileGroup(group, elements);
    }
  }

  private readonly handleTick = (): void => {
    const now = performance.now();

    if (now - this.lastUpdateAt < CROWD_UPDATE_MILLISECONDS) {
      return;
    }

    this.lastUpdateAt = now;

    for (const group of this.groups.values()) {
      this.updateGroup(group, now);
    }
  };

  private createGroup(assetPath: string, texture: Texture): CrowdParticleGroup {
    const container = new ParticleContainer<Particle>({
      dynamicProperties: {
        color: true,
        position: true,
      },
      roundPixels: true,
      texture,
    });

    container.eventMode = 'none';
    container.label = `crowd-particles:${assetPath}`;
    this.layer.addChild(container);

    return {
      assetPath,
      container,
      particles: new Map(),
      texture,
    };
  }

  private reconcileGroup(
    group: CrowdParticleGroup,
    elements: LudusMapSceneAmbientElementViewModel[],
  ): void {
    const activeIds = new Set(elements.map((element) => element.id));

    for (const [elementId, display] of group.particles) {
      if (!activeIds.has(elementId)) {
        group.container.removeParticle(display.particle);
        group.particles.delete(elementId);
      }
    }

    for (const element of elements) {
      let display = group.particles.get(element.id);

      if (!display) {
        const particle = new Particle({
          anchorX: 0.5,
          anchorY: 0.5,
          texture: group.texture,
        });

        group.container.addParticle(particle);
        display = {
          baseX: 0,
          baseY: 0,
          element,
          particle,
        };
        group.particles.set(element.id, display);
      }

      display.element = element;
      this.updateParticleBase(display, group.texture);
    }

    group.container.update();
  }

  private updateGroup(group: CrowdParticleGroup, now: number): void {
    for (const display of group.particles.values()) {
      const { element, particle } = display;

      if (this.reducedMotion) {
        particle.x = display.baseX;
        particle.y = display.baseY;
        particle.alpha = element.opacity * 0.7;
        continue;
      }

      const elapsedSeconds = now / 1000 + element.animationDelaySeconds;
      const cycle = getCycle(elapsedSeconds, element.animationDurationSeconds);
      const wave = Math.sin(cycle * Math.PI * 2);

      particle.x = display.baseX + wave * 1.5;
      particle.y = display.baseY + Math.abs(wave) * 2;
      particle.alpha = element.opacity * (0.66 + Math.abs(wave) * 0.34);
    }
  }

  private updateParticleBase(display: CrowdParticleDisplay, texture: Texture): void {
    const { element, particle } = display;
    const textureWidth = Math.max(texture.width, 1);
    const textureHeight = Math.max(texture.height, 1);
    const scale = getPixelArtScaleForSize(
      textureWidth,
      textureHeight,
      element.width,
      element.height,
      {
        preferIntegerScale: true,
      },
    );

    display.baseX = element.x + element.width / 2;
    display.baseY = element.y + element.height / 2;
    particle.x = display.baseX;
    particle.y = display.baseY;
    particle.scaleX = scale.scaleX;
    particle.scaleY = scale.scaleY;
    particle.rotation = (element.rotation * Math.PI) / 180;
    particle.alpha = this.reducedMotion ? element.opacity * 0.7 : element.opacity;
    particle.tint = 0xffffff;
  }
}
