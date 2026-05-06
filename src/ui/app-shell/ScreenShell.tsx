import type { ReactNode } from 'react';
import { useUiStore } from '@/state/ui-store-context';
import { GameIcon } from '@/ui/shared/icons/GameIcon';

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
        <GameIcon name="defense" size={28} />
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
