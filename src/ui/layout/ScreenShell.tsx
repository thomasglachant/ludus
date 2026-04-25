import type { ReactNode } from 'react';
import { Shield } from 'lucide-react';
import { useUiStore } from '../../state/ui-store';

interface ScreenShellProps {
  titleKey: string;
  subtitleKey?: string;
  children: ReactNode;
}

export function ScreenShell({ titleKey, subtitleKey, children }: ScreenShellProps) {
  const { t } = useUiStore();

  return (
    <section className="screen-shell">
      <div className="screen-shell__heading">
        <Shield aria-hidden="true" size={28} />
        <div>
          <p className="eyebrow">{t('app.title')}</p>
          <h1>{t(titleKey)}</h1>
          {subtitleKey ? <p>{t(subtitleKey)}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}
