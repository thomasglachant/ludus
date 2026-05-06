import { lazy, Suspense } from 'react';
import type { ScreenName } from './routes';
import { useUiStore } from '@/state/ui-store-context';
import { DevDemoRoute } from './DevDemoRoute';
import { getDevDemoSaveId } from './dev-demo-route-utils';
import { AppLayout } from '@/ui/app-shell/AppLayout';
import { GameStatusMessage } from '@/ui/shared/ludus/GameFeedback';
import { ArenaScreen } from '@/ui/features/arena/ArenaScreen';
import { LudusScreen } from '@/ui/features/ludus/LudusScreen';
import { MainMenuScreen } from '@/ui/features/main-menu/MainMenuScreen';
import { NewGameScreen } from '@/ui/features/new-game/NewGameScreen';

const DevDebugDashboardRoute = lazy(() =>
  import('./DevDebugDashboardRoute').then((module) => ({
    default: module.DevDebugDashboardRoute,
  })),
);

function renderScreen(screen: ScreenName) {
  switch (screen) {
    case 'newGame':
      return <NewGameScreen />;
    case 'ludus':
      return <LudusScreen />;
    case 'arena':
      return <ArenaScreen />;
    case 'mainMenu':
      return <MainMenuScreen />;
  }
}

export function App() {
  const { screen } = useUiStore();
  const devDemoSaveId = getDevDemoSaveId(window.location.pathname);
  const isDebugDashboardRoute = window.location.pathname === '/dev/debug-dashboard';

  return (
    <AppLayout>
      {isDebugDashboardRoute ? (
        <Suspense fallback={<GameStatusMessage messageKey="common.loading" surface="dark" />}>
          <DevDebugDashboardRoute />
        </Suspense>
      ) : devDemoSaveId ? (
        <DevDemoRoute demoSaveId={devDemoSaveId} />
      ) : (
        renderScreen(screen)
      )}
    </AppLayout>
  );
}
