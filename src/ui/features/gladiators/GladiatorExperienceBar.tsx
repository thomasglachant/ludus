import './gladiators.css';
import { getGladiatorExperienceProgress } from '@/domain/gladiators/progression';
import type { Gladiator } from '@/domain/types';
import { useUiStore } from '@/state/ui-store-context';
import { formatNumber } from '@/ui/shared/formatters/number';
import { GameProgress } from '@/ui/shared/ludus/GameProgress';

interface GladiatorExperienceBarProps {
  gladiator: Pick<Gladiator, 'experience'>;
}

export function GladiatorExperienceBar({ gladiator }: GladiatorExperienceBarProps) {
  const { t } = useUiStore();
  const progress = getGladiatorExperienceProgress(gladiator);
  const valueLabel =
    progress.requiredExperience === 0
      ? t('gladiatorPanel.maxLevel')
      : t('gladiatorPanel.experienceProgressValue', {
          current: formatNumber(progress.currentExperience),
          maximum: formatNumber(progress.requiredExperience),
        });
  const label = t('gladiatorPanel.experienceProgressLabel', {
    value: valueLabel,
  });

  return (
    <div aria-label={label} className="gladiator-xp-bar">
      <strong className="gladiator-xp-bar__symbol">{t('common.xpSymbol')}</strong>
      <GameProgress
        className="gladiator-xp-bar__track"
        indicatorClassName="gladiator-xp-bar__fill"
        label={label}
        value={Math.round(progress.ratio * 100)}
      />
      <span className="gladiator-xp-bar__value">{valueLabel}</span>
    </div>
  );
}
