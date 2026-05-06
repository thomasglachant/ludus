import './gladiators.css';
import type { CSSProperties } from 'react';
import {
  getActiveGladiatorTraitsFromGladiator,
  getGladiatorTraitDefinition,
  getPermanentGladiatorTraits,
  getRemainingGladiatorTraitDuration,
  getTemporaryGladiatorTraits,
} from '@/domain/gladiator-traits/gladiator-trait-actions';
import type { GameSave, Gladiator, GladiatorTrait, GladiatorTraitModifier } from '@/domain/types';
import { useUiStore } from '@/state/ui-store-context';
import { formatSignedNumber } from '@/ui/shared/formatters/number';
import { InfoHoverCard } from '@/ui/shared/components/InfoHoverCard';
import { GameIcon, type GameIconName } from '@/ui/shared/icons/GameIcon';

interface GladiatorTraitsProps {
  gladiator: Gladiator;
  save: GameSave;
  variant?: 'compact' | 'stacked';
}

function getCurrentDate(save: GameSave) {
  return {
    year: save.time.year,
    week: save.time.week,
    dayOfWeek: save.time.dayOfWeek,
  };
}

function getMultiplierAmount(value: number) {
  return Math.round((value - 1) * 100);
}

type NumericGladiatorTraitModifier = Extract<GladiatorTraitModifier, { value: number }>;
type NumericGladiatorTraitModifierType = NumericGladiatorTraitModifier['type'];

interface NumericModifierPresentation {
  amountKind: 'additive' | 'multiplierPercent';
  kind: GameIconName;
  labelKey: string;
  toneDirection?: 'higherIsBetter' | 'lowerIsBetter';
}

const NUMERIC_MODIFIER_PRESENTATIONS = {
  arenaRewardMultiplier: {
    amountKind: 'multiplierPercent',
    kind: 'treasury',
    labelKey: 'traits.modifiers.arenaReward',
  },
  combatEnergyBonus: {
    amountKind: 'additive',
    kind: 'energy',
    labelKey: 'traits.modifiers.combatEnergy',
  },
  combatExperienceMultiplier: {
    amountKind: 'multiplierPercent',
    kind: 'xp',
    labelKey: 'traits.modifiers.combatExperience',
  },
  combatMoraleBonus: {
    amountKind: 'additive',
    kind: 'morale',
    labelKey: 'traits.modifiers.combatMorale',
  },
  injuryRiskMultiplier: {
    amountKind: 'multiplierPercent',
    kind: 'injuryRisk',
    labelKey: 'traits.modifiers.injuryRisk',
    toneDirection: 'lowerIsBetter',
  },
  trainingExperienceMultiplier: {
    amountKind: 'multiplierPercent',
    kind: 'xp',
    labelKey: 'traits.modifiers.trainingExperience',
  },
} satisfies Record<NumericGladiatorTraitModifierType, NumericModifierPresentation>;

function getNumericModifierAmount(
  modifier: NumericGladiatorTraitModifier,
  presentation: NumericModifierPresentation,
) {
  return presentation.amountKind === 'multiplierPercent'
    ? getMultiplierAmount(modifier.value)
    : modifier.value;
}

function getNumericModifierTone(
  amount: number,
  presentation: NumericModifierPresentation,
): 'negative' | 'positive' {
  const toneDirection = presentation.toneDirection ?? 'higherIsBetter';
  const isPositive = toneDirection === 'higherIsBetter' ? amount >= 0 : amount <= 0;

  return isPositive ? 'positive' : 'negative';
}

function getModifierIndicator(
  modifier: GladiatorTraitModifier,
  t: ReturnType<typeof useUiStore>['t'],
  key: string,
) {
  if (modifier.type === 'arenaCombatEligibility' || modifier.type === 'activityEligibility') {
    const labelKey =
      modifier.type === 'arenaCombatEligibility'
        ? modifier.value
          ? 'traits.modifiers.arenaAllowed'
          : 'traits.modifiers.arenaBlocked'
        : modifier.value
          ? 'traits.modifiers.activityAllowed'
          : 'traits.modifiers.activityBlocked';

    return (
      <span
        className={[
          'gladiator-traits__modifier',
          modifier.value
            ? 'gladiator-traits__modifier--positive'
            : 'gladiator-traits__modifier--negative',
        ].join(' ')}
        key={key}
      >
        <GameIcon name={modifier.value ? 'victory' : 'warning'} size={15} />
        <span>{t(labelKey)}</span>
      </span>
    );
  }

  const presentation = NUMERIC_MODIFIER_PRESENTATIONS[modifier.type];
  const amount = getNumericModifierAmount(modifier, presentation);
  const suffix = presentation.amountKind === 'multiplierPercent' ? '%' : '';
  const tone = getNumericModifierTone(amount, presentation);

  return (
    <span
      className={['gladiator-traits__modifier', `gladiator-traits__modifier--${tone}`].join(' ')}
      key={key}
    >
      <GameIcon name={presentation.kind} size={15} />
      <span>{t(presentation.labelKey)}</span>
      <strong>
        {formatSignedNumber(amount)}
        {suffix}
      </strong>
    </span>
  );
}

function TraitBadge({
  date,
  trait,
}: {
  date: ReturnType<typeof getCurrentDate>;
  trait: GladiatorTrait;
}) {
  const { t } = useUiStore();
  const definition = getGladiatorTraitDefinition(trait.traitId);

  if (!definition) {
    return null;
  }

  const duration = getRemainingGladiatorTraitDuration(trait, date);
  const label = t(definition.nameKey);
  const durationLabel = duration
    ? t('traits.duration.remainingDays', { count: duration.days })
    : null;
  const badge = (
    <button
      className="gladiator-traits__badge"
      style={{ '--gladiator-trait-color': definition.visual.color } as CSSProperties}
      type="button"
    >
      <GameIcon name={definition.visual.iconName as GameIconName} size={16} />
      <span>{label}</span>
      {duration ? <small>{t('traits.duration.shortDays', { count: duration.days })}</small> : null}
    </button>
  );

  return (
    <InfoHoverCard title={label} trigger={badge}>
      <span className="gladiator-traits__details">
        <span>{t(definition.descriptionKey)}</span>
        {definition.modifiers.length > 0 ? (
          <span className="gladiator-traits__details-modifiers">
            {definition.modifiers.map((modifier, index) =>
              getModifierIndicator(modifier, t, `${modifier.type}-${index}`),
            )}
          </span>
        ) : null}
        {durationLabel ? (
          <span className="gladiator-traits__details-duration">{durationLabel}</span>
        ) : null}
      </span>
    </InfoHoverCard>
  );
}

function TraitRow({
  className,
  date,
  traits,
}: {
  className: string;
  date: ReturnType<typeof getCurrentDate>;
  traits: GladiatorTrait[];
}) {
  if (traits.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {traits.map((trait) => (
        <TraitBadge date={date} key={trait.traitId} trait={trait} />
      ))}
    </div>
  );
}

export function GladiatorTraits({ gladiator, save, variant = 'stacked' }: GladiatorTraitsProps) {
  const { t } = useUiStore();
  const date = getCurrentDate(save);
  const displayedGladiator =
    save.gladiators.find((candidate) => candidate.id === gladiator.id) ?? gladiator;
  const activeTraits = getActiveGladiatorTraitsFromGladiator(displayedGladiator, date);
  const permanentTraits = getPermanentGladiatorTraits(
    { ...displayedGladiator, traits: activeTraits },
    date,
  );
  const temporaryTraits = getTemporaryGladiatorTraits(
    { ...displayedGladiator, traits: activeTraits },
    date,
  );

  if (activeTraits.length === 0) {
    return null;
  }

  return (
    <div
      className={['gladiator-traits', `gladiator-traits--${variant}`].join(' ')}
      aria-label={t('traits.listLabel')}
    >
      <TraitRow
        className="gladiator-traits__row gladiator-traits__row--permanent"
        date={date}
        traits={permanentTraits}
      />
      <TraitRow
        className="gladiator-traits__row gladiator-traits__row--temporary"
        date={date}
        traits={temporaryTraits}
      />
    </div>
  );
}
