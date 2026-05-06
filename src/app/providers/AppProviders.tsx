import type { ReactNode } from 'react';
import { GameStoreProvider } from '../../state/game-store';
import { UiStoreProvider } from '../../state/ui-store';
import { TooltipProvider } from '@/ui/shared/primitives/Tooltip';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <UiStoreProvider>
      <GameStoreProvider>
        <TooltipProvider delayDuration={100}>{children}</TooltipProvider>
      </GameStoreProvider>
    </UiStoreProvider>
  );
}
