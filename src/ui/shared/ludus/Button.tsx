import './ludus-controls.css';
import { Slot } from '@radix-ui/react-slot';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { GameIcon, type GameIconName } from '@/ui/shared/icons/GameIcon';
import { RiLoaderLine } from '@remixicon/react';

export type ButtonDensity = 'compact' | 'normal' | 'roomy';
export type ButtonSize = 'icon' | 'lg' | 'md' | 'sm';
export type ButtonVariant = 'danger' | 'ghost' | 'primary' | 'quiet' | 'secondary';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  density?: ButtonDensity;
  icon?: ReactNode;
  iconName?: GameIconName;
  loading?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      asChild = false,
      children,
      className,
      density = 'normal',
      disabled,
      icon,
      iconName,
      loading = false,
      size = 'md',
      type = 'button',
      variant = 'secondary',
      ...props
    },
    ref,
  ) => {
    const Component = asChild ? Slot : 'button';
    const leadingIcon = loading ? (
      <RiLoaderLine aria-hidden="true" className="button__spinner" />
    ) : (
      (icon ?? (iconName ? <GameIcon name={iconName} size={17} /> : null))
    );

    return (
      <Component
        className={cn(
          'button',
          `button--${variant}`,
          `button--${size}`,
          `button--density-${density}`,
          className,
        )}
        data-slot="button"
        disabled={disabled || loading}
        ref={ref}
        type={asChild ? undefined : type}
        {...props}
      >
        {leadingIcon}
        {children}
      </Component>
    );
  },
);

Button.displayName = 'Button';
