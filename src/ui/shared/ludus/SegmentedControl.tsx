import './ludus-controls.css';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { ToggleGroup, ToggleGroupItem } from '@/ui/shared/primitives/ToggleGroup';

export interface SegmentedControlItem<Value extends string> {
  disabled?: boolean;
  label: ReactNode;
  testId?: string;
  value: Value;
}

export interface SegmentedControlProps<Value extends string> {
  ariaLabel: string;
  className?: string;
  items: SegmentedControlItem<Value>[];
  value: Value;
  onValueChange(value: Value): void;
}

export function SegmentedControl<Value extends string>({
  ariaLabel,
  className,
  items,
  value,
  onValueChange,
}: SegmentedControlProps<Value>) {
  return (
    <ToggleGroup
      aria-label={ariaLabel}
      className={cn('segmented-control', className)}
      type="single"
      value={value}
      onValueChange={(nextValue) => {
        if (nextValue) {
          onValueChange(nextValue as Value);
        }
      }}
    >
      {items.map((item) => (
        <ToggleGroupItem
          aria-pressed={item.value === value}
          className={item.value === value ? 'is-selected' : undefined}
          data-testid={item.testId}
          disabled={item.disabled}
          key={item.value}
          value={item.value}
        >
          {item.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
