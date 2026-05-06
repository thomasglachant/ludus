import './ludus-controls.css';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type ActionBarAlign = 'between' | 'center' | 'end' | 'start';
export type ActionBarStackBelow = 'md' | 'sm';

export interface ActionBarProps {
  align?: ActionBarAlign;
  children: ReactNode;
  className?: string;
  stackBelow?: ActionBarStackBelow;
}

export function ActionBar({
  align = 'end',
  children,
  className,
  stackBelow = 'sm',
}: ActionBarProps) {
  return (
    <div
      className={cn(
        'action-bar',
        `action-bar--${align}`,
        `action-bar--stack-${stackBelow}`,
        className,
      )}
      data-slot="action-bar"
    >
      {children}
    </div>
  );
}
