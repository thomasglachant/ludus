import type { CSSProperties } from 'react';
import {
  getActiveGladiatorStatusEffects,
  getRemainingStatusEffectDuration,
  getStatusEffectDefinition,
} from '../../domain/status-effects/status-effect-actions';
import type { GameSave, Gladiator, StatusEffectModifier } from '../../domain/types';
import { useUiStore } from '../../state/ui-store-context';
import { ImpactIndicator } from '../components/ImpactIndicator';
import { Tooltip } from '../components/Tooltip';
import { GameIcon, type GameIconName } from '../icons/GameIcon';

interface GladiatorStatusEffectsProps {
  gladiator: Gladiator;
  save: GameSave;
}

function getModifierTone(modifier: StatusEffectModifier): 'negative' | 'positive' {
  if (modifier.type === 'arenaCombatEligibility') {
    return modifier.value ? 'positive' : 'negative';
  }

  return modifier.value >= 1 ? 'positive' : 'negative';
}

function getModifierAmount(
  modifier: Extract<StatusEffectModifier, { type: 'trainingExperienceMultiplier' }>,
) {
  return Math.round((modifier.value - 1) * 100);
}

export function GladiatorStatusEffects({ gladiator, save }: GladiatorStatusEffectsProps) {
  const { t } = useUiStore();
  const activeEffects = getActiveGladiatorStatusEffects(save, gladiator.id);

  if (activeEffects.length === 0) {
    return null;
  }

  return (
    <div className="gladiator-status-effects" aria-label={t('statusEffects.listLabel')}>
      {activeEffects.map((effect) => {
        const definition = getStatusEffectDefinition(effect.effectId);

        if (!definition) {
          return null;
        }

        const duration = getRemainingStatusEffectDuration(effect, {
          year: save.time.year,
          week: save.time.week,
          dayOfWeek: save.time.dayOfWeek,
        });
        const label = t(definition.nameKey);
        const durationLabel = t('statusEffects.duration.remainingDays', { count: duration.days });
        const tooltipLabel = `${label}. ${durationLabel}`;

        return (
          <Tooltip
            content={
              <span className="gladiator-status-effects__tooltip">
                <strong>{label}</strong>
                <span>{t(definition.descriptionKey)}</span>
                <span className="gladiator-status-effects__tooltip-duration">{durationLabel}</span>
                <span className="gladiator-status-effects__tooltip-modifiers">
                  {definition.modifiers.map((modifier) => {
                    if (modifier.type === 'trainingExperienceMultiplier') {
                      return (
                        <ImpactIndicator
                          amount={getModifierAmount(modifier)}
                          key={modifier.type}
                          kind="xp"
                          label={t('statusEffects.modifiers.trainingExperience')}
                          size="sm"
                          tone={getModifierTone(modifier)}
                        />
                      );
                    }

                    return (
                      <ImpactIndicator
                        key={modifier.type}
                        text={t(
                          modifier.value
                            ? 'statusEffects.modifiers.arenaAllowed'
                            : 'statusEffects.modifiers.arenaBlocked',
                        )}
                      />
                    );
                  })}
                </span>
              </span>
            }
            key={effect.id}
            label={tooltipLabel}
          >
            <span
              className="gladiator-status-effects__badge"
              style={{ '--status-effect-color': definition.visual.color } as CSSProperties}
            >
              <GameIcon name={definition.visual.iconName as GameIconName} size={18} />
              <span>{t('statusEffects.duration.shortDays', { count: duration.days })}</span>
            </span>
          </Tooltip>
        );
      })}
    </div>
  );
}
