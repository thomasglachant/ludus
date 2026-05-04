/* eslint-disable react-refresh/only-export-components */
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-bold',
    'transition-[background,border-color,box-shadow,filter,color] disabled:pointer-events-none',
    'disabled:opacity-60 focus-visible:outline-3 focus-visible:outline-offset-2',
  ],
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    variants: {
      size: {
        default: 'min-h-10 px-4 py-2',
        icon: 'size-10',
        lg: 'min-h-11 px-5 py-2.5',
        sm: 'min-h-9 px-3 py-1.5',
      },
      variant: {
        default:
          'border border-[color:var(--border)] bg-[var(--surface)] text-[var(--text)] focus-visible:outline-[rgba(214,163,74,0.44)]',
        destructive:
          'border border-[color:var(--danger)] bg-[var(--danger)] text-white focus-visible:outline-[rgba(181,58,47,0.36)]',
        ghost:
          'border border-transparent bg-transparent text-[var(--text)] hover:border-[rgba(111,69,35,0.32)] hover:bg-[rgba(180,122,51,0.12)] focus-visible:outline-[rgba(214,163,74,0.44)]',
        outline:
          'border border-[rgba(111,69,35,0.56)] bg-transparent text-[var(--text)] focus-visible:outline-[rgba(214,163,74,0.44)]',
        secondary:
          'border border-[color:var(--border)] bg-[var(--surface-muted)] text-[var(--text)] focus-visible:outline-[rgba(214,163,74,0.44)]',
      },
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild = false, className, size, type = 'button', variant, ...props }, ref) => {
    const Component = asChild ? Slot : 'button';

    return (
      <Component
        className={cn(buttonVariants({ className, size, variant }))}
        data-slot="button"
        ref={ref}
        type={asChild ? undefined : type}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';
