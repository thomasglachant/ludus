import { AlertTriangle } from 'lucide-react';
import type { CSSProperties } from 'react';
import { calculateEffectiveReadiness } from '../../domain/planning/readiness';
import type { GameSave, Gladiator } from '../../domain/types';
import { getGladiatorPlanningStatuses } from '../../domain/planning/planning-actions';
import { useUiStore } from '../../state/ui-store';
import { GladiatorPortrait } from './GladiatorPortrait';

interface BottomGladiatorRosterProps {
  save: GameSave;
  selectedGladiatorId?: string;
  onSelectGladiator(gladiatorId: string): void;
}

interface MeterProps {
  label: string;
  value: number;
}

function Meter({ label, value }: MeterProps) {
  return (
    <span className="roster-meter" aria-label={`${label} ${value}`}>
      <span className="roster-meter__track">
        <span className="roster-meter__value" style={{ width: `${value}%` }} />
      </span>
      <span className="roster-meter__label">{label}</span>
    </span>
  );
}

function getPrimaryAlert(save: GameSave, gladiator: Gladiator) {
  return save.planning.alerts.find((alert) => alert.gladiatorId === gladiator.id);
}

export function BottomGladiatorRoster({
  save,
  selectedGladiatorId,
  onSelectGladiator,
}: BottomGladiatorRosterProps) {
  const { t } = useUiStore();
  const statuses = getGladiatorPlanningStatuses(save);
  const statusByGladiatorId = new Map(statuses.map((status) => [status.gladiator.id, status]));

  return (
    <section className="bottom-roster" data-testid="gladiator-list" aria-label={t('roster.title')}>
      {save.gladiators.length > 0 ? (
        <div
          className="bottom-roster__scroller"
          style={
            {
              '--roster-card-min': save.gladiators.length > 6 ? '154px' : '220px',
            } as CSSProperties
          }
        >
          {save.gladiators.map((gladiator) => {
            const status = statusByGladiatorId.get(gladiator.id);
            const readiness = calculateEffectiveReadiness(save, gladiator);
            const primaryAlert = getPrimaryAlert(save, gladiator);

            return (
              <button
                aria-label={t('roster.openGladiator', { name: gladiator.name })}
                className={[
                  'roster-card',
                  selectedGladiatorId === gladiator.id ? 'is-selected' : '',
                  primaryAlert ? `roster-card--${primaryAlert.severity}` : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                data-testid={`gladiator-card-${gladiator.id}`}
                key={gladiator.id}
                type="button"
                onClick={() => onSelectGladiator(gladiator.id)}
              >
                <GladiatorPortrait gladiator={gladiator} size="small" />
                <span className="roster-card__body">
                  <span className="roster-card__topline">
                    <strong>{gladiator.name}</strong>
                    <span>{t('roster.reputation', { reputation: gladiator.reputation })}</span>
                  </span>
                  <span className="roster-card__objective">
                    {status
                      ? t(`weeklyPlan.objectives.${status.routine.objective}`)
                      : t('common.empty')}
                  </span>
                  <span className="roster-card__meters">
                    <Meter label={t('roster.healthShort')} value={gladiator.health} />
                    <Meter label={t('roster.energyShort')} value={gladiator.energy} />
                    <Meter label={t('roster.moraleShort')} value={gladiator.morale} />
                    <Meter label={t('roster.satietyShort')} value={gladiator.satiety} />
                  </span>
                  <span className="roster-card__footer">
                    <span>{t('weeklyPlan.readinessValue', { score: readiness })}</span>
                    {primaryAlert ? (
                      <span className="roster-card__alert">
                        <AlertTriangle aria-hidden="true" size={13} />
                        {t(primaryAlert.titleKey)}
                      </span>
                    ) : null}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="bottom-roster__empty">{t('ludus.noGladiators')}</p>
      )}
    </section>
  );
}
