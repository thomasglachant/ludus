import type { ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  className?: string;
  content: string;
}

export function Tooltip({ children, className, content }: TooltipProps) {
  return (
    <span
      aria-label={content}
      className={['tooltip', className].filter(Boolean).join(' ')}
      data-tooltip={content}
      tabIndex={0}
    >
      {children}
    </span>
  );
}
