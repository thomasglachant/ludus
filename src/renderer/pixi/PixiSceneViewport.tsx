import { type ReactNode, useRef } from 'react';
import { PixiApplicationHost } from './PixiApplicationHost';

interface PixiSceneViewportProps {
  children: ReactNode;
  className?: string;
  sceneLabel: string;
}

export function PixiSceneViewport({ children, className, sceneLabel }: PixiSceneViewportProps) {
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
      <PixiApplicationHost resizeTo={viewportRef}>{children}</PixiApplicationHost>
    </div>
  );
}
