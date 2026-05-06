import './ludus-controls.css';
import { forwardRef } from 'react';

import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from './Button';

export interface IconButtonProps extends Omit<ButtonProps, 'aria-label' | 'children' | 'size'> {
  'aria-label': string;
  children?: ButtonProps['children'];
  size?: Extract<ButtonProps['size'], 'icon' | 'sm' | 'md'>;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size = 'icon', variant = 'ghost', ...props }, ref) => (
    <Button
      className={cn('icon-button', className)}
      ref={ref}
      size={size}
      variant={variant}
      {...props}
    />
  ),
);

IconButton.displayName = 'IconButton';
