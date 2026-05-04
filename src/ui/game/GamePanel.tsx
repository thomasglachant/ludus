import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type GamePanelDensity = 'compact' | 'normal' | 'roomy';
export type GamePanelSurface = 'glass' | 'parchment' | 'stone';

interface GamePanelProps extends HTMLAttributes<HTMLElement> {
  as?: 'article' | 'aside' | 'div' | 'section';
  children: ReactNode;
  density?: GamePanelDensity;
  surface?: GamePanelSurface;
}

const surfaceClasses: Record<GamePanelSurface, string> = {
  glass:
    'border border-[rgba(214,163,74,0.16)] bg-[var(--ludus-texture-glass)] text-[#fff1c7] backdrop-blur-[10px] backdrop-saturate-[1.08]',
  parchment:
    'border border-[rgba(111,69,35,0.42)] bg-[var(--ludus-texture-parchment)] text-[var(--text)] shadow-[var(--ludus-shadow-panel)]',
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
  surface = 'parchment',
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

export function ParchmentPanel(props: Omit<GamePanelProps, 'surface'>) {
  return <GamePanel surface="parchment" {...props} />;
}

export function StonePanel(props: Omit<GamePanelProps, 'surface'>) {
  return <GamePanel surface="stone" {...props} />;
}

export function GamePanelHeader({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <header
      className={cn('flex min-w-0 items-start justify-between gap-3', className)}
      data-slot="game-panel-header"
      {...props}
    />
  );
}

export function GamePanelBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('grid min-w-0 gap-3', className)} data-slot="game-panel-body" {...props} />
  );
}

export function GamePanelFooter({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <footer
      className={cn('flex min-w-0 flex-wrap items-center justify-end gap-2', className)}
      data-slot="game-panel-footer"
      {...props}
    />
  );
}
