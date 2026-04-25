import type { ScreenName } from './routes';
import { useUiStore } from '../state/ui-store';
import { DevDemoRoute } from './DevDemoRoute';
import { getDevDemoSaveId } from './dev-demo-route-utils';
import { DevDebugDashboardRoute } from './DevDebugDashboardRoute';
import { AppLayout } from '../ui/layout/AppLayout';
import { LudusScreen } from '../ui/screens/LudusScreen';
import { MainMenuScreen } from '../ui/screens/MainMenuScreen';
import { MarketScreen } from '../ui/screens/MarketScreen';
import { NewGameScreen } from '../ui/screens/NewGameScreen';

function renderScreen(screen: ScreenName) {
  switch (screen) {
    case 'newGame':
      return <NewGameScreen />;
    case 'ludus':
      return <LudusScreen />;
    case 'market':
      return <MarketScreen />;
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
        <DevDebugDashboardRoute />
      ) : devDemoSaveId ? (
        <DevDemoRoute demoSaveId={devDemoSaveId} />
      ) : (
        renderScreen(screen)
      )}
    </AppLayout>
  );
}
