import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { GameCard } from '@/ui/shared/ludus/GameCard';

interface ShellWidgetPanelProps extends HTMLAttributes<HTMLElement> {
  as?: 'article' | 'aside' | 'div' | 'nav' | 'section';
  children: ReactNode;
}

export function ShellWidgetPanel({
  as: Component = 'section',
  children,
  className,
  ...props
}: ShellWidgetPanelProps) {
  return (
    <GameCard
      as={Component}
      className={cn('shell-widget-panel', className)}
      surface="dark"
      {...props}
    >
      {children}
    </GameCard>
  );
}
