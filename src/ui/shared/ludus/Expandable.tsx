import './ludus-components.css';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';

import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/ui/shared/primitives/Collapsible';

export const Expandable = Collapsible;
export const ExpandableTrigger = CollapsibleTrigger;

export const ExpandableContent = forwardRef<
  ElementRef<typeof CollapsibleContent>,
  ComponentPropsWithoutRef<typeof CollapsibleContent>
>(({ className, ...props }, ref) => (
  <CollapsibleContent className={cn('expandable-content', className)} ref={ref} {...props} />
));

ExpandableContent.displayName = 'ExpandableContent';
