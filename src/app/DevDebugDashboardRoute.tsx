import { featureFlags } from '@/config/features';
import { useUiStore } from '@/state/ui-store-context';
import { ActionBar } from '@/ui/shared/ludus/ActionBar';
import { Button } from '@/ui/shared/ludus/Button';
import { GameStatusMessage } from '@/ui/shared/ludus/GameFeedback';
import { GameIcon } from '@/ui/shared/icons/GameIcon';
import { ScreenShell } from '@/ui/app-shell/ScreenShell';

export function DevDebugDashboardRoute() {
  const { navigate, t } = useUiStore();

  return (
    <ScreenShell titleKey="debugDashboard.title">
      <GameStatusMessage
        messageKey={
          featureFlags.enableDebugUi ? 'debugDashboard.enabled' : 'debugDashboard.unavailable'
        }
        testId={featureFlags.enableDebugUi ? 'debug-dashboard' : 'debug-dashboard-unavailable'}
        tone={featureFlags.enableDebugUi ? 'info' : 'danger'}
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
