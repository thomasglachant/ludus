import type { ReactNode } from 'react';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useUiStore } from '../../state/ui-store';

export function AppLayout({ children }: { children: ReactNode }) {
  const { screen } = useUiStore();
  const className = [
    'app-layout',
    screen === 'mainMenu' ? 'app-layout--main-menu' : '',
    screen === 'ludus' ? 'app-layout--game-shell' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <main className={className}>
      <div className="app-layout__toolbar">
        <LanguageSwitcher />
      </div>
      {children}
    </main>
  );
}
