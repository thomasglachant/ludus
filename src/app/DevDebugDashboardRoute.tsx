import { ArrowLeft } from 'lucide-react';
import { featureFlags } from '../config/features';
import { useUiStore } from '../state/ui-store';
import { ActionButton } from '../ui/components/ActionButton';
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
          icon={<ArrowLeft aria-hidden="true" size={18} />}
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
