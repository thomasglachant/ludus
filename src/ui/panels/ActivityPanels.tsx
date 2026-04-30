import type { CSSProperties } from 'react';
import { getArenaBettingState, validateScouting } from '../../domain/combat/combat-actions';
import type {
  GameEventConsequence,
  GameEventEffect,
  GameEventOutcome,
  GameSave,
} from '../../domain/types';
import { useUiStore } from '../../state/ui-store-context';
import { CTAButton } from '../components/CTAButton';
import { ImpactIndicator, type ImpactIndicatorKind } from '../components/ImpactIndicator';
import { ImpactList, type ImpactListItem } from '../components/ImpactList';
import { GameIcon } from '../icons/GameIcon';
import { Badge, EmptyState, PanelShell, SectionCard } from '../components/shared';
import { formatMoneyAmount } from '../formatters/money';
import { formatNumber } from '../formatters/number';
import { GladiatorPortrait } from '../roster/GladiatorPortrait';
import { getArenaDayViewModel } from '../arena/arena-view-model';

interface PanelProps {
  save: GameSave;
  onClose(): void;
}

interface EventsPanelProps extends PanelProps {
  onResolveEventChoice(eventId: string, choiceId: string): void;
}

interface ArenaPanelProps extends PanelProps {
  onOpenArenaRoute(): void;
  onScoutOpponent(gladiatorId: string): void;
}

function formatOdds(odds: number) {
  return odds.toFixed(2);
}

function getWinChancePercent(chance: number) {
  return Math.round(chance * 100);
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
    case 'removeGladiator':
      return undefined;
    case 'changeGladiatorHealth':
      kind = 'health';
      labelKey = 'roster.healthShort';
      break;
    case 'changeGladiatorEnergy':
      kind = 'energy';
      labelKey = 'roster.energyShort';
      break;
    case 'changeGladiatorMorale':
      kind = 'morale';
      labelKey = 'roster.moraleShort';
      break;
    case 'changeGladiatorSatiety':
      kind = 'satiety';
      labelKey = 'roster.satietyShort';
      break;
    case 'changeGladiatorStat':
      kind = effect.stat;
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
  const textEffects = effects.filter((effect) => effect.type === 'removeGladiator');

  return (
    <>
      {impactItems.length > 0 ? <ImpactList impacts={impactItems} /> : null}
      {textEffects.map((effect, index) => (
        <ImpactIndicator
          chancePercent={chancePercent}
          key={`${effect.type}-${index}`}
          text={t('events.outcome.gladiatorLeaves')}
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

export function EventsPanel({ save, onClose, onResolveEventChoice }: EventsPanelProps) {
  const { t } = useUiStore();

  return (
    <PanelShell
      eyebrowKey="events.eyebrow"
      titleKey="events.title"
      testId="events-panel"
      onClose={onClose}
    >
      {save.events.pendingEvents.length > 0 ? (
        <div className="events-panel__list">
          {save.events.pendingEvents.map((event) => {
            const gladiator = save.gladiators.find(
              (candidate) => candidate.id === event.gladiatorId,
            );
            const choiceGridStyle = {
              '--event-choice-columns': event.choices.length,
            } as CSSProperties;

            return (
              <article className="events-panel__event" key={event.id}>
                <div className="events-panel__event-header">
                  <div className="events-panel__heading-row">
                    {gladiator ? (
                      <div className="events-panel__gladiator" aria-label={gladiator.name}>
                        <GladiatorPortrait gladiator={gladiator} size="medium" />
                        <strong>{gladiator.name}</strong>
                      </div>
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
                      <CTAButton onClick={() => onResolveEventChoice(event.id, choice.id)}>
                        {t('events.choose')}
                      </CTAButton>
                    </article>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState messageKey="events.noPending" testId="events-empty-pending" />
      )}
    </PanelShell>
  );
}

export function ArenaPanel({ save, onClose, onOpenArenaRoute, onScoutOpponent }: ArenaPanelProps) {
  const { t } = useUiStore();
  const viewModel = getArenaDayViewModel(save);
  const betting = getArenaBettingState(save);

  if (save.arena.arenaDay) {
    return (
      <PanelShell
        eyebrowKey="arena.eyebrow"
        titleKey="arena.title"
        testId="arena-panel"
        wide
        onClose={onClose}
      >
        <SectionCard titleKey="arenaRoute.redirectTitle" testId="arena-route-link">
          <p>{t('arenaRoute.redirectBody')}</p>
          <div className="context-panel__actions">
            <button type="button" onClick={onOpenArenaRoute}>
              <GameIcon name="landmark" size={17} />
              <span>{t('arenaRoute.enterArena')}</span>
            </button>
          </div>
        </SectionCard>
      </PanelShell>
    );
  }

  return (
    <PanelShell
      eyebrowKey="arena.eyebrow"
      titleKey="arena.title"
      testId="arena-panel"
      wide
      onClose={onClose}
    >
      <Badge
        label={t(viewModel.statusKey)}
        tone={viewModel.isArenaDayActive ? 'success' : 'neutral'}
      />
      {betting.odds.length > 0 ? (
        <SectionCard titleKey="betting.title" testId="arena-betting-odds">
          <Badge label={t(betting.areBetsLocked ? 'betting.locked' : 'betting.open')} />
          <div className="context-panel__list">
            {betting.odds.map((odds) => {
              const gladiator = save.gladiators.find(
                (candidate) => candidate.id === odds.gladiatorId,
              );
              const scoutingReport = betting.scoutingReports.find(
                (report) => report.gladiatorId === odds.gladiatorId,
              );
              const validation = validateScouting(save, odds.gladiatorId);

              return (
                <article key={odds.id}>
                  <div className="context-panel__portrait-row">
                    {gladiator ? <GladiatorPortrait gladiator={gladiator} size="small" /> : null}
                    <div>
                      <strong>
                        {gladiator
                          ? t('arena.combatTitle', {
                              gladiator: gladiator.name,
                              opponent: odds.opponent.name,
                            })
                          : odds.opponent.name}
                      </strong>
                      <span>
                        {t('betting.winChanceValue', {
                          chance: getWinChancePercent(odds.playerWinChance),
                        })}
                      </span>
                    </div>
                  </div>
                  <dl className="compact-stat-list">
                    <div>
                      <dt>{t('betting.playerOdds')}</dt>
                      <dd>{formatOdds(odds.playerDecimalOdds)}</dd>
                    </div>
                    <div>
                      <dt>{t('betting.opponentOdds')}</dt>
                      <dd>{formatOdds(odds.opponentDecimalOdds)}</dd>
                    </div>
                  </dl>
                  {scoutingReport ? (
                    <dl className="compact-stat-list">
                      <div>
                        <dt>{t('market.stats.strength')}</dt>
                        <dd>{formatNumber(scoutingReport.opponentStrength)}</dd>
                      </div>
                      <div>
                        <dt>{t('market.stats.agility')}</dt>
                        <dd>{formatNumber(scoutingReport.opponentAgility)}</dd>
                      </div>
                      <div>
                        <dt>{t('market.stats.defense')}</dt>
                        <dd>{formatNumber(scoutingReport.opponentDefense)}</dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="context-panel__muted">{t('betting.scoutingHidden')}</p>
                  )}
                  <button
                    disabled={!validation.isAllowed || odds.isScouted}
                    type="button"
                    onClick={() => onScoutOpponent(odds.gladiatorId)}
                  >
                    <GameIcon name="view" size={17} />
                    <span>
                      {odds.isScouted
                        ? t('betting.scouted')
                        : t('betting.scout', { cost: formatMoneyAmount(validation.cost) })}
                    </span>
                  </button>
                </article>
              );
            })}
          </div>
        </SectionCard>
      ) : (
        <SectionCard titleKey="arena.closedTitle" testId="arena-closed-message">
          <p>{t('arena.closedBody')}</p>
          <div className="arena-closed-panel__facts">
            <span>{t('arena.closedSchedule')}</span>
          </div>
          <EmptyState messageKey={viewModel.emptyMessageKey ?? 'arena.nextSunday'} />
        </SectionCard>
      )}
    </PanelShell>
  );
}
