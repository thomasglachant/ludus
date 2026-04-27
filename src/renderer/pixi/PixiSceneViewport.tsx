import { useRef } from 'react';
import { PixiApplicationHost } from './PixiApplicationHost';
import type { PixiScene, PixiSceneContext } from './PixiScene';

interface PixiSceneViewportProps<TSnapshot> {
  className?: string;
  createScene: (context: PixiSceneContext) => PixiScene<TSnapshot>;
  debugMode?: boolean;
  sceneKey?: string | number;
  sceneLabel: string;
  snapshot: TSnapshot;
}

export function PixiSceneViewport<TSnapshot>({
  className,
  createScene,
  debugMode = false,
  sceneKey,
  sceneLabel,
  snapshot,
}: PixiSceneViewportProps<TSnapshot>) {
  const viewportRef = useRef<HTMLDivElement | null>(null);

  return (
    <div
      aria-label={sceneLabel}
      className={['pixi-scene-viewport', className].filter(Boolean).join(' ')}
      data-testid="pixi-scene-viewport"
      ref={viewportRef}
      role="img"
      style={{ height: '100%', minHeight: 320, width: '100%' }}
    >
      <PixiApplicationHost
        className="pixi-scene-viewport__host"
        createScene={createScene}
        debugMode={debugMode}
        resizeTo={viewportRef}
        sceneKey={sceneKey}
        snapshot={snapshot}
      />
    </div>
  );
}
