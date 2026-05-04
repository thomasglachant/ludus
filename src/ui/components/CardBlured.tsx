import type { HTMLAttributes, ReactNode } from 'react';
import { GamePanel } from '../game/GamePanel';

interface CardBluredProps extends HTMLAttributes<HTMLElement> {
  as?: 'article' | 'aside' | 'div' | 'section';
  children: ReactNode;
}

export function CardBlured({
  as: Component = 'section',
  children,
  className,
  ...props
}: CardBluredProps) {
  return (
    <GamePanel
      as={Component}
      className={['card-blured', className].filter(Boolean).join(' ')}
      surface="glass"
      {...props}
    >
      {children}
    </GamePanel>
  );
}
