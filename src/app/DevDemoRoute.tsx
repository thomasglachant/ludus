import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { featureFlags } from '../config/features';
import { isDemoSaveId } from '../game-data/demo-saves';
import { useGameStore } from '../state/game-store-context';
import { useUiStore } from '../state/ui-store-context';
import { ActionButton } from '../ui/components/ActionButton';
import { ScreenShell } from '../ui/layout/ScreenShell';

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

    void loadDemoSave(demoSaveId).then(() => {
      window.history.replaceState(null, '', '/');
    });
  }, [demoSaveId, loadDemoSave, navigate]);

  if (!featureFlags.enableDemoMode) {
    return (
      <ScreenShell titleKey="demoMode.routeTitle">
        <p className="form-error" data-testid="dev-demo-unavailable">
          {t('demoMode.unavailable')}
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

  if (routeErrorKey || errorKey) {
    return (
      <ScreenShell titleKey="demoMode.routeTitle">
        <p className="form-error">{t(routeErrorKey ?? errorKey ?? 'demoMode.loadError')}</p>
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

  return (
    <ScreenShell titleKey="demoMode.routeTitle">
      <p className="empty-state">{t(isLoading ? 'common.loading' : 'demoMode.loadingRoute')}</p>
    </ScreenShell>
  );
}
