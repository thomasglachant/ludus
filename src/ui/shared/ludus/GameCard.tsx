import './game-card.css';
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type GameCardSurface = 'dark' | 'light';
export type GameCardLayout = 'frame' | 'stack';
export type GameCardBodyPadding = 'none' | 'compact' | 'normal' | 'roomy';

interface GameCardProps extends HTMLAttributes<HTMLElement> {
  as?: 'article' | 'aside' | 'div' | 'nav' | 'section';
  children: ReactNode;
  layout?: GameCardLayout;
  surface?: GameCardSurface;
}

interface GameCardHeaderProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

interface GameCardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: GameCardBodyPadding;
  scrollable?: boolean;
}

interface GameScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function GameCard({
  as: Component = 'section',
  children,
  className,
  layout = 'stack',
  surface = 'dark',
  ...props
}: GameCardProps) {
  return (
    <Component
      className={cn('game-card', `game-card--${surface}`, `game-card--${layout}`, className)}
      data-slot="game-card"
      {...props}
    >
      {children}
    </Component>
  );
}

export function GameCardHeader({ children, className, ...props }: GameCardHeaderProps) {
  return (
    <header className={cn('game-card__header', className)} data-slot="game-card-header" {...props}>
      {children}
    </header>
  );
}

export const GameCardBody = forwardRef<HTMLDivElement, GameCardBodyProps>(
  ({ children, className, padding = 'normal', scrollable = true, ...props }, ref) => (
    <div
      className={cn(
        'game-card__body',
        `game-card__body--padding-${padding}`,
        scrollable ? 'game-scroll-area' : 'game-card__body--static',
        className,
      )}
      data-slot="game-card-body"
      ref={ref}
      {...props}
    >
      {children}
    </div>
  ),
);

GameCardBody.displayName = 'GameCardBody';

export const GameScrollArea = forwardRef<HTMLDivElement, GameScrollAreaProps>(
  ({ children, className, ...props }, ref) => (
    <div
      className={cn('game-scroll-area', className)}
      data-slot="game-scroll-area"
      ref={ref}
      {...props}
    >
      {children}
    </div>
  ),
);

GameScrollArea.displayName = 'GameScrollArea';
