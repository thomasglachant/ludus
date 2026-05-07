import './events.css';
import type { CSSProperties, ReactNode } from 'react';
import type {
  GameEvent,
  GameEventConsequence,
  GameEventEffect,
  GameEventOutcome,
  GameSave,
} from '@/domain/types';
import { getGameEventChoiceTreasuryCost } from '@/domain/events/event-actions';
import { GAME_BALANCE } from '@/game-data/balance';
import { useUiStore } from '@/state/ui-store-context';
import { ActionBar } from '@/ui/shared/ludus/ActionBar';
import { PrimaryActionButton } from '@/ui/shared/ludus/PrimaryActionButton';
import { GameNotice } from '@/ui/shared/ludus/GameFeedback';
import { ImpactIndicator, type ImpactIndicatorKind } from '@/ui/shared/components/ImpactIndicator';
import { ImpactList, type ImpactListItem } from '@/ui/shared/components/ImpactList';
import { GladiatorPortrait } from '@/ui/features/gladiators/GladiatorPortrait';
import { formatMoneyAmount } from '@/ui/shared/formatters/money';

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
    case 'setGameLost':
    case 'startDebtGrace':
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

function getTextEffectLabel(
  effect: GameEventEffect,
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  switch (effect.type) {
    case 'removeGladiator':
      return t('events.outcome.gladiatorLeaves');
    case 'releaseAllGladiators':
      return t('events.outcome.allGladiatorsReleased');
    case 'setGameLost':
      return t('events.outcome.gameLost');
    case 'startDebtGrace':
      return t('events.outcome.debtGrace', {
        days: GAME_BALANCE.economy.debtGraceDays,
      });
    default:
      return null;
  }
}

function getEventImpactNodes(
  effects: GameEventEffect[],
  t: (key: string, params?: Record<string, string | number>) => string,
  chancePercent?: number,
) {
  const impactItems = effects
    .map((effect, index) => getEventImpactItem(effect, t, chancePercent, index))
    .filter((impact): impact is ImpactListItem => Boolean(impact));
  const nodes: ReactNode[] = [];

  if (impactItems.length > 0) {
    nodes.push(<ImpactList impacts={impactItems} key="impact-list" />);
  }

  effects.forEach((effect, index) => {
    const text = getTextEffectLabel(effect, t);

    if (text) {
      nodes.push(
        <ImpactIndicator
          chancePercent={chancePercent}
          key={`${effect.type}-${index}`}
          text={text}
        />,
      );
    }
  });

  return nodes;
}

function getEventOutcomeIndicators(
  outcome: GameEventOutcome,
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  if (outcome.textKey) {
    return [
      <ImpactIndicator
        chancePercent={outcome.chancePercent}
        key="text"
        text={t(outcome.textKey)}
      />,
    ];
  }

  return getEventImpactNodes(outcome.effects ?? [], t, outcome.chancePercent);
}

function getEventOneOfConsequenceIndicators(
  consequence: Extract<GameEventConsequence, { kind: 'oneOf' }>,
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  const renderedOutcomes = consequence.outcomes
    .map((outcome) => ({
      id: outcome.id,
      nodes: getEventOutcomeIndicators(outcome, t),
    }))
    .filter((outcome) => outcome.nodes.length > 0);

  if (renderedOutcomes.length === 0) {
    return null;
  }

  return (
    <div className="events-panel__outcome-group-card">
      {renderedOutcomes.map((outcome) => (
        <div className="events-panel__outcome-option" key={outcome.id}>
          {outcome.nodes}
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
    case 'certain': {
      const nodes = getEventImpactNodes(consequence.effects, t);

      return nodes.length > 0 ? [<li key={`${keyPrefix}-effects`}>{nodes}</li>] : [];
    }
    case 'chance': {
      const nodes = getEventOutcomeIndicators(consequence, t);

      return nodes.length > 0 ? [<li key={`${keyPrefix}-chance`}>{nodes}</li>] : [];
    }
    case 'oneOf': {
      const node = getEventOneOfConsequenceIndicators(consequence, t);

      return node
        ? [
            <li className="events-panel__outcome-group" key={`${keyPrefix}-one-of`}>
              {node}
            </li>,
          ]
        : [];
    }
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
          {event.choices.map((choice) => {
            const treasuryCost = getGameEventChoiceTreasuryCost(choice);
            const canPayCost = treasuryCost <= 0 || treasuryCost <= save.ludus.treasury;
            const consequenceIndicators = choice.consequences.flatMap((consequence, index) =>
              getEventConsequenceIndicators(consequence, t, `${choice.id}-consequence-${index}`),
            );

            return (
              <article className="events-panel__choice" key={choice.id}>
                <div className="events-panel__choice-copy">
                  <h4>{t(choice.labelKey)}</h4>
                  <p>{t(choice.consequenceKey)}</p>
                </div>
                {consequenceIndicators.length > 0 && (
                  <div className="events-panel__impact">
                    <ul>{consequenceIndicators}</ul>
                  </div>
                )}
                {!canPayCost ? (
                  <GameNotice tone="warning">
                    {t('events.insufficientTreasury', {
                      amount: formatMoneyAmount(treasuryCost),
                    })}
                  </GameNotice>
                ) : null}
                <ActionBar align="center" className="events-panel__choice-actions">
                  <PrimaryActionButton
                    amountMoney={treasuryCost > 0 ? formatMoneyAmount(treasuryCost) : undefined}
                    disabled={!canPayCost}
                    onClick={() => onResolveEventChoice(event.id, choice.id)}
                  >
                    {t('events.choose')}
                  </PrimaryActionButton>
                </ActionBar>
              </article>
            );
          })}
        </div>
      </article>
    </section>
  );
}
