import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/ui/shared/primitives/Tabs';

export type WaxTabletTabItem<T extends string> = {
  count?: number;
  countMax?: number;
  disabled?: boolean;
  hidden?: boolean;
  id: T;
  label: ReactNode;
};

interface WaxTabletTabsProps<T extends string> {
  ariaLabel: string;
  children?: ReactNode;
  className?: string;
  items: WaxTabletTabItem<T>[];
  listClassName?: string;
  selectedId: T;
  triggerClassName?: string;
  onSelect(id: T): void;
}

function formatTabCount(item: WaxTabletTabItem<string>) {
  if (item.count === undefined) {
    return null;
  }

  return item.countMax === undefined ? item.count : `${item.count}/${item.countMax}`;
}

export function WaxTabletTabs<T extends string>({
  ariaLabel,
  children,
  className,
  items,
  listClassName,
  onSelect,
  selectedId,
  triggerClassName,
}: WaxTabletTabsProps<T>) {
  const visibleItems = items.filter((item) => !item.hidden);

  return (
    <Tabs
      className={className}
      value={selectedId}
      onValueChange={(nextId) => onSelect(nextId as T)}
    >
      <TabsList aria-label={ariaLabel} className={listClassName}>
        {visibleItems.map((item) => {
          const count = formatTabCount(item);
          const isSelected = selectedId === item.id;

          return (
            <TabsTrigger
              aria-selected={isSelected}
              className={cn(isSelected && 'is-selected', triggerClassName)}
              disabled={item.disabled}
              key={item.id}
              value={item.id}
            >
              <span>{item.label}</span>
              {count === null ? null : <strong>{count}</strong>}
            </TabsTrigger>
          );
        })}
      </TabsList>
      {children}
    </Tabs>
  );
}
