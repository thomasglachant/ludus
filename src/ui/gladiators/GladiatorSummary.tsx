import type { ReactNode } from 'react';
import { getEffectiveSkillValue } from '../../domain/gladiators/skills';
import type { Gladiator } from '../../domain/types';
import { useUiStore } from '../../state/ui-store-context';
import { CardBlured } from '../components/CardBlured';
import { IconValueStat } from '../components/IconValueStat';
import { PercentageStatBar } from '../components/PercentageStatBar';
import type { GameIconName } from '../icons/GameIcon';
import { GladiatorPortrait } from '../roster/GladiatorPortrait';

type GladiatorSummarySide = 'player' | 'opponent';
type GladiatorSummaryTone = 'dark' | 'light';
type SecondaryGladiatorStatKey = 'energy' | 'health' | 'morale';
type PrimaryGladiatorStatKey = 'strength' | 'agility' | 'defense';

interface GladiatorSummaryProps {
  children?: ReactNode;
  className?: string;
  gladiator: Gladiator;
  odds?: number;
  side?: GladiatorSummarySide;
  statLabelKeys?: Partial<Record<SecondaryGladiatorStatKey, string>>;
  statValues?: Partial<Record<SecondaryGladiatorStatKey, number>>;
  testId?: string;
  tone?: GladiatorSummaryTone;
  topRightContent?: ReactNode;
  topRightLabel?: string;
}

const PRIMARY_GLADIATOR_STATS: Array<{
  iconName: GameIconName;
  key: PrimaryGladiatorStatKey;
  labelKey: string;
}> = [
  { iconName: 'strength', key: 'strength', labelKey: 'arenaRoute.statStrength' },
  { iconName: 'agility', key: 'agility', labelKey: 'arenaRoute.statAgility' },
  { iconName: 'defense', key: 'defense', labelKey: 'arenaRoute.statDefense' },
];

const SECONDARY_GLADIATOR_STATS: Array<{
  iconName: Extract<GameIconName, 'energy' | 'health' | 'morale'>;
  key: SecondaryGladiatorStatKey;
  labelKey: string;
}> = [
  { iconName: 'health', key: 'health', labelKey: 'arenaRoute.statHealth' },
  { iconName: 'energy', key: 'energy', labelKey: 'arenaRoute.statEnergy' },
  { iconName: 'morale', key: 'morale', labelKey: 'arenaRoute.statMorale' },
];

const SECONDARY_GLADIATOR_STAT_TONES = {
  energy: 'energy',
  health: 'health',
  morale: 'morale',
} as const;

function formatOdds(value: number) {
  return value.toFixed(2);
}

function getGladiatorClassKey(gladiator: Gladiator) {
  const bestStat = PRIMARY_GLADIATOR_STATS.reduce((best, stat) =>
    getEffectiveSkillValue(gladiator[stat.key]) > getEffectiveSkillValue(gladiator[best.key])
      ? stat
      : best,
  );

  return `gladiatorSummary.classes.${bestStat.key}`;
}

function GladiatorTopRightBadge({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div aria-label={label} className="gladiator-summary__top-right">
      {children}
    </div>
  );
}

function GladiatorOdds({ gladiatorName, odds }: { gladiatorName: string; odds: number }) {
  const { t } = useUiStore();
  const formattedOdds = formatOdds(odds);
  const label = t('arenaRoute.fighterOddsLabel', { fighter: gladiatorName, odds: formattedOdds });

  return (
    <GladiatorTopRightBadge label={label}>
      <strong>{formattedOdds}</strong>
    </GladiatorTopRightBadge>
  );
}

export function GladiatorSummary({
  children,
  className,
  gladiator,
  odds,
  side,
  statLabelKeys,
  statValues,
  testId,
  tone = 'dark',
  topRightContent,
  topRightLabel,
}: GladiatorSummaryProps) {
  const { t } = useUiStore();
  const primaryTrait = gladiator.traits[0];
  const classes = [
    'gladiator-summary',
    `gladiator-summary--${tone}`,
    side ? `gladiator-summary--${side}` : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <CardBlured as="article" className={classes} data-testid={testId}>
      {typeof odds === 'number' ? (
        <GladiatorOdds gladiatorName={gladiator.name} odds={odds} />
      ) : topRightContent ? (
        <GladiatorTopRightBadge label={topRightLabel}>{topRightContent}</GladiatorTopRightBadge>
      ) : null}
      <div className="gladiator-summary__identity">
        <GladiatorPortrait gladiator={gladiator} size="large" />
        <div className="gladiator-summary__info">
          <h2>{gladiator.name}</h2>
          <div className="gladiator-summary__meta">
            {primaryTrait ? (
              <span className="gladiator-summary__pill">{t(`traits.${primaryTrait}`)}</span>
            ) : null}
            <span className="gladiator-summary__pill">{t(getGladiatorClassKey(gladiator))}</span>
            <span className="gladiator-summary__pill">
              {t('market.age', { age: gladiator.age })}
            </span>
          </div>
          <div className="gladiator-summary__key-stats">
            <IconValueStat
              iconName="reputation"
              label={t('gladiatorPanel.reputation')}
              tooltipContent={t('gladiatorSummary.reputationTooltip', {
                losses: gladiator.losses,
                reputation: Math.round(gladiator.reputation),
                wins: gladiator.wins,
              })}
              value={Math.round(gladiator.reputation)}
            />
            {PRIMARY_GLADIATOR_STATS.map((stat) => (
              <IconValueStat
                iconName={stat.iconName}
                key={stat.key}
                label={t(stat.labelKey)}
                value={Math.round(getEffectiveSkillValue(gladiator[stat.key]))}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="gladiator-summary__stats">
        {SECONDARY_GLADIATOR_STATS.map((stat) => (
          <PercentageStatBar
            className="gladiator-summary__stat-bar"
            iconName={stat.iconName}
            key={stat.key}
            label={t(statLabelKeys?.[stat.key] ?? stat.labelKey)}
            tone={SECONDARY_GLADIATOR_STAT_TONES[stat.key]}
            value={statValues?.[stat.key] ?? Number(gladiator[stat.key])}
            variant={tone}
          />
        ))}
      </div>
      {children ? <div className="gladiator-summary__children">{children}</div> : null}
    </CardBlured>
  );
}
