import { forwardRef, type InputHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    className={cn(
      'flex min-h-11 w-full rounded-md border border-[color:var(--input)] bg-[rgba(255,248,226,0.92)] px-3 py-2 text-sm text-[var(--text)]',
      'placeholder:text-[color:var(--text-muted)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgba(214,163,74,0.44)] disabled:cursor-not-allowed disabled:opacity-60',
      className,
    )}
    data-slot="input"
    ref={ref}
    {...props}
  />
));

Input.displayName = 'Input';
