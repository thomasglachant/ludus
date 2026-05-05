import type { ReactNode } from 'react';
import {
  Tooltip as PrimitiveTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../primitives/Tooltip';

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
}

export function Tooltip({ children, content }: TooltipProps) {
  const accessibleLabel = typeof content === 'string' ? content : undefined;

  return (
    <TooltipProvider delayDuration={100}>
      <PrimitiveTooltip>
        <TooltipTrigger asChild>
          <span
            aria-label={accessibleLabel}
            className="tooltip"
            tabIndex={0}
            onMouseDown={(event) => event.preventDefault()}
          >
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent>{content}</TooltipContent>
      </PrimitiveTooltip>
    </TooltipProvider>
  );
}
