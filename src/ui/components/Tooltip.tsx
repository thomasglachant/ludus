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
  label?: string;
}

export function Tooltip({ children, content, label }: TooltipProps) {
  const resolvedLabel = label ?? (typeof content === 'string' ? content : undefined);

  return (
    <TooltipProvider delayDuration={150}>
      <PrimitiveTooltip>
        <TooltipTrigger asChild>
          <span
            aria-label={resolvedLabel}
            className="tooltip"
            data-tooltip={resolvedLabel}
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
