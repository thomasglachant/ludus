import './gladiators.css';
import type { ReactNode } from 'react';
import { getEffectiveSkillValue } from '@/domain/gladiators/skills';
import { getGladiatorLevel } from '@/domain/gladiators/progression';
import type { GameSave, Gladiator } from '@/domain/types';
import { useUiStore } from '@/state/ui-store-context';
import { Tooltip } from '@/ui/shared/components/Tooltip';
import { formatNumber } from '@/ui/shared/formatters/number';
import { GameFact } from '@/ui/shared/ludus/GameFact';
import { GameCard } from '@/ui/shared/ludus/GameCard';
import { GameMeter } from '@/ui/shared/ludus/GameMeter';
import type { GameIconName } from '@/ui/shared/icons/GameIcon';
import { GladiatorPortrait } from '@/ui/features/gladiators/GladiatorPortrait';
import { GladiatorTraits } from './GladiatorTraits';

type GladiatorSummarySide = 'player' | 'opponent';
type GladiatorSummaryTone = 'dark' | 'light';
type SecondaryGladiatorStatKey = 'energy' | 'health' | 'morale';
type PrimaryGladiatorStatKey = 'strength' | 'agility' | 'defense' | 'life';

interface GladiatorSummaryProps {
  children?: ReactNode;
  className?: string;
  gladiator: Gladiator;
  odds?: number;
  save: GameSave;
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
  { iconName: 'health', key: 'life', labelKey: 'market.stats.life' },
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

function GladiatorKeyFact({
  iconName,
  label,
  tooltipContent,
  value,
}: {
  iconName: GameIconName;
  label: string;
  tooltipContent?: string;
  value: number;
}) {
  return (
    <Tooltip content={tooltipContent ?? label}>
      <GameFact
        className="icon-value-stat"
        iconName={iconName}
        label={label}
        showLabel={false}
        surface="light"
        value={formatNumber(value)}
      />
    </Tooltip>
  );
}

export function GladiatorSummary({
  children,
  className,
  gladiator,
  odds,
  save,
  side,
  statLabelKeys,
  statValues,
  testId,
  tone = 'dark',
  topRightContent,
  topRightLabel,
}: GladiatorSummaryProps) {
  const { t } = useUiStore();
  const classes = [
    'gladiator-summary',
    `gladiator-summary--${tone}`,
    side ? `gladiator-summary--${side}` : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <GameCard as="article" className={classes} data-testid={testId} surface={tone}>
      {typeof odds === 'number' ? (
        <GladiatorOdds gladiatorName={gladiator.name} odds={odds} />
      ) : topRightContent ? (
        <GladiatorTopRightBadge label={topRightLabel}>{topRightContent}</GladiatorTopRightBadge>
      ) : null}
      <div className="gladiator-summary__identity">
        <GladiatorPortrait gladiator={gladiator} size="large" />
        <div className="gladiator-summary__info">
          <h2>{gladiator.name}</h2>
          <span className="gladiator-summary__pill">{t('market.age', { age: gladiator.age })}</span>
          <GladiatorTraits gladiator={gladiator} save={save} variant="compact" />
          <div className="gladiator-summary__meta">
            <span className="gladiator-summary__pill">{t(getGladiatorClassKey(gladiator))}</span>
            <span className="gladiator-summary__pill">
              {t('market.age', { age: gladiator.age })}
            </span>
          </div>
          <div className="gladiator-summary__key-stats">
            <GladiatorKeyFact
              iconName="level"
              label={t('gladiatorPanel.level')}
              value={getGladiatorLevel(gladiator)}
            />
            <GladiatorKeyFact
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
              <GladiatorKeyFact
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
          <GameMeter
            className="gladiator-summary__stat-bar"
            iconName={stat.iconName}
            key={stat.key}
            label={t(statLabelKeys?.[stat.key] ?? stat.labelKey)}
            surface={tone}
            tone={SECONDARY_GLADIATOR_STAT_TONES[stat.key]}
            value={statValues?.[stat.key] ?? 0}
          />
        ))}
      </div>
      {children ? <div className="gladiator-summary__children">{children}</div> : null}
    </GameCard>
  );
}
