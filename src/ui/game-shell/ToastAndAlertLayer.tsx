import { AlertTriangle } from 'lucide-react';
import type { GameSave } from '../../domain/types';
import { useUiStore } from '../../state/ui-store-context';
import { GladiatorPortrait } from '../roster/GladiatorPortrait';

interface ToastAndAlertLayerProps {
  errorKey: string | null;
  save: GameSave;
  saveNoticeKey?: string | null;
  showAlerts: boolean;
  onGladiatorSelect(gladiatorId: string): void;
}

export function ToastAndAlertLayer({
  errorKey,
  save,
  saveNoticeKey,
  showAlerts,
  onGladiatorSelect,
}: ToastAndAlertLayerProps) {
  const { t } = useUiStore();
  const visibleAlerts = showAlerts ? save.planning.alerts : [];
  const gladiatorById = new Map(save.gladiators.map((gladiator) => [gladiator.id, gladiator]));

  if (!errorKey && !saveNoticeKey && visibleAlerts.length === 0) {
    return null;
  }

  return (
    <div
      className={['toast-alert-layer', showAlerts ? 'toast-alert-layer--interactive' : '']
        .filter(Boolean)
        .join(' ')}
      aria-live="polite"
    >
      {errorKey ? <p className="toast-alert toast-alert--error">{t(errorKey)}</p> : null}
      {saveNoticeKey ? (
        <p className="toast-alert toast-alert--info" data-testid="save-notice">
          {t(saveNoticeKey)}
        </p>
      ) : null}
      {visibleAlerts.map((alert) => {
        const gladiator = alert.gladiatorId ? gladiatorById.get(alert.gladiatorId) : undefined;

        if (gladiator) {
          return (
            <button
              aria-label={t('roster.openGladiator', { name: gladiator.name })}
              className={`toast-alert toast-alert--${alert.severity} toast-alert--action`}
              key={alert.id}
              type="button"
              onClick={() => onGladiatorSelect(gladiator.id)}
            >
              <AlertTriangle aria-hidden="true" className="toast-alert__icon" size={16} />
              <span className="toast-alert__subject">
                <GladiatorPortrait gladiator={gladiator} size="small" />
                <span className="toast-alert__copy">
                  <strong>{gladiator.name}</strong>
                  <span>{t(alert.titleKey)}</span>
                </span>
              </span>
            </button>
          );
        }

        return (
          <div className={`toast-alert toast-alert--${alert.severity}`} key={alert.id}>
            <AlertTriangle aria-hidden="true" className="toast-alert__icon" size={16} />
            <span>{t(alert.titleKey)}</span>
          </div>
        );
      })}
    </div>
  );
}
