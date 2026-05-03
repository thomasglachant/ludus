import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { GameIcon, type GameIconName } from '../icons/GameIcon';

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
    <button className={['cta-button', className].filter(Boolean).join(' ')} type={type} {...props}>
      {children}
      {amountMoney === undefined ? null : (
        <span className="cta-button__amount">
          <span>(</span>
          <strong>{amountMoney}</strong>
          <GameIcon name={moneyIconName} size={15} />
          <span>)</span>
        </span>
      )}
    </button>
  );
}
