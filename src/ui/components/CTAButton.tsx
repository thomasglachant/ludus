import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface CTAButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function CTAButton({ children, className, type = 'button', ...props }: CTAButtonProps) {
  return (
    <button className={['cta-button', className].filter(Boolean).join(' ')} type={type} {...props}>
      {children}
    </button>
  );
}
