import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

interface CardScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardScrollArea = forwardRef<HTMLDivElement, CardScrollAreaProps>(
  ({ children, className, ...props }, ref) => (
    <div className={['card-scroll-area', className].filter(Boolean).join(' ')} ref={ref} {...props}>
      {children}
    </div>
  ),
);

CardScrollArea.displayName = 'CardScrollArea';
