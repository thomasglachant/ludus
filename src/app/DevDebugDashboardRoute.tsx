import { featureFlags } from '../config/features';
import { useUiStore } from '../state/ui-store-context';
import { ActionButton } from '../ui/components/ActionButton';
import { GameIcon } from '../ui/icons/GameIcon';
import { ScreenShell } from '../ui/layout/ScreenShell';

export function DevDebugDashboardRoute() {
  const { navigate, t } = useUiStore();

  return (
    <ScreenShell titleKey="debugDashboard.title">
      <p
        className={featureFlags.enableDebugUi ? 'empty-state' : 'form-error'}
        data-testid={featureFlags.enableDebugUi ? 'debug-dashboard' : 'debug-dashboard-unavailable'}
      >
        {t(featureFlags.enableDebugUi ? 'debugDashboard.enabled' : 'debugDashboard.unavailable')}
      </p>
      <div className="form-actions">
        <ActionButton
          icon={<GameIcon name="back" size={18} />}
          label={t('common.back')}
          onClick={() => {
            window.history.replaceState(null, '', '/');
            navigate('mainMenu');
          }}
        />
      </div>
    </ScreenShell>
  );
}
