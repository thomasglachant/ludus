import { AlertTriangle } from 'lucide-react';
import type { GameSave } from '../../domain/types';
import { useUiStore } from '../../state/ui-store';

interface ToastAndAlertLayerProps {
  errorKey: string | null;
  save: GameSave;
  saveNoticeKey?: string | null;
}

export function ToastAndAlertLayer({ errorKey, save, saveNoticeKey }: ToastAndAlertLayerProps) {
  const { t } = useUiStore();
  const importantAlerts = save.planning.alerts
    .filter((alert) => alert.severity === 'critical' || alert.severity === 'warning')
    .slice(0, 3);

  if (!errorKey && importantAlerts.length === 0) {
    return null;
  }

  return (
    <div className="toast-alert-layer" aria-live="polite">
      {errorKey ? <p className="toast-alert toast-alert--error">{t(errorKey)}</p> : null}
      {saveNoticeKey ? (
        <p className="toast-alert toast-alert--info" data-testid="save-notice">
          {t(saveNoticeKey)}
        </p>
      ) : null}
      {importantAlerts.map((alert) => (
        <div className={`toast-alert toast-alert--${alert.severity}`} key={alert.id}>
          <AlertTriangle aria-hidden="true" size={16} />
          <span>{t(alert.titleKey)}</span>
        </div>
      ))}
    </div>
  );
}
