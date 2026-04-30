import type { HTMLAttributes, ReactNode } from 'react';

interface CardBluredProps extends HTMLAttributes<HTMLElement> {
  as?: 'article' | 'aside' | 'div' | 'section';
  children: ReactNode;
}

export function CardBlured({
  as: Component = 'section',
  children,
  className,
  ...props
}: CardBluredProps) {
  return (
    <Component className={['card-blured', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </Component>
  );
}
