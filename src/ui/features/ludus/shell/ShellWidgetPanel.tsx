import type { HTMLAttributes, ReactNode } from 'react';

interface ShellWidgetPanelProps extends HTMLAttributes<HTMLElement> {
  as?: 'article' | 'aside' | 'div' | 'nav' | 'section';
  children: ReactNode;
}

export function ShellWidgetPanel({
  as: Component = 'section',
  children,
  className,
  ...props
}: ShellWidgetPanelProps) {
  return (
    <Component className={['shell-widget-panel', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </Component>
  );
}
