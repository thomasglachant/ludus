import type { ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  content: string;
}

export function Tooltip({ children, content }: TooltipProps) {
  return (
    <span aria-label={content} className="tooltip" data-tooltip={content} tabIndex={0}>
      {children}
    </span>
  );
}
