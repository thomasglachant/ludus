import { lazy, Suspense } from 'react';
import type { ScreenName } from './routes';
import { useUiStore } from '../state/ui-store';
import { DevDemoRoute } from './DevDemoRoute';
import { getDevDemoSaveId } from './dev-demo-route-utils';
import { AppLayout } from '../ui/layout/AppLayout';
import { LudusScreen } from '../ui/screens/LudusScreen';
import { MainMenuScreen } from '../ui/screens/MainMenuScreen';
import { NewGameScreen } from '../ui/screens/NewGameScreen';

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
    case 'mainMenu':
      return <MainMenuScreen />;
  }
}

export function App() {
  const { screen, t } = useUiStore();
  const devDemoSaveId = getDevDemoSaveId(window.location.pathname);
  const isDebugDashboardRoute = window.location.pathname === '/dev/debug-dashboard';

  return (
    <AppLayout>
      {isDebugDashboardRoute ? (
        <Suspense fallback={<p className="empty-state">{t('common.loading')}</p>}>
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
