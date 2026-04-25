import { calculateReadiness } from '../../domain/planning/readiness';
import { getRoutineForGladiator } from '../../domain/planning/planning-actions';
import type { GameSave, Gladiator } from '../../domain/types';
import { BUILDING_DEFINITIONS } from '../../game-data/buildings';
import { useUiStore } from '../../state/ui-store';
import { MetricList, PanelShell, SectionCard } from '../components/shared';
import { GladiatorPortrait } from '../roster/GladiatorPortrait';

interface GladiatorDetailPanelProps {
  save: GameSave;
  gladiator: Gladiator;
  onClose(): void;
}

export function GladiatorDetailPanel({ save, gladiator, onClose }: GladiatorDetailPanelProps) {
  const { t } = useUiStore();
  const routine = getRoutineForGladiator(save, gladiator.id);
  const currentBuildingName = gladiator.currentBuildingId
    ? t(BUILDING_DEFINITIONS[gladiator.currentBuildingId].nameKey)
    : t('weeklyPlan.noAssignment');

  return (
    <PanelShell eyebrowKey="gladiatorPanel.eyebrow" title={gladiator.name} onClose={onClose}>
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
      <MetricList
        items={[
          { labelKey: 'market.stats.strength', value: gladiator.strength },
          { labelKey: 'market.stats.agility', value: gladiator.agility },
          { labelKey: 'market.stats.defense', value: gladiator.defense },
          { labelKey: 'market.stats.health', value: gladiator.health },
          { labelKey: 'market.stats.energy', value: gladiator.energy },
          { labelKey: 'market.stats.morale', value: gladiator.morale },
        ]}
      />
      <SectionCard titleKey="weeklyPlan.objective">
        <span>{t(`weeklyPlan.objectives.${routine.objective}`)}</span>
      </SectionCard>
      <SectionCard titleKey="weeklyPlan.suggestedAssignment">
        <span>{currentBuildingName}</span>
      </SectionCard>
      {gladiator.traits.length > 0 ? (
        <ul className="trait-list" aria-label={t('market.traits')}>
          {gladiator.traits.map((trait) => (
            <li key={trait}>{t(`traits.${trait}`)}</li>
          ))}
        </ul>
      ) : null}
    </PanelShell>
  );
}
