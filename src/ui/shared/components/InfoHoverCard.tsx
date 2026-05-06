import './tooltip.css';
import type { ReactNode } from 'react';

import {
  HoverCard,
  HoverCardArrow,
  HoverCardContent,
  HoverCardPortal,
  HoverCardTrigger,
} from '@/ui/shared/primitives/HoverCard';

interface InfoHoverCardProps {
  children: ReactNode;
  title?: ReactNode;
  trigger: ReactNode;
}

export function InfoHoverCard({ children, title, trigger }: InfoHoverCardProps) {
  return (
    <HoverCard closeDelay={80} openDelay={120}>
      <HoverCardTrigger asChild>{trigger}</HoverCardTrigger>
      <HoverCardPortal>
        <HoverCardContent align="end" className="info-hover-card__content" sideOffset={8}>
          {title ? <strong className="info-hover-card__title">{title}</strong> : null}
          {children}
          <HoverCardArrow className="info-hover-card__arrow" />
        </HoverCardContent>
      </HoverCardPortal>
    </HoverCard>
  );
}
