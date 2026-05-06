import './ludus-controls.css';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import type { GameIconName } from '@/ui/shared/icons/GameIcon';
import { GameIcon } from '@/ui/shared/icons/GameIcon';
import { Button, type ButtonProps } from './Button';

export interface PrimaryActionButtonProps extends Omit<ButtonProps, 'variant'> {
  amountMoney?: ReactNode;
  moneyIconName?: GameIconName;
}

export function PrimaryActionButton({
  amountMoney,
  children,
  className,
  moneyIconName = 'treasury',
  ...props
}: PrimaryActionButtonProps) {
  return (
    <Button className={cn('primary-action-button', className)} variant="primary" {...props}>
      {children}
      {amountMoney === undefined ? null : (
        <span className="primary-action-button__amount">
          <span>(</span>
          <strong>{amountMoney}</strong>
          <GameIcon name={moneyIconName} size={15} />
          <span>)</span>
        </span>
      )}
    </Button>
  );
}
