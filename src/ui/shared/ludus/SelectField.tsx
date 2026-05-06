import './ludus-controls.css';
import type { ReactNode } from 'react';

import { GameIcon } from '@/ui/shared/icons/GameIcon';
import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from '@/ui/shared/primitives/Select';

const EMPTY_VALUE = '__select_field_empty_value__';

export interface SelectFieldOption<Value extends string> {
  disabled?: boolean;
  label: ReactNode;
  value: Value;
}

interface SelectFieldProps<Value extends string> {
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
  options: SelectFieldOption<Value>[];
  placeholder?: ReactNode;
  value: Value;
  onValueChange(value: Value): void;
}

function toRadixValue(value: string) {
  return value === '' ? EMPTY_VALUE : value;
}

function fromRadixValue<Value extends string>(value: string) {
  return (value === EMPTY_VALUE ? '' : value) as Value;
}

export function SelectField<Value extends string>({
  ariaLabel,
  className,
  disabled,
  onValueChange,
  options,
  placeholder,
  value,
}: SelectFieldProps<Value>) {
  const handleValueChange = (nextValue: string) => {
    onValueChange(fromRadixValue<Value>(nextValue));
  };

  return (
    <Select disabled={disabled} value={toRadixValue(value)} onValueChange={handleValueChange}>
      <SelectTrigger aria-label={ariaLabel} className={className ?? 'select-field'}>
        <SelectValue placeholder={placeholder} />
        <SelectIcon className="select-field__icon">
          <GameIcon name="arrowRight" size={15} />
        </SelectIcon>
      </SelectTrigger>
      <SelectPortal>
        <SelectContent className="select-field__content" position="popper" sideOffset={6}>
          <SelectViewport className="select-field__viewport">
            {options.map((option) => (
              <SelectItem
                className="select-field__item"
                disabled={option.disabled}
                key={option.value || EMPTY_VALUE}
                value={toRadixValue(option.value)}
              >
                <SelectItemText>{option.label}</SelectItemText>
                <SelectItemIndicator className="select-field__item-indicator">
                  <GameIcon name="check" size={14} />
                </SelectItemIndicator>
              </SelectItem>
            ))}
          </SelectViewport>
        </SelectContent>
      </SelectPortal>
    </Select>
  );
}
