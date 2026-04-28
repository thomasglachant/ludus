import { Container, Particle, ParticleContainer, Texture, type Ticker } from 'pixi.js';
import type { PixiTextureMap } from '../../pixi/PixiAssetLoader';
import { destroyDisplayObject } from '../../pixi/destroy';
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
  private readonly ticker: Ticker;
  private lastUpdateAt = 0;
  private reducedMotion = false;

  constructor(options: ParticleEffectSystemOptions) {
    void options.layer;
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
    void textures;
    this.reducedMotion = viewModel.reducedMotion;

    if (this.groups.size > 0) {
      for (const group of this.groups.values()) {
        destroyDisplayObject(group.container);
      }

      this.groups.clear();
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
}
