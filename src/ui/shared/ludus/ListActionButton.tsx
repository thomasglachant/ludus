import './ludus-controls.css';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import type { GameIconName } from '@/ui/shared/icons/GameIcon';
import { GameIcon } from '@/ui/shared/icons/GameIcon';
import { Button, type ButtonProps } from './Button';
import { PrimaryActionButton } from './PrimaryActionButton';

export interface ListActionButtonProps extends Omit<ButtonProps, 'variant'> {
  amountMoney?: ReactNode;
  iconName?: GameIconName;
  variant?: 'danger' | 'primary' | 'quiet' | 'secondary';
}

export function ListActionButton({
  amountMoney,
  children,
  className,
  icon,
  iconName,
  variant = 'secondary',
  ...props
}: ListActionButtonProps) {
  const content = (
    <>
      {icon ?? (iconName ? <GameIcon name={iconName} size={17} /> : null)}
      {children}
    </>
  );

  if (variant === 'primary') {
    return (
      <PrimaryActionButton
        amountMoney={amountMoney}
        className={cn('list-action-button', className)}
        size="sm"
        {...props}
      >
        {content}
      </PrimaryActionButton>
    );
  }

  return (
    <Button className={cn('list-action-button', className)} size="sm" variant={variant} {...props}>
      {content}
    </Button>
  );
}
