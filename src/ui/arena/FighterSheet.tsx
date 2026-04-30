import { calculateDecimalOdds } from '../../domain/combat/combat-actions';
import type { Gladiator } from '../../domain/types';
import { useUiStore } from '../../state/ui-store-context';
import { CardBlured } from '../components/CardBlured';
import { IconValueStat } from '../components/IconValueStat';
import { PercentageStatBar } from '../components/PercentageStatBar';
import { Tooltip } from '../components/Tooltip';
import { GameIcon, type GameIconName } from '../icons/GameIcon';
import { GladiatorPortrait } from '../roster/GladiatorPortrait';

interface FighterSheetProps {
  chance: number;
  gladiator: Gladiator;
  side: 'player' | 'opponent';
  statLabelKeys?: Partial<Record<SecondaryFighterStatKey, string>>;
  statValues?: Partial<Record<SecondaryFighterStatKey, number>>;
}

const PRIMARY_FIGHTER_STATS: Array<{
  iconName: GameIconName;
  key: keyof Gladiator;
  labelKey: string;
}> = [
  { iconName: 'strength', key: 'strength', labelKey: 'arenaRoute.statStrength' },
  { iconName: 'agility', key: 'agility', labelKey: 'arenaRoute.statAgility' },
  { iconName: 'defense', key: 'defense', labelKey: 'arenaRoute.statDefense' },
];

type SecondaryFighterStatKey = 'energy' | 'health' | 'morale';

const SECONDARY_FIGHTER_STATS: Array<{
  iconName: Extract<GameIconName, 'energy' | 'health' | 'morale'>;
  key: SecondaryFighterStatKey;
  labelKey: string;
}> = [
  { iconName: 'health', key: 'health', labelKey: 'arenaRoute.statHealth' },
  { iconName: 'energy', key: 'energy', labelKey: 'arenaRoute.statEnergy' },
  { iconName: 'morale', key: 'morale', labelKey: 'arenaRoute.statMorale' },
];

const SECONDARY_FIGHTER_STAT_TONES = {
  energy: 'energy',
  health: 'health',
  morale: 'morale',
} as const;

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatOdds(value: number) {
  return value.toFixed(2);
}

function FighterOdds({ chance, fighterName }: { chance: number; fighterName: string }) {
  const { t } = useUiStore();
  const odds = formatOdds(calculateDecimalOdds(chance));
  const percent = formatPercent(chance);
  const label = t('arenaRoute.fighterOddsLabel', { chance: percent, fighter: fighterName, odds });

  return (
    <div aria-label={label} className="arena-route-fighter-odds">
      <Tooltip content={percent}>
        <strong>{odds}</strong>
      </Tooltip>
    </div>
  );
}

export function FighterSheet({
  chance,
  gladiator,
  side,
  statLabelKeys,
  statValues,
}: FighterSheetProps) {
  const { t } = useUiStore();
  const primaryTrait = gladiator.traits[0];

  return (
    <CardBlured as="article" className={`arena-route-fighter arena-route-fighter--${side}`}>
      <FighterOdds chance={chance} fighterName={gladiator.name} />
      <div className="arena-route-fighter__identity">
        <GladiatorPortrait gladiator={gladiator} size="large" />
        <div className="arena-route-fighter__info">
          <h2>{gladiator.name}</h2>
          <div className="arena-route-fighter__meta">
            <span className="arena-route-fighter__record">
              <GameIcon name="victory" size={15} />
              <span>
                {t('arenaRoute.record', { wins: gladiator.wins, losses: gladiator.losses })}
              </span>
            </span>
            {primaryTrait ? (
              <span className="arena-route-fighter__trait">{t(`traits.${primaryTrait}`)}</span>
            ) : null}
          </div>
          <div className="arena-route-fighter__key-stats">
            <IconValueStat
              iconName="reputation"
              label={t('gladiatorPanel.reputation')}
              value={Math.round(gladiator.reputation)}
            />
            {PRIMARY_FIGHTER_STATS.map((stat) => (
              <IconValueStat
                iconName={stat.iconName}
                key={stat.key}
                label={t(stat.labelKey)}
                value={Math.round(Number(gladiator[stat.key]))}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="arena-route-fighter__stats">
        {SECONDARY_FIGHTER_STATS.map((stat) => (
          <PercentageStatBar
            className="arena-route-fighter__stat-bar"
            iconName={stat.iconName}
            key={stat.key}
            label={t(statLabelKeys?.[stat.key] ?? stat.labelKey)}
            tone={SECONDARY_FIGHTER_STAT_TONES[stat.key]}
            value={statValues?.[stat.key] ?? Number(gladiator[stat.key])}
          />
        ))}
      </div>
    </CardBlured>
  );
}
