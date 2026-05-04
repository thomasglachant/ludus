import type { ReactNode } from 'react';
import {
  Tooltip as PrimitiveTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../primitives/Tooltip';

interface TooltipProps {
  children: ReactNode;
  content: string;
}

export function Tooltip({ children, content }: TooltipProps) {
  return (
    <TooltipProvider delayDuration={150}>
      <PrimitiveTooltip>
        <TooltipTrigger asChild>
          <span
            aria-label={content}
            className="tooltip"
            data-tooltip={content}
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
