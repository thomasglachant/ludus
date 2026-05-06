import { useEffect } from 'react';
import { featureFlags } from '@/config/features';
import { isDemoSaveId } from '@/game-data/demo-saves';
import { useGameStore } from '@/state/game-store-context';
import { useUiStore } from '@/state/ui-store-context';
import { ActionBar } from '@/ui/shared/ludus/ActionBar';
import { Button } from '@/ui/shared/ludus/Button';
import { GameStatusMessage } from '@/ui/shared/ludus/GameFeedback';
import { GameIcon } from '@/ui/shared/icons/GameIcon';
import { ScreenShell } from '@/ui/app-shell/ScreenShell';

interface DevDemoRouteProps {
  demoSaveId: string;
}

export function DevDemoRoute({ demoSaveId }: DevDemoRouteProps) {
  const { errorKey, isLoading, loadDemoSave } = useGameStore();
  const { navigate, t } = useUiStore();
  const routeErrorKey =
    featureFlags.enableDemoMode && !isDemoSaveId(demoSaveId) ? 'demoMode.routeNotFound' : null;

  useEffect(() => {
    if (!featureFlags.enableDemoMode) {
      return;
    }

    if (!isDemoSaveId(demoSaveId)) {
      return;
    }

    void loadDemoSave(demoSaveId);
  }, [demoSaveId, loadDemoSave]);

  if (!featureFlags.enableDemoMode) {
    return (
      <ScreenShell titleKey="demoMode.routeTitle">
        <GameStatusMessage
          messageKey="demoMode.unavailable"
          testId="dev-demo-unavailable"
          tone="danger"
        />
        <ActionBar>
          <Button
            icon={<GameIcon name="back" size={18} />}
            onClick={() => {
              window.history.replaceState(null, '', '/');
              navigate('mainMenu');
            }}
          >
            <span>{t('common.back')}</span>
          </Button>
        </ActionBar>
      </ScreenShell>
    );
  }

  if (routeErrorKey || errorKey) {
    return (
      <ScreenShell titleKey="demoMode.routeTitle">
        <GameStatusMessage
          messageKey={routeErrorKey ?? errorKey ?? 'demoMode.loadError'}
          tone="danger"
        />
        <ActionBar>
          <Button
            icon={<GameIcon name="back" size={18} />}
            onClick={() => {
              window.history.replaceState(null, '', '/');
              navigate('mainMenu');
            }}
          >
            <span>{t('common.back')}</span>
          </Button>
        </ActionBar>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell titleKey="demoMode.routeTitle">
      <GameStatusMessage messageKey={isLoading ? 'common.loading' : 'demoMode.loadingRoute'} />
    </ScreenShell>
  );
}
