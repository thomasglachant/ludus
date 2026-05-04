import { cva, type VariantProps } from 'class-variance-authority';
import type { ElementType, HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex min-w-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-extrabold leading-none',
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        default: 'border-[rgba(111,69,35,0.24)] bg-[rgba(255,248,226,0.54)] text-[var(--text)]',
        destructive: 'border-[color:var(--danger)] bg-[#f9dfdc] text-[#7d231c]',
        outline: 'border-[rgba(214,163,74,0.36)] bg-transparent text-[#fff1c7]',
        secondary: 'border-[rgba(214,163,74,0.16)] bg-[rgba(255,241,199,0.08)] text-[#fff1c7]',
        success: 'border-[rgba(47,110,70,0.44)] bg-[rgba(47,110,70,0.14)] text-[#1f5a39]',
        warning: 'border-[color:var(--energy-ochre)] bg-[#fff1c7] text-[#6b4a05]',
      },
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLElement>, VariantProps<typeof badgeVariants> {
  as?: ElementType;
  disabled?: boolean;
  type?: 'button' | 'reset' | 'submit';
}

export function Badge({ as: Component = 'span', className, variant, ...props }: BadgeProps) {
  return (
    <Component className={cn(badgeVariants({ className, variant }))} data-slot="badge" {...props} />
  );
}
