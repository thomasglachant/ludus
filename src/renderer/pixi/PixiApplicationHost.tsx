import { Application } from '@pixi/react';
import type { ReactNode, RefObject } from 'react';
import type { Application as PixiApplication } from 'pixi.js';

interface PixiApplicationHostProps {
  children: ReactNode;
  className?: string;
  maxFps?: number;
  resizeTo?: RefObject<HTMLElement | null>;
  onInit?: (app: PixiApplication) => void;
}

export function PixiApplicationHost({
  children,
  className,
  maxFps = 20,
  resizeTo,
  onInit,
}: PixiApplicationHostProps) {
  if (import.meta.env.MODE === 'test') {
    return <div className={className} data-testid="pixi-test-host" />;
  }

  return (
    <Application
      autoStart
      autoDensity
      antialias={false}
      backgroundAlpha={0}
      className={className}
      powerPreference="low-power"
      preference="webgl"
      resizeTo={resizeTo}
      resolution={1}
      onInit={(app) => {
        app.ticker.maxFPS = maxFps;
        onInit?.(app);
      }}
    >
      {children}
    </Application>
  );
}
