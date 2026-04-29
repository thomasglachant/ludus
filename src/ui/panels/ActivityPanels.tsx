import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';
import { getArenaBettingState, validateScouting } from '../../domain/combat/combat-actions';
import { getContractProgress } from '../../domain/contracts/contract-actions';
import type {
  CombatState,
  GameEventConsequence,
  GameEventEffect,
  GameEventOutcome,
  GameSave,
  WeeklyContract,
} from '../../domain/types';
import { useUiStore } from '../../state/ui-store-context';
import { CTAButton } from '../components/CTAButton';
import { ImpactIndicator, type ImpactIndicatorKind } from '../components/ImpactIndicator';
import { GameIcon } from '../icons/GameIcon';
import {
  Badge,
  EmptyState,
  LogRow,
  MetricList,
  PanelShell,
  SectionCard,
} from '../components/shared';
import { formatMoneyAmount } from '../formatters/money';
import { GladiatorClassLine } from '../roster/GladiatorClassLine';
import { GladiatorPortrait } from '../roster/GladiatorPortrait';
import { getArenaPanelViewModel } from '../view-models/arena-panel-view-model';
import { formatOdds, getWinChancePercent } from './panel-helpers';

interface PanelProps {
  save: GameSave;
  onClose(): void;
}

interface ContractsPanelProps extends PanelProps {
  onAcceptContract(contractId: string): void;
}

interface EventsPanelProps extends PanelProps {
  onResolveEventChoice(eventId: string, choiceId: string): void;
}

interface ArenaPanelProps extends PanelProps {
  onCompleteArenaDay(): void;
  onOpenCombat(combatId: string): void;
  onScoutOpponent(gladiatorId: string): void;
  onShowArenaDaySummary(): void;
  onStartArenaDayCombats(): void;
}

function getEventImpactIndicator(
  effect: GameEventEffect,
  t: (key: string, params?: Record<string, string | number>) => string,
  chancePercent?: number,
) {
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
      return (
        <ImpactIndicator chancePercent={chancePercent} text={t('events.outcome.gladiatorLeaves')} />
      );
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

  return (
    <ImpactIndicator
      amount={effect.amount}
      chancePercent={chancePercent}
      kind={kind}
      label={t(labelKey)}
    />
  );
}

function getEventOutcomeIndicators(
  outcome: GameEventOutcome,
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  if (outcome.textKey) {
    return <ImpactIndicator chancePercent={outcome.chancePercent} text={t(outcome.textKey)} />;
  }

  return (outcome.effects ?? []).map((effect, index) => (
    <span key={`outcome-effect-${index}`}>
      {getEventImpactIndicator(effect, t, outcome.chancePercent)}
    </span>
  ));
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
      return consequence.effects.map((effect, index) => (
        <li key={`${keyPrefix}-effect-${index}`}>{getEventImpactIndicator(effect, t)}</li>
      ));
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

function formatSignedValue(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

function getCombatResultKey(combat: CombatState) {
  return combat.consequence.didPlayerWin ? 'arena.result.win' : 'arena.result.loss';
}

function getCombatResultTone(combat: CombatState): 'success' | 'danger' {
  return combat.consequence.didPlayerWin ? 'success' : 'danger';
}

function getCombatTitleParams(combat: CombatState) {
  return {
    gladiator: combat.gladiator.name,
    opponent: combat.opponent.name,
  };
}

function isCurrentWeekContract(save: GameSave, contract: WeeklyContract) {
  return contract.issuedAtYear === save.time.year && contract.issuedAtWeek === save.time.week;
}

function getProjectedArenaContractRewards(save: GameSave) {
  return save.contracts.acceptedContracts
    .filter(
      (contract) =>
        contract.status === 'accepted' &&
        contract.objective.type !== 'sellGladiatorForAtLeast' &&
        isCurrentWeekContract(save, contract) &&
        getContractProgress(save, contract).isComplete,
    )
    .reduce(
      (summary, contract) => ({
        reputation: summary.reputation + (contract.rewardReputation ?? 0),
        treasury: summary.treasury + contract.rewardTreasury,
      }),
      { reputation: 0, treasury: 0 },
    );
}

export function ContractsPanel({ save, onAcceptContract, onClose }: ContractsPanelProps) {
  const { t } = useUiStore();
  const availableContracts = save.contracts.availableContracts.filter(
    (contract) => contract.status === 'available',
  );
  const acceptedContracts = save.contracts.acceptedContracts.filter(
    (contract) => contract.status === 'accepted',
  );

  return (
    <PanelShell
      eyebrowKey="contracts.eyebrow"
      titleKey="contracts.title"
      testId="contracts-panel"
      onClose={onClose}
    >
      <SectionCard titleKey="contracts.title">
        <div className="context-panel__list">
          {availableContracts.length > 0 ? (
            availableContracts.map((contract) => (
              <article key={contract.id}>
                <strong>{t(contract.titleKey)}</strong>
                <span>{t(contract.descriptionKey)}</span>
                <small>
                  {t('contracts.reward', {
                    treasury: formatMoneyAmount(contract.rewardTreasury),
                    reputation: contract.rewardReputation ?? 0,
                  })}
                </small>
                <button type="button" onClick={() => onAcceptContract(contract.id)}>
                  <span>{t('contracts.accept')}</span>
                </button>
              </article>
            ))
          ) : (
            <EmptyState messageKey="contracts.noAvailable" testId="contracts-empty-available" />
          )}
        </div>
      </SectionCard>
      <SectionCard titleKey="contracts.activeTitle">
        {acceptedContracts.length > 0 ? (
          <div className="context-panel__list">
            {acceptedContracts.map((contract) => {
              const progress = getContractProgress(save, contract);

              return (
                <article key={contract.id}>
                  <strong>{t(contract.titleKey)}</strong>
                  <span>
                    {t('contracts.progress', {
                      current: progress.current,
                      target: progress.target,
                    })}
                  </span>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState messageKey="contracts.noActive" testId="contracts-empty-active" />
        )}
      </SectionCard>
    </PanelShell>
  );
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
                  <div className="context-panel__portrait-row">
                    {gladiator ? <GladiatorPortrait gladiator={gladiator} size="small" /> : null}
                    <div className="events-panel__summary">
                      <h3>{t(event.titleKey)}</h3>
                      {gladiator ? (
                        <small>{t('events.concerns', { name: gladiator.name })}</small>
                      ) : null}
                    </div>
                  </div>
                  <p>{t(event.descriptionKey)}</p>
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

export function ArenaPanel({
  save,
  onClose,
  onCompleteArenaDay,
  onOpenCombat,
  onScoutOpponent,
  onShowArenaDaySummary,
  onStartArenaDayCombats,
}: ArenaPanelProps) {
  const { t } = useUiStore();
  const betting = getArenaBettingState(save);
  const viewModel = useMemo(() => getArenaPanelViewModel(save), [save]);
  const availableCombats = useMemo(
    () => [...viewModel.pendingCombats, ...viewModel.resolvedCombats],
    [viewModel.pendingCombats, viewModel.resolvedCombats],
  );
  const [selectedCombatId, setSelectedCombatId] = useState<string | undefined>(
    viewModel.currentCombat?.id,
  );
  const selectedCombat =
    availableCombats.find((combat) => combat.id === selectedCombatId) ?? viewModel.currentCombat;
  const [turnProgress, setTurnProgress] = useState<{ combatId?: string; count: number }>({
    combatId: undefined,
    count: 1,
  });
  const visibleTurnCount = turnProgress.combatId === selectedCombat?.id ? turnProgress.count : 1;
  const visibleTurns = selectedCombat?.turns.slice(0, visibleTurnCount) ?? [];
  const isLogComplete = selectedCombat ? visibleTurnCount >= selectedCombat.turns.length : true;
  const arenaDay = save.arena.arenaDay;
  const presentedCombatIds = new Set(arenaDay?.presentedCombatIds ?? []);
  const unpresentedCombats = viewModel.resolvedCombats.filter(
    (combat) => !presentedCombatIds.has(combat.id),
  );
  const contractRewards = getProjectedArenaContractRewards(save);
  const totalTreasuryReward = viewModel.summary.totalReward + contractRewards.treasury;
  const totalReputationReward = viewModel.summary.reputationChange + contractRewards.reputation;

  if (arenaDay) {
    return (
      <PanelShell
        eyebrowKey="arena.eyebrow"
        titleKey="arena.title"
        testId="arena-panel"
        wide
        onClose={onClose}
      >
        <div className="arena-panel__header">
          <Badge label={t('arenaDay.locked')} tone="warning" />
          <Badge
            label={t('arena.combatProgress', {
              resolved: presentedCombatIds.size,
              total: viewModel.resolvedCombats.length,
            })}
          />
        </div>
        {arenaDay.phase === 'intro' ? (
          <SectionCard titleKey="arenaDay.introTitle" testId="arena-day-intro">
            <p>{t('arenaDay.introBody')}</p>
            <MetricList
              columns={3}
              items={[
                {
                  labelKey: 'arenaDay.scheduledCombats',
                  value: viewModel.resolvedCombats.length,
                },
                {
                  labelKey: 'arenaDay.eligibleGladiators',
                  value: viewModel.resolvedCombats.length,
                },
                {
                  labelKey: 'arenaDay.nextStep',
                  value: t('arenaDay.nextStepCombats'),
                },
              ]}
            />
            <div className="context-panel__actions">
              <button type="button" onClick={onStartArenaDayCombats}>
                <GameIcon name="combatStrike" size={17} />
                <span>{t('arenaDay.startCombats')}</span>
              </button>
            </div>
          </SectionCard>
        ) : null}
        {arenaDay.phase === 'combats' ? (
          <>
            <SectionCard titleKey="arenaDay.combatQueue" testId="arena-day-combat-queue">
              {viewModel.resolvedCombats.length > 0 ? (
                <div className="combat-selector">
                  {viewModel.resolvedCombats.map((combat) => {
                    const isPresented = presentedCombatIds.has(combat.id);

                    return (
                      <button
                        className={selectedCombat?.id === combat.id ? 'is-selected' : ''}
                        key={combat.id}
                        type="button"
                        onClick={() => {
                          setSelectedCombatId(combat.id);
                          setTurnProgress({ combatId: combat.id, count: 1 });
                        }}
                      >
                        <span>{t(`arena.ranks.${combat.rank}`)}</span>
                        <strong>{combat.gladiator.name}</strong>
                        <GladiatorClassLine compact gladiator={combat.gladiator} />
                        <Badge
                          label={t(isPresented ? 'arenaDay.combatSeen' : 'arenaDay.combatReady')}
                          tone={isPresented ? 'success' : 'warning'}
                        />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <EmptyState messageKey="arena.noEligible" />
              )}
            </SectionCard>
            {selectedCombat ? (
              <SectionCard titleKey="arena.currentCombat" testId="arena-day-current-combat">
                <div className="context-panel__portrait-row">
                  <GladiatorPortrait gladiator={selectedCombat.gladiator} size="small" />
                  <div>
                    <strong>{t('arena.combatTitle', getCombatTitleParams(selectedCombat))}</strong>
                    <GladiatorClassLine compact gladiator={selectedCombat.gladiator} />
                    <span>{t('arenaDay.presentationHint')}</span>
                  </div>
                  <GameIcon name="combatStrike" size={20} />
                </div>
                <div className="context-panel__actions">
                  <button
                    data-testid="arena-open-combat-presentation"
                    type="button"
                    onClick={() => onOpenCombat(selectedCombat.id)}
                  >
                    <GameIcon name="combatStrike" size={17} />
                    <span>{t('arenaDay.openSelectedCombat')}</span>
                  </button>
                </div>
              </SectionCard>
            ) : null}
            {unpresentedCombats.length === 0 ? (
              <div className="context-panel__actions">
                <button type="button" onClick={onShowArenaDaySummary}>
                  <span>{t('arenaDay.showSummary')}</span>
                </button>
              </div>
            ) : null}
          </>
        ) : null}
        {arenaDay.phase === 'summary' ? (
          <SectionCard titleKey="arenaDay.summaryTitle" testId="arena-day-summary">
            <MetricList
              columns={3}
              items={[
                {
                  labelKey: 'arena.summaryRecord',
                  value: t('arena.summaryRecordValue', {
                    wins: viewModel.summary.wins,
                    losses: viewModel.summary.losses,
                  }),
                },
                {
                  labelKey: 'arenaDay.arenaTreasuryReward',
                  value: formatMoneyAmount(viewModel.summary.totalReward),
                },
                {
                  labelKey: 'arenaDay.contractTreasuryReward',
                  value: formatMoneyAmount(contractRewards.treasury),
                },
                {
                  labelKey: 'arenaDay.totalTreasuryReward',
                  value: formatMoneyAmount(totalTreasuryReward),
                },
                {
                  labelKey: 'arenaDay.arenaReputationReward',
                  value: formatSignedValue(viewModel.summary.reputationChange),
                },
                {
                  labelKey: 'arenaDay.contractReputationReward',
                  value: formatSignedValue(contractRewards.reputation),
                },
                {
                  labelKey: 'arenaDay.totalReputationReward',
                  value: formatSignedValue(totalReputationReward),
                },
                {
                  labelKey: 'arena.healthChange',
                  value: formatSignedValue(viewModel.summary.healthChange),
                },
                {
                  labelKey: 'arena.energyChange',
                  value: formatSignedValue(viewModel.summary.energyChange),
                },
              ]}
            />
            <div className="context-panel__actions">
              <button type="button" onClick={onCompleteArenaDay}>
                <span>{t('arenaDay.finishDay')}</span>
              </button>
            </div>
          </SectionCard>
        ) : null}
      </PanelShell>
    );
  }

  if (viewModel.resolvedCombats.length > 0 || viewModel.pendingCombats.length > 0) {
    return (
      <PanelShell
        eyebrowKey="arena.eyebrow"
        titleKey="arena.title"
        testId="arena-panel"
        wide
        onClose={onClose}
      >
        <div className="arena-panel__header">
          <Badge
            label={t(viewModel.statusKey)}
            tone={viewModel.isArenaDayActive ? 'success' : 'neutral'}
          />
          <Badge
            label={t('arena.combatProgress', {
              resolved: viewModel.resolvedCombats.length,
              total: availableCombats.length,
            })}
          />
        </div>
        <SectionCard titleKey="arena.summary" testId="arena-summary">
          <MetricList
            columns={3}
            items={[
              {
                labelKey: 'arena.summaryReward',
                value: formatMoneyAmount(viewModel.summary.totalReward),
              },
              {
                labelKey: 'arena.summaryReputation',
                value: formatSignedValue(viewModel.summary.reputationChange),
              },
              {
                labelKey: 'arena.summaryRecord',
                value: t('arena.summaryRecordValue', {
                  wins: viewModel.summary.wins,
                  losses: viewModel.summary.losses,
                }),
              },
              {
                labelKey: 'arena.healthChange',
                value: formatSignedValue(viewModel.summary.healthChange),
              },
              {
                labelKey: 'arena.energyChange',
                value: formatSignedValue(viewModel.summary.energyChange),
              },
              {
                labelKey: 'arena.moraleChange',
                value: formatSignedValue(viewModel.summary.moraleChange),
              },
            ]}
          />
        </SectionCard>
        <SectionCard titleKey="arena.pendingCombats">
          {viewModel.pendingCombats.length > 0 ? (
            <div className="combat-selector">
              {viewModel.pendingCombats.map((combat) => (
                <button
                  className={selectedCombat?.id === combat.id ? 'is-selected' : ''}
                  key={combat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCombatId(combat.id);
                    setTurnProgress({ combatId: combat.id, count: 1 });
                  }}
                >
                  <span>{t(`arena.ranks.${combat.rank}`)}</span>
                  <strong>{combat.gladiator.name}</strong>
                  <GladiatorClassLine compact gladiator={combat.gladiator} />
                </button>
              ))}
            </div>
          ) : (
            <EmptyState messageKey="arena.noPendingCombats" />
          )}
        </SectionCard>
        <SectionCard titleKey="arena.combatList">
          {viewModel.resolvedCombats.length > 0 ? (
            <div className="combat-selector">
              {viewModel.resolvedCombats.map((combat) => (
                <button
                  className={selectedCombat?.id === combat.id ? 'is-selected' : ''}
                  key={combat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCombatId(combat.id);
                    setTurnProgress({ combatId: combat.id, count: 1 });
                  }}
                >
                  <span>{t(`arena.ranks.${combat.rank}`)}</span>
                  <strong>{combat.gladiator.name}</strong>
                  <GladiatorClassLine compact gladiator={combat.gladiator} />
                  <Badge label={t(getCombatResultKey(combat))} tone={getCombatResultTone(combat)} />
                </button>
              ))}
            </div>
          ) : (
            <EmptyState messageKey="arena.noResolvedCombats" />
          )}
        </SectionCard>
        {selectedCombat ? (
          <SectionCard titleKey="arena.currentCombat" testId="arena-current-combat">
            <div className="context-panel__portrait-row">
              <GladiatorPortrait gladiator={selectedCombat.gladiator} size="small" />
              <div>
                <strong>{t('arena.combatTitle', getCombatTitleParams(selectedCombat))}</strong>
                <GladiatorClassLine compact gladiator={selectedCombat.gladiator} />
                <span>
                  {t('arena.winnerLine', {
                    winner:
                      selectedCombat.winnerId === selectedCombat.gladiator.id
                        ? selectedCombat.gladiator.name
                        : selectedCombat.opponent.name,
                  })}
                </span>
              </div>
              <GameIcon name="combatStrike" size={20} />
            </div>
            <MetricList
              columns={3}
              items={[
                { labelKey: 'arena.rank', value: t(`arena.ranks.${selectedCombat.rank}`) },
                {
                  labelKey: 'arena.strategy',
                  value: t(`combat.strategies.${selectedCombat.strategy}`),
                },
                {
                  labelKey: 'arena.rewardReceived',
                  value: formatMoneyAmount(selectedCombat.consequence.playerReward),
                },
                {
                  labelKey: 'arena.healthChange',
                  value: formatSignedValue(selectedCombat.consequence.healthChange),
                },
                {
                  labelKey: 'arena.energyChange',
                  value: formatSignedValue(selectedCombat.consequence.energyChange),
                },
                {
                  labelKey: 'arena.reputationChange',
                  value: formatSignedValue(selectedCombat.consequence.reputationChange),
                },
              ]}
            />
            <div className="context-panel__actions">
              <button
                data-testid="arena-open-combat-presentation"
                type="button"
                onClick={() => onOpenCombat(selectedCombat.id)}
              >
                <GameIcon name="combatStrike" size={17} />
                <span>{t('arena.openCombatPresentation')}</span>
              </button>
            </div>
          </SectionCard>
        ) : null}
        {selectedCombat ? (
          <SectionCard titleKey="arena.combatLog" testId="arena-combat-log">
            <div className="combat-log-panel__header">
              <span>
                {t('arena.turnsVisible', {
                  visible: visibleTurns.length,
                  total: selectedCombat.turns.length,
                })}
              </span>
            </div>
            {visibleTurns.length > 0 ? (
              <ul className="combat-log">
                {visibleTurns.map((turn) => (
                  <LogRow
                    key={turn.turnNumber}
                    label={t('arena.turnNumber', { turn: turn.turnNumber })}
                    meta={t('arena.turnHealth', {
                      attackerHealth: turn.attackerHealthAfterTurn,
                      defenderHealth: turn.defenderHealthAfterTurn,
                    })}
                  >
                    {t(turn.logKey, turn.logParams)}
                  </LogRow>
                ))}
              </ul>
            ) : (
              <EmptyState messageKey="arena.noCombatLog" />
            )}
            <div className="combat-log-panel__actions">
              <button
                disabled={isLogComplete}
                type="button"
                onClick={() =>
                  setTurnProgress({
                    combatId: selectedCombat.id,
                    count: visibleTurnCount + 1,
                  })
                }
              >
                {isLogComplete ? t('arena.logComplete') : t('arena.nextTurn')}
              </button>
            </div>
          </SectionCard>
        ) : null}
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
        <div className="context-panel__list">
          {betting.odds.map((odds) => {
            const gladiator = save.gladiators.find(
              (candidate) => candidate.id === odds.gladiatorId,
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
                    {gladiator ? <GladiatorClassLine compact gladiator={gladiator} /> : null}
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
      ) : (
        <EmptyState messageKey={viewModel.emptyMessageKey ?? 'arena.nextSunday'} />
      )}
    </PanelShell>
  );
}
