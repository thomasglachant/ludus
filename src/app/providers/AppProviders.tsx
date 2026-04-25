import type { ReactNode } from 'react';
import { GameStoreProvider } from '../../state/game-store';
import { UiStoreProvider } from '../../state/ui-store';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <UiStoreProvider>
      <GameStoreProvider>{children}</GameStoreProvider>
    </UiStoreProvider>
  );
}
