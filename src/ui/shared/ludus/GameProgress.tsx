import './ludus-components.css';
import type { CSSProperties } from 'react';

import { cn } from '@/lib/utils';
import { Progress, ProgressIndicator } from '@/ui/shared/primitives/Progress';

interface GameProgressProps {
  className?: string;
  indicatorClassName?: string;
  label: string;
  max?: number;
  value: number;
}

export function GameProgress({
  className,
  indicatorClassName,
  label,
  max = 100,
  value,
}: GameProgressProps) {
  const boundedValue = Math.min(max, Math.max(0, value));
  const percent = max <= 0 ? 0 : (boundedValue / max) * 100;
  const style = {
    '--game-progress-percent': `${percent}%`,
  } as CSSProperties;

  return (
    <Progress
      aria-label={label}
      className={cn('game-progress', className)}
      max={max}
      style={style}
      value={boundedValue}
    >
      <ProgressIndicator className={cn('game-progress__indicator', indicatorClassName)} />
    </Progress>
  );
}
