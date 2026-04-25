import { X } from 'lucide-react';
import { calculateReadiness } from '../../domain/planning/readiness';
import { getRoutineForGladiator } from '../../domain/planning/planning-actions';
import type { GameSave, Gladiator } from '../../domain/types';
import { BUILDING_DEFINITIONS } from '../../game-data/buildings';
import { useUiStore } from '../../state/ui-store';
import { GladiatorPortrait } from '../roster/GladiatorPortrait';

interface GladiatorDetailPanelProps {
  save: GameSave;
  gladiator: Gladiator;
  onClose(): void;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function GladiatorDetailPanel({ save, gladiator, onClose }: GladiatorDetailPanelProps) {
  const { t } = useUiStore();
  const routine = getRoutineForGladiator(save, gladiator.id);
  const currentBuildingName = gladiator.currentBuildingId
    ? t(BUILDING_DEFINITIONS[gladiator.currentBuildingId].nameKey)
    : t('weeklyPlan.noAssignment');

  return (
    <section className="context-panel" aria-labelledby="gladiator-panel-title">
      <div className="context-panel__header">
        <div>
          <p className="eyebrow">{t('gladiatorPanel.eyebrow')}</p>
          <h2 id="gladiator-panel-title">{gladiator.name}</h2>
        </div>
        <button aria-label={t('common.close')} type="button" onClick={onClose}>
          <X aria-hidden="true" size={18} />
        </button>
      </div>
      <div className="gladiator-detail">
        <GladiatorPortrait gladiator={gladiator} size="large" />
        <div>
          <strong>
            {t('weeklyPlan.readinessValue', { score: calculateReadiness(gladiator) })}
          </strong>
          <span>{t('market.record', { wins: gladiator.wins, losses: gladiator.losses })}</span>
          <span>{t('roster.reputation', { reputation: gladiator.reputation })}</span>
        </div>
      </div>
      <dl className="context-panel__stats">
        <Stat label={t('market.stats.strength')} value={gladiator.strength} />
        <Stat label={t('market.stats.agility')} value={gladiator.agility} />
        <Stat label={t('market.stats.defense')} value={gladiator.defense} />
        <Stat label={t('market.stats.health')} value={gladiator.health} />
        <Stat label={t('market.stats.energy')} value={gladiator.energy} />
        <Stat label={t('market.stats.morale')} value={gladiator.morale} />
      </dl>
      <div className="context-panel__callout">
        <strong>{t('weeklyPlan.objective')}</strong>
        <span>{t(`weeklyPlan.objectives.${routine.objective}`)}</span>
      </div>
      <div className="context-panel__callout">
        <strong>{t('weeklyPlan.suggestedAssignment')}</strong>
        <span>{currentBuildingName}</span>
      </div>
      {gladiator.traits.length > 0 ? (
        <ul className="trait-list" aria-label={t('market.traits')}>
          {gladiator.traits.map((trait) => (
            <li key={trait}>{t(`traits.${trait}`)}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
