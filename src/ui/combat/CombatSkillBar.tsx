import { useUiStore } from '../../state/ui-store-context';
import { formatMoneyAmount } from '../formatters/money';
import { GameIcon, type GameIconName } from '../icons/GameIcon';
import type { CombatScreenViewModel } from './combat-screen-view-model';

interface CombatSkillBarProps {
  canClose?: boolean;
  closeLabelKey?: string;
  viewModel: CombatScreenViewModel;
  onAdvance(): void;
  onClose(): void;
}

const skillItems = [
  { iconName: 'combatStrike', labelKey: 'combatScreen.skills.strike' },
  { iconName: 'combatGuard', labelKey: 'combatScreen.skills.guard' },
  { iconName: 'combatFeint', labelKey: 'combatScreen.skills.feint' },
  { iconName: 'combatPressure', labelKey: 'combatScreen.skills.pressure' },
] as const satisfies ReadonlyArray<{ iconName: GameIconName; labelKey: string }>;

function formatSignedValue(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

export function CombatSkillBar({
  canClose = true,
  closeLabelKey = 'combatScreen.returnToArena',
  onAdvance,
  onClose,
  viewModel,
}: CombatSkillBarProps) {
  const { t } = useUiStore();

  return (
    <section className="combat-skill-bar" data-testid="combat-skill-bar">
      <div className="combat-skill-bar__strategy">
        <span>{t('combatScreen.selectedStrategy')}</span>
        <strong>{t(`combat.strategies.${viewModel.combat.strategy}`)}</strong>
      </div>
      <div className="combat-skill-bar__skills">
        {skillItems.map(({ iconName, labelKey }) => (
          <button
            aria-label={t(labelKey)}
            disabled
            key={labelKey}
            title={t(labelKey)}
            type="button"
          >
            <GameIcon name={iconName} size={20} />
            <span>{t(labelKey)}</span>
          </button>
        ))}
      </div>
      {viewModel.isComplete ? (
        <div className="combat-skill-bar__result" data-testid="combat-result">
          <GameIcon name="victory" size={20} />
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
          <GameIcon name="combatStrike" size={18} />
          <span>
            {viewModel.isComplete ? t('arena.logComplete') : t('combatScreen.advanceTurn')}
          </span>
        </button>
        <button disabled={!canClose} type="button" onClick={onClose}>
          <span>{t(closeLabelKey)}</span>
        </button>
      </div>
    </section>
  );
}
