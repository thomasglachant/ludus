import type { CSSProperties } from 'react';
import { getGladiatorExperienceProgress } from '../../domain/gladiators/progression';
import type { Gladiator } from '../../domain/types';
import { useUiStore } from '../../state/ui-store-context';
import { formatNumber } from '../formatters/number';

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
  const style = {
    '--gladiator-xp-progress': `${Math.round(progress.ratio * 100)}%`,
  } as CSSProperties;

  return (
    <div
      aria-label={t('gladiatorPanel.experienceProgressLabel', {
        value: valueLabel,
      })}
      className="gladiator-xp-bar"
      style={style}
    >
      <strong className="gladiator-xp-bar__symbol">{t('common.xpSymbol')}</strong>
      <span className="gladiator-xp-bar__track" aria-hidden="true">
        <span className="gladiator-xp-bar__fill" />
      </span>
      <span className="gladiator-xp-bar__value">{valueLabel}</span>
    </div>
  );
}
