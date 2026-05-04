import { Slot } from '@radix-ui/react-slot';
import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { GameIcon, type GameIconName } from '../icons/GameIcon';
import { Badge } from '../primitives/Badge';

export type ResourceBadgeTone = 'danger' | 'neutral' | 'positive' | 'warning';

interface ResourceBadgeProps extends HTMLAttributes<HTMLElement> {
  as?: 'button' | 'div' | 'span';
  asChild?: boolean;
  disabled?: boolean;
  iconName: GameIconName;
  label: string;
  type?: 'button' | 'submit';
  tone?: ResourceBadgeTone;
  value: ReactNode;
}

const toneClasses: Record<ResourceBadgeTone, string> = {
  danger: 'border-[color:var(--danger)] bg-[#f9dfdc] text-[#7d231c]',
  neutral: 'border-[rgba(214,163,74,0.16)] bg-[rgba(255,241,199,0.08)] text-[#fff1c7]',
  positive: 'border-[rgba(47,110,70,0.36)] bg-[rgba(47,110,70,0.14)] text-[#d9efc5]',
  warning: 'border-[color:var(--energy-ochre)] bg-[#fff1c7] text-[#6b4a05]',
};

export function ResourceBadge({
  as: Component = 'span',
  asChild = false,
  className,
  disabled,
  iconName,
  label,
  tone = 'neutral',
  type = 'button',
  value,
  ...props
}: ResourceBadgeProps) {
  const BadgeComponent = asChild ? Slot : Component;

  return (
    <Badge
      aria-label={label}
      className={cn(
        'rounded-md px-2.5 py-1.5',
        Component === 'button' && 'cursor-pointer disabled:cursor-not-allowed disabled:opacity-60',
        toneClasses[tone],
        className,
      )}
      data-slot="resource-badge"
      disabled={Component === 'button' ? disabled : undefined}
      type={Component === 'button' ? type : undefined}
      as={BadgeComponent}
      {...props}
    >
      <GameIcon name={iconName} size={16} />
      <strong className="min-w-0 truncate">{value}</strong>
    </Badge>
  );
}

export function TreasuryBadge(props: Omit<ResourceBadgeProps, 'iconName'>) {
  return <ResourceBadge iconName="treasury" {...props} />;
}

export function ReputationBadge(props: Omit<ResourceBadgeProps, 'iconName'>) {
  return <ResourceBadge iconName="reputation" {...props} />;
}
