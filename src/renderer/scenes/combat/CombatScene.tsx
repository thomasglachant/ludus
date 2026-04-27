import { extend, useTick } from '@pixi/react';
import { Assets, Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CombatSceneCombatantViewModel, CombatSceneViewModel } from './CombatSceneViewModel';

extend({ Container, Graphics, Sprite, Text });

interface CombatSceneProps {
  viewModel: CombatSceneViewModel;
}

interface CombatFighterSpriteProps {
  combatant: CombatSceneCombatantViewModel;
  isAttacking: boolean;
  reducedMotion: boolean;
  texturesByPath: Record<string, Texture>;
}

function CombatFighterSprite({
  combatant,
  isAttacking,
  reducedMotion,
  texturesByPath,
}: CombatFighterSpriteProps) {
  const containerRef = useRef<Container | null>(null);
  const spriteRef = useRef<Sprite | null>(null);
  const frames =
    isAttacking && combatant.attackFrames.length > 0
      ? combatant.attackFrames
      : combatant.idleFrames;
  const fallbackTexture = frames[0] ? texturesByPath[frames[0]] : undefined;
  const baseX = combatant.side === 'left' ? 330 : 630;
  const direction = combatant.side === 'left' ? 1 : -1;

  useTick(() => {
    const container = containerRef.current;
    const sprite = spriteRef.current;

    if (!container) {
      return;
    }

    const now = performance.now();
    const attackOffset = isAttacking && !reducedMotion ? Math.sin(now / 90) * 22 * direction : 0;
    const idleLift = reducedMotion ? 0 : Math.sin(now / 420) * 4;

    container.x = baseX + attackOffset;
    container.y = 315 + idleLift;
    container.zIndex = container.y;

    if (sprite && frames.length > 0) {
      const frameIndex = reducedMotion
        ? 0
        : Math.floor(now / (isAttacking ? 140 : 360)) % frames.length;
      const texture = texturesByPath[frames[frameIndex]];

      if (texture) {
        sprite.texture = texture;
      }
    }
  });

  return (
    <pixiContainer ref={containerRef}>
      <pixiGraphics
        draw={(graphics) => {
          graphics.clear();
          graphics.setFillStyle({ color: 0x1d1410, alpha: 0.32 });
          graphics.ellipse(0, 18, 70, 18);
          graphics.fill();
        }}
      />
      {fallbackTexture ? (
        <pixiSprite
          anchor={{ x: 0.5, y: 1 }}
          height={180}
          ref={spriteRef}
          scale={{ x: direction, y: 1 }}
          texture={fallbackTexture}
          width={120}
        />
      ) : (
        <pixiGraphics
          draw={(graphics) => {
            graphics.clear();
            graphics.setFillStyle({ color: combatant.side === 'left' ? 0x2f5f7f : 0x8f2f24 });
            graphics.circle(0, -70, 42);
            graphics.fill();
          }}
        />
      )}
      <pixiGraphics
        draw={(graphics) => {
          graphics.clear();
          graphics.setFillStyle({ color: 0x2b1b14, alpha: 0.88 });
          graphics.roundRect(-76, -206, 152, 18, 4);
          graphics.fill();
          graphics.setFillStyle({ color: combatant.healthRatio > 0.35 ? 0xb8d65a : 0xd6654f });
          graphics.roundRect(-72, -202, 144 * combatant.healthRatio, 10, 3);
          graphics.fill();
        }}
      />
      <pixiText
        anchor={0.5}
        resolution={2}
        style={{
          fill: '#f5deb0',
          fontFamily: 'serif',
          fontSize: 20,
          fontWeight: '700',
          stroke: { color: '#2f2117', width: 3 },
        }}
        text={combatant.name}
        y={42}
      />
    </pixiContainer>
  );
}

export function CombatScene({ viewModel }: CombatSceneProps) {
  const [texturesByPath, setTexturesByPath] = useState<Record<string, Texture>>({});
  const assetPaths = useMemo(
    () =>
      Array.from(
        new Set([
          viewModel.backgroundPath,
          ...viewModel.left.idleFrames,
          ...viewModel.left.attackFrames,
          ...viewModel.right.idleFrames,
          ...viewModel.right.attackFrames,
        ]),
      ),
    [viewModel],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadTextures() {
      const loadedEntries = await Promise.all(
        assetPaths.map(
          async (assetPath) => [assetPath, await Assets.load<Texture>(assetPath)] as const,
        ),
      );

      if (isMounted) {
        setTexturesByPath(Object.fromEntries(loadedEntries));
      }
    }

    void loadTextures();

    return () => {
      isMounted = false;
    };
  }, [assetPaths]);

  const drawArena = useCallback((graphics: Graphics) => {
    graphics.clear();
    graphics.setFillStyle({ color: 0xb9894e });
    graphics.rect(0, 0, 960, 480);
    graphics.fill();
    graphics.setFillStyle({ color: 0x6f2d24, alpha: 0.86 });
    graphics.rect(0, 0, 960, 116);
    graphics.fill();
    graphics.setFillStyle({ color: 0xe0b15e, alpha: 0.28 });
    graphics.ellipse(480, 336, 380, 96);
    graphics.fill();
  }, []);

  return (
    <pixiContainer label={viewModel.currentActionId ?? 'combat-scene'} sortableChildren>
      {texturesByPath[viewModel.backgroundPath] ? (
        <pixiSprite height={480} texture={texturesByPath[viewModel.backgroundPath]} width={960} />
      ) : (
        <pixiGraphics draw={drawArena} />
      )}
      <pixiGraphics draw={drawArena} alpha={texturesByPath[viewModel.backgroundPath] ? 0.32 : 1} />
      <CombatFighterSprite
        combatant={viewModel.left}
        isAttacking={viewModel.latestAttackerId === viewModel.left.id}
        reducedMotion={viewModel.reducedMotion}
        texturesByPath={texturesByPath}
      />
      <CombatFighterSprite
        combatant={viewModel.right}
        isAttacking={viewModel.latestAttackerId === viewModel.right.id}
        reducedMotion={viewModel.reducedMotion}
        texturesByPath={texturesByPath}
      />
    </pixiContainer>
  );
}
