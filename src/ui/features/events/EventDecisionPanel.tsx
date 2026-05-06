import './events.css';
import type { CSSProperties } from 'react';
import type {
  GameEvent,
  GameEventConsequence,
  GameEventEffect,
  GameEventOutcome,
  GameSave,
} from '@/domain/types';
import { useUiStore } from '@/state/ui-store-context';
import { ActionBar } from '@/ui/shared/ludus/ActionBar';
import { PrimaryActionButton } from '@/ui/shared/ludus/PrimaryActionButton';
import { ImpactIndicator, type ImpactIndicatorKind } from '@/ui/shared/components/ImpactIndicator';
import { ImpactList, type ImpactListItem } from '@/ui/shared/components/ImpactList';
import { GladiatorPortrait } from '@/ui/features/gladiators/GladiatorPortrait';

interface PanelProps {
  save: GameSave;
  onClose(): void;
}

interface EventDecisionPanelProps extends PanelProps {
  event: GameEvent;
  onOpenGladiator(gladiatorId: string): void;
  onResolveEventChoice(eventId: string, choiceId: string): void;
}

function getEventImpactItem(
  effect: GameEventEffect,
  t: (key: string, params?: Record<string, string | number>) => string,
  chancePercent?: number,
  index = 0,
): ImpactListItem | undefined {
  let kind: ImpactIndicatorKind;
  let labelKey: string;

  switch (effect.type) {
    case 'changeTreasury':
      kind = 'treasury';
      labelKey = 'common.treasury';
      break;
    case 'changeLudusReputation':
      kind = 'reputation';
      labelKey = 'ludus.reputation';
      break;
    case 'changeLudusHappiness':
      kind = 'morale';
      labelKey = 'ludus.happiness';
      break;
    case 'changeLudusRebellion':
      kind = 'warning';
      labelKey = 'ludus.rebellion';
      break;
    case 'removeGladiator':
    case 'releaseAllGladiators':
    case 'applyGladiatorTrait':
      return undefined;
    case 'changeGladiatorExperience':
      kind = 'xp';
      labelKey = 'gladiatorPanel.experience';
      break;
    case 'changeGladiatorStat':
      kind = effect.stat === 'life' ? 'health' : effect.stat;
      labelKey = `events.effect.stat.${effect.stat}`;
      break;
  }

  return {
    amount: effect.amount,
    chancePercent,
    id: `${effect.type}-${index}`,
    kind,
    label: t(labelKey),
  } satisfies ImpactListItem;
}

function getEventImpactGroup(
  effects: GameEventEffect[],
  t: (key: string, params?: Record<string, string | number>) => string,
  chancePercent?: number,
) {
  const impactItems = effects
    .map((effect, index) => getEventImpactItem(effect, t, chancePercent, index))
    .filter((impact): impact is ImpactListItem => Boolean(impact));
  const textEffects = effects.filter(
    (effect) => effect.type === 'removeGladiator' || effect.type === 'releaseAllGladiators',
  );

  return (
    <>
      {impactItems.length > 0 ? <ImpactList impacts={impactItems} /> : null}
      {textEffects.map((effect, index) => (
        <ImpactIndicator
          chancePercent={chancePercent}
          key={`${effect.type}-${index}`}
          text={t(
            effect.type === 'releaseAllGladiators'
              ? 'events.outcome.allGladiatorsReleased'
              : 'events.outcome.gladiatorLeaves',
          )}
        />
      ))}
    </>
  );
}

function getEventOutcomeIndicators(
  outcome: GameEventOutcome,
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  if (outcome.textKey) {
    return <ImpactIndicator chancePercent={outcome.chancePercent} text={t(outcome.textKey)} />;
  }

  return getEventImpactGroup(outcome.effects ?? [], t, outcome.chancePercent);
}

function getEventOneOfConsequenceIndicators(
  consequence: Extract<GameEventConsequence, { kind: 'oneOf' }>,
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  return (
    <div className="events-panel__outcome-group-card">
      {consequence.outcomes.map((outcome) => (
        <div className="events-panel__outcome-option" key={outcome.id}>
          {getEventOutcomeIndicators(outcome, t)}
        </div>
      ))}
    </div>
  );
}

function getEventConsequenceIndicators(
  consequence: GameEventConsequence,
  t: (key: string, params?: Record<string, string | number>) => string,
  keyPrefix: string,
) {
  switch (consequence.kind) {
    case 'certain':
      return [<li key={`${keyPrefix}-effects`}>{getEventImpactGroup(consequence.effects, t)}</li>];
    case 'chance':
      return [<li key={`${keyPrefix}-chance`}>{getEventOutcomeIndicators(consequence, t)}</li>];
    case 'oneOf':
      return [
        <li className="events-panel__outcome-group" key={`${keyPrefix}-one-of`}>
          {getEventOneOfConsequenceIndicators(consequence, t)}
        </li>,
      ];
  }
}

export function EventDecisionPanel({
  event,
  save,
  onOpenGladiator,
  onResolveEventChoice,
}: EventDecisionPanelProps) {
  const { t } = useUiStore();
  const gladiator = save.gladiators.find((candidate) => candidate.id === event.gladiatorId);
  const choiceGridStyle = {
    '--event-choice-columns': event.choices.length,
  } as CSSProperties;

  return (
    <section className="panel-shell" data-testid="event-decision-panel">
      <article className="events-panel__event">
        <div className="events-panel__event-header">
          <div className="events-panel__heading-row">
            {gladiator ? (
              <button
                aria-label={t('roster.openGladiator', { name: gladiator.name })}
                className="events-panel__gladiator"
                type="button"
                onClick={() => onOpenGladiator(gladiator.id)}
              >
                <GladiatorPortrait gladiator={gladiator} size="medium" />
                <strong>{gladiator.name}</strong>
              </button>
            ) : null}
            <div className="events-panel__summary">
              <h3>{t(event.titleKey)}</h3>
              <p>{t(event.descriptionKey)}</p>
            </div>
          </div>
        </div>
        <div className="event-choice-grid" style={choiceGridStyle}>
          {event.choices.map((choice) => (
            <article className="events-panel__choice" key={choice.id}>
              <div className="events-panel__choice-copy">
                <h4>{t(choice.labelKey)}</h4>
                <p>{t(choice.consequenceKey)}</p>
              </div>
              <div className="events-panel__impact">
                <ul>
                  {choice.consequences.flatMap((consequence, index) =>
                    getEventConsequenceIndicators(
                      consequence,
                      t,
                      `${choice.id}-consequence-${index}`,
                    ),
                  )}
                </ul>
              </div>
              <ActionBar align="center" className="events-panel__choice-actions">
                <PrimaryActionButton onClick={() => onResolveEventChoice(event.id, choice.id)}>
                  {t('events.choose')}
                </PrimaryActionButton>
              </ActionBar>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}
