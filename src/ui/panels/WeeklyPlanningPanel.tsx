import { Sparkles, X } from 'lucide-react';
import { calculateReadiness } from '../../domain/planning/readiness';
import { getGladiatorPlanningStatuses } from '../../domain/planning/planning-actions';
import type { GameSave, GladiatorRoutineUpdate } from '../../domain/types';
import { BUILDING_DEFINITIONS, BUILDING_IDS } from '../../game-data/buildings';
import { COMBAT_STRATEGIES } from '../../game-data/combat';
import { TRAINING_INTENSITIES, WEEKLY_OBJECTIVES } from '../../game-data/planning';
import { useUiStore } from '../../state/ui-store';
import { GladiatorPortrait } from '../roster/GladiatorPortrait';

interface WeeklyPlanningPanelProps {
  save: GameSave;
  onApplyRecommendations(): void;
  onClose(): void;
  onUpdateRoutine(gladiatorId: string, update: GladiatorRoutineUpdate): void;
}

export function WeeklyPlanningPanel({
  save,
  onApplyRecommendations,
  onClose,
  onUpdateRoutine,
}: WeeklyPlanningPanelProps) {
  const { t } = useUiStore();
  const statuses = getGladiatorPlanningStatuses(save);
  const atRiskStatuses = statuses.filter(
    (status) =>
      status.gladiator.health < 50 ||
      status.gladiator.energy < 50 ||
      status.gladiator.morale < 45 ||
      status.gladiator.satiety < 45,
  );

  return (
    <section className="context-panel context-panel--wide" aria-labelledby="weekly-panel-title">
      <div className="context-panel__header">
        <div>
          <p className="eyebrow">{t('weeklyPlan.title')}</p>
          <h2 id="weekly-panel-title">{t('weeklyPlan.dashboard')}</h2>
        </div>
        <button aria-label={t('common.close')} type="button" onClick={onClose}>
          <X aria-hidden="true" size={18} />
        </button>
      </div>
      <div className="context-panel__actions">
        <button type="button" onClick={onApplyRecommendations}>
          <Sparkles aria-hidden="true" size={17} />
          <span>{t('weeklyPlan.applyRecommendations')}</span>
        </button>
      </div>
      <dl className="context-panel__stats">
        <div>
          <dt>{t('weeklyPlan.readiness')}</dt>
          <dd>
            {statuses.length > 0
              ? Math.round(
                  statuses.reduce(
                    (total, status) => total + calculateReadiness(status.gladiator),
                    0,
                  ) / statuses.length,
                )
              : 0}
          </dd>
        </div>
        <div>
          <dt>{t('weeklyPlan.alerts')}</dt>
          <dd>{save.planning.alerts.length}</dd>
        </div>
        <div>
          <dt>{t('weeklyPlan.atRisk')}</dt>
          <dd>{atRiskStatuses.length}</dd>
        </div>
      </dl>
      {save.planning.alerts.length > 0 ? (
        <ul className="alert-list">
          {save.planning.alerts.slice(0, 4).map((alert) => (
            <li className={`alert-list__item alert-list__item--${alert.severity}`} key={alert.id}>
              <strong>{t(alert.titleKey)}</strong>
              <span>{t(alert.descriptionKey)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="context-panel__muted">{t('weeklyPlan.noAlerts')}</p>
      )}
      <div className="planning-card-grid">
        {statuses.map((status) => (
          <article className="planning-card planning-card--shell" key={status.gladiator.id}>
            <div className="planning-card__header">
              <div className="context-panel__portrait-row">
                <GladiatorPortrait gladiator={status.gladiator} size="small" />
                <div>
                  <h3>{status.gladiator.name}</h3>
                  <p>
                    {status.recommendation
                      ? t(status.recommendation.reasonKey)
                      : t('weeklyPlan.noAlerts')}
                  </p>
                </div>
              </div>
              <strong>{t('weeklyPlan.readinessValue', { score: status.readiness })}</strong>
            </div>
            <div className="planning-controls">
              <label>
                <span>{t('weeklyPlan.objective')}</span>
                <select
                  value={status.routine.objective}
                  onChange={(event) =>
                    onUpdateRoutine(status.gladiator.id, {
                      objective: event.target.value as GladiatorRoutineUpdate['objective'],
                    })
                  }
                >
                  {WEEKLY_OBJECTIVES.map((objective) => (
                    <option key={objective} value={objective}>
                      {t(`weeklyPlan.objectives.${objective}`)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>{t('weeklyPlan.intensity')}</span>
                <select
                  value={status.routine.intensity}
                  onChange={(event) =>
                    onUpdateRoutine(status.gladiator.id, {
                      intensity: event.target.value as GladiatorRoutineUpdate['intensity'],
                    })
                  }
                >
                  {TRAINING_INTENSITIES.map((intensity) => (
                    <option key={intensity} value={intensity}>
                      {t(`weeklyPlan.intensities.${intensity}`)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>{t('weeklyPlan.strategy')}</span>
                <select
                  value={status.routine.combatStrategy ?? 'balanced'}
                  onChange={(event) =>
                    onUpdateRoutine(status.gladiator.id, {
                      combatStrategy: event.target
                        .value as GladiatorRoutineUpdate['combatStrategy'],
                    })
                  }
                >
                  {COMBAT_STRATEGIES.map((strategy) => (
                    <option key={strategy} value={strategy}>
                      {t(`combat.strategies.${strategy}`)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>{t('weeklyPlan.manualOverride')}</span>
                <select
                  value={status.routine.lockedBuildingId ?? ''}
                  onChange={(event) =>
                    onUpdateRoutine(status.gladiator.id, {
                      lockedBuildingId: event.target.value
                        ? (event.target.value as GladiatorRoutineUpdate['lockedBuildingId'])
                        : undefined,
                    })
                  }
                >
                  <option value="">{t('weeklyPlan.noManualOverride')}</option>
                  {BUILDING_IDS.map((buildingId) => (
                    <option
                      disabled={!save.buildings[buildingId].isPurchased}
                      key={buildingId}
                      value={buildingId}
                    >
                      {t(BUILDING_DEFINITIONS[buildingId].nameKey)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
