import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { GameIconName } from '../icons/GameIcon';
import { RomanButton } from '../game/RomanButton';

interface CTAButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  amountMoney?: ReactNode;
  children: ReactNode;
  moneyIconName?: GameIconName;
}

export function CTAButton({
  amountMoney,
  children,
  className,
  moneyIconName = 'treasury',
  type = 'button',
  ...props
}: CTAButtonProps) {
  return (
    <RomanButton
      amountClassName="cta-button__amount"
      amountMoney={amountMoney}
      className={['cta-button', className].filter(Boolean).join(' ')}
      moneyIconName={moneyIconName}
      tone="secondary"
      type={type}
      {...props}
    >
      {children}
    </RomanButton>
  );
}
