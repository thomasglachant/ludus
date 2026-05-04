import { Slot } from '@radix-ui/react-slot';
import { LoaderCircle } from 'lucide-react';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { GameIcon, type GameIconName } from '../icons/GameIcon';

export type RomanButtonDensity = 'compact' | 'normal' | 'roomy';
export type RomanButtonSize = 'icon' | 'lg' | 'md' | 'sm';
export type RomanButtonTone = 'danger' | 'ghost' | 'primary' | 'secondary';

export interface RomanButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  amountClassName?: string;
  amountMoney?: ReactNode;
  asChild?: boolean;
  density?: RomanButtonDensity;
  icon?: ReactNode;
  iconName?: GameIconName;
  loading?: boolean;
  moneyIconName?: GameIconName;
  size?: RomanButtonSize;
  tone?: RomanButtonTone;
}

const toneClasses: Record<RomanButtonTone, string> = {
  danger:
    'border-[color:var(--danger)] bg-[var(--danger)] text-[#fff6dc] hover:brightness-105 focus-visible:outline-[rgba(181,58,47,0.36)]',
  ghost:
    'border-[rgba(111,69,35,0.18)] bg-transparent text-[var(--text)] shadow-none hover:border-[rgba(111,69,35,0.42)] hover:bg-[rgba(180,122,51,0.12)] focus-visible:outline-[rgba(214,163,74,0.44)]',
  primary:
    'border-[color-mix(in_srgb,var(--red-primary-strong),#1d130e_18%)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--red-primary),#f0dfb8_12%),var(--red-primary)),var(--red-primary)] text-[#fff6dc] focus-visible:outline-[rgba(214,163,74,0.44)]',
  secondary:
    'border-[rgba(111,69,35,0.56)] bg-[linear-gradient(180deg,rgba(255,246,222,0.98),rgba(224,196,135,0.98)),var(--parchment)] text-[#34251a] hover:border-[color:var(--gold)] hover:bg-[linear-gradient(180deg,rgba(255,248,226,1),rgba(234,204,142,1)),var(--parchment-light)] focus-visible:outline-[rgba(214,163,74,0.44)]',
};

const sizeClasses: Record<RomanButtonSize, string> = {
  icon: 'size-10 p-0',
  lg: 'min-h-11 px-5 py-2.5',
  md: 'min-h-[42px] px-4 py-2',
  sm: 'min-h-9 px-3 py-1.5 text-sm',
};

const densityClasses: Record<RomanButtonDensity, string> = {
  compact: 'gap-1.5',
  normal: 'gap-2',
  roomy: 'gap-3',
};

export const RomanButton = forwardRef<HTMLButtonElement, RomanButtonProps>(
  (
    {
      amountClassName = 'roman-button__amount',
      amountMoney,
      asChild = false,
      children,
      className,
      density = 'normal',
      disabled,
      icon,
      iconName,
      loading = false,
      moneyIconName = 'treasury',
      size = 'md',
      tone = 'secondary',
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const Component = asChild ? Slot : 'button';
    const leadingIcon = loading ? (
      <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
    ) : (
      (icon ?? (iconName ? <GameIcon name={iconName} size={17} /> : null))
    );

    return (
      <Component
        className={cn(
          'inline-flex min-w-0 items-center justify-center rounded-md border text-center font-black tracking-normal shadow-[var(--ludus-shadow-raised)] transition-[background,border-color,box-shadow,filter,color]',
          'disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-3 focus-visible:outline-offset-2',
          toneClasses[tone],
          sizeClasses[size],
          densityClasses[density],
          className,
        )}
        data-slot="roman-button"
        disabled={disabled || loading}
        ref={ref}
        type={asChild ? undefined : type}
        {...props}
      >
        {leadingIcon}
        {children}
        {amountMoney === undefined ? null : (
          <span className={amountClassName}>
            <span>(</span>
            <strong>{amountMoney}</strong>
            <GameIcon name={moneyIconName} size={15} />
            <span>)</span>
          </span>
        )}
      </Component>
    );
  },
);

RomanButton.displayName = 'RomanButton';
