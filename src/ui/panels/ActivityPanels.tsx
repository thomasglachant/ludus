import type { CSSProperties } from 'react';
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
import { GladiatorPortrait } from '../roster/GladiatorPortrait';
import { getArenaDayViewModel } from '../arena/arena-view-model';

interface PanelProps {
  save: GameSave;
  onClose(): void;
}

interface EventsPanelProps extends PanelProps {
  onOpenGladiator(gladiatorId: string): void;
  onResolveEventChoice(eventId: string, choiceId: string): void;
}

interface ArenaPanelProps extends PanelProps {
  onOpenArenaRoute(): void;
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

export function EventsPanel({
  save,
  onClose,
  onOpenGladiator,
  onResolveEventChoice,
}: EventsPanelProps) {
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

export function ArenaPanel({ save, onClose, onOpenArenaRoute }: ArenaPanelProps) {
  const { t } = useUiStore();
  const viewModel = getArenaDayViewModel(save);

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
      <SectionCard titleKey="arena.closedTitle" testId="arena-closed-message">
        <p>{t('arena.closedBody')}</p>
        <div className="arena-closed-panel__facts">
          <span>{t('arena.closedSchedule')}</span>
        </div>
        <EmptyState messageKey={viewModel.emptyMessageKey ?? 'arena.nextSunday'} />
      </SectionCard>
    </PanelShell>
  );
}
