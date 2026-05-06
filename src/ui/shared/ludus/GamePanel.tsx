import './ludus-components.css';
import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type GamePanelDensity = 'compact' | 'normal' | 'roomy';
export type GamePanelSurface = 'glass' | 'light' | 'stone';

interface GamePanelProps extends HTMLAttributes<HTMLElement> {
  as?: 'article' | 'aside' | 'div' | 'section';
  children: ReactNode;
  density?: GamePanelDensity;
  surface?: GamePanelSurface;
}

const surfaceClasses: Record<GamePanelSurface, string> = {
  glass:
    'border border-[rgba(214,163,74,0.16)] bg-[var(--ludus-texture-glass)] text-[#fff1c7] backdrop-blur-[10px] backdrop-saturate-[1.08]',
  light:
    'border border-[rgba(111,69,35,0.42)] bg-[var(--ludus-texture-light-panel)] text-[var(--text)] shadow-[var(--ludus-shadow-panel)]',
  stone:
    'border border-[rgba(214,163,74,0.28)] bg-[var(--ludus-texture-stone)] text-[#fff1c7] shadow-[var(--ludus-shadow-panel)]',
};

const densityClasses: Record<GamePanelDensity, string> = {
  compact: 'gap-2 p-3',
  normal: 'gap-3 p-4',
  roomy: 'gap-4 p-5',
};

export function GamePanel({
  as: Component = 'section',
  children,
  className,
  density = 'normal',
  surface = 'light',
  ...props
}: GamePanelProps) {
  return (
    <Component
      className={cn(
        'grid min-w-0 rounded-md',
        surfaceClasses[surface],
        densityClasses[density],
        className,
      )}
      data-slot="game-panel"
      {...props}
    >
      {children}
    </Component>
  );
}

export function LightPanel(props: Omit<GamePanelProps, 'surface'>) {
  return <GamePanel surface="light" {...props} />;
}

export function StonePanel(props: Omit<GamePanelProps, 'surface'>) {
  return <GamePanel surface="stone" {...props} />;
}
