import type { GameSave } from '../../domain/types';
import {
  getRemainingStatusEffectDuration,
  getStatusEffectDefinition,
} from '../../domain/status-effects/status-effect-actions';
import { useUiStore } from '../../state/ui-store-context';
import { GameIcon, type GameIconName } from '../icons/GameIcon';
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
        const statusEffect = alert.statusEffectInstanceId
          ? save.statusEffects.find((effect) => effect.id === alert.statusEffectInstanceId)
          : undefined;
        const statusEffectDefinition = statusEffect
          ? getStatusEffectDefinition(statusEffect.effectId)
          : undefined;
        const statusEffectDuration = statusEffect
          ? getRemainingStatusEffectDuration(statusEffect, {
              year: save.time.year,
              week: save.time.week,
              dayOfWeek: save.time.dayOfWeek,
            })
          : undefined;
        const alertIconName =
          statusEffectDefinition?.visual.iconName ?? ('alert' satisfies GameIconName);
        const alertTitle = statusEffectDuration
          ? t('alerts.statusEffect.title', {
              effect: t(alert.titleKey),
              days: statusEffectDuration.days,
            })
          : t(alert.titleKey);

        if (gladiator) {
          return (
            <button
              aria-label={t('roster.openGladiator', { name: gladiator.name })}
              className={`toast-alert toast-alert--${alert.severity} toast-alert--action`}
              key={alert.id}
              type="button"
              onClick={() => onGladiatorSelect(gladiator.id)}
            >
              <GameIcon
                className="toast-alert__icon"
                color={statusEffectDefinition?.visual.color}
                name={alertIconName as GameIconName}
                size={16}
              />
              <span className="toast-alert__subject">
                <GladiatorPortrait gladiator={gladiator} size="small" />
                <span className="toast-alert__copy">
                  <strong>{gladiator.name}</strong>
                  <span>{alertTitle}</span>
                </span>
              </span>
            </button>
          );
        }

        return (
          <div className={`toast-alert toast-alert--${alert.severity}`} key={alert.id}>
            <GameIcon
              className="toast-alert__icon"
              name={alertIconName as GameIconName}
              size={16}
            />
            <span>{alertTitle}</span>
          </div>
        );
      })}
    </div>
  );
}
