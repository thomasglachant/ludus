import { Footprints, Shield, Swords, Target, Trophy } from 'lucide-react';
import { useUiStore } from '../../state/ui-store';
import { formatMoneyAmount } from '../formatters/money';
import type { CombatScreenViewModel } from './combat-screen-view-model';

interface CombatSkillBarProps {
  viewModel: CombatScreenViewModel;
  onAdvance(): void;
  onClose(): void;
}

const skillItems = [
  { icon: Swords, labelKey: 'combatScreen.skills.strike' },
  { icon: Shield, labelKey: 'combatScreen.skills.guard' },
  { icon: Footprints, labelKey: 'combatScreen.skills.feint' },
  { icon: Target, labelKey: 'combatScreen.skills.pressure' },
] as const;

function formatSignedValue(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

export function CombatSkillBar({ onAdvance, onClose, viewModel }: CombatSkillBarProps) {
  const { t } = useUiStore();

  return (
    <section className="combat-skill-bar" data-testid="combat-skill-bar">
      <div className="combat-skill-bar__strategy">
        <span>{t('combatScreen.selectedStrategy')}</span>
        <strong>{t(`combat.strategies.${viewModel.combat.strategy}`)}</strong>
      </div>
      <div className="combat-skill-bar__skills">
        {skillItems.map(({ icon: Icon, labelKey }) => (
          <button
            aria-label={t(labelKey)}
            disabled
            key={labelKey}
            title={t(labelKey)}
            type="button"
          >
            <Icon aria-hidden="true" size={20} />
            <span>{t(labelKey)}</span>
          </button>
        ))}
      </div>
      {viewModel.isComplete ? (
        <div className="combat-skill-bar__result" data-testid="combat-result">
          <Trophy aria-hidden="true" size={20} />
          <div>
            <strong>{t(viewModel.consequence.resultKey)}</strong>
            <span>
              {t('combatScreen.resultSummary', {
                reward: formatMoneyAmount(viewModel.consequence.playerReward),
                reputation: formatSignedValue(viewModel.consequence.reputationChange),
              })}
            </span>
          </div>
        </div>
      ) : null}
      <div className="combat-skill-bar__actions">
        <button disabled={viewModel.isComplete} type="button" onClick={onAdvance}>
          <Swords aria-hidden="true" size={18} />
          <span>
            {viewModel.isComplete ? t('arena.logComplete') : t('combatScreen.advanceTurn')}
          </span>
        </button>
        <button type="button" onClick={onClose}>
          <span>{t('combatScreen.returnToArena')}</span>
        </button>
      </div>
    </section>
  );
}
