import { useRef, type ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '../primitives/Tabs';

export type WaxTabletTabItem<T extends string> = {
  count?: number;
  countMax?: number;
  id: T;
  label: ReactNode;
};

interface WaxTabletTabsProps<T extends string> {
  ariaLabel: string;
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
  className,
  items,
  listClassName,
  onSelect,
  selectedId,
  triggerClassName,
}: WaxTabletTabsProps<T>) {
  const radixSelectionRef = useRef<T | null>(null);

  const selectFromRadix = (nextValue: string) => {
    const nextId = nextValue as T;

    radixSelectionRef.current = nextId;
    window.setTimeout(() => {
      if (radixSelectionRef.current === nextId) {
        radixSelectionRef.current = null;
      }
    }, 0);
    onSelect(nextId);
  };

  return (
    <Tabs className={className} value={selectedId} onValueChange={selectFromRadix}>
      <TabsList aria-label={ariaLabel} className={listClassName}>
        {items.map((item) => {
          const count = formatTabCount(item);
          const isSelected = selectedId === item.id;

          return (
            <TabsTrigger
              aria-selected={isSelected}
              className={cn(isSelected && 'is-selected', triggerClassName)}
              key={item.id}
              value={item.id}
              onClick={() => {
                if (radixSelectionRef.current === item.id) {
                  radixSelectionRef.current = null;
                  return;
                }

                onSelect(item.id);
              }}
            >
              <span>{item.label}</span>
              {count === null ? null : <strong>{count}</strong>}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
