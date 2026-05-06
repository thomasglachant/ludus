import './tooltip.css';
import type { ReactNode } from 'react';
import {
  Tooltip as PrimitiveTooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/ui/shared/primitives/Tooltip';

interface TooltipProps {
  asChild?: boolean;
  children: ReactNode;
  content: ReactNode;
}

export function Tooltip({ asChild = false, children, content }: TooltipProps) {
  const accessibleLabel = typeof content === 'string' ? content : undefined;
  const trigger = asChild ? (
    children
  ) : (
    <span
      aria-label={accessibleLabel}
      className="tooltip"
      tabIndex={0}
      onMouseDown={(event) => event.preventDefault()}
    >
      {children}
    </span>
  );

  return (
    <PrimitiveTooltip>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent>{content}</TooltipContent>
    </PrimitiveTooltip>
  );
}
