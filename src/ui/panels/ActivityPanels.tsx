import { useMemo, useState } from 'react';
import { ArrowRight, Eye, Swords } from 'lucide-react';
import { getArenaBettingState, validateScouting } from '../../domain/combat/combat-actions';
import { getContractProgress } from '../../domain/contracts/contract-actions';
import type { CombatState, GameSave } from '../../domain/types';
import { useUiStore } from '../../state/ui-store';
import {
  Badge,
  EmptyState,
  LogRow,
  MetricList,
  PanelShell,
  SectionCard,
} from '../components/shared';
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
  onOpenCombat(combatId: string): void;
  onScoutOpponent(gladiatorId: string): void;
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
                    treasury: contract.rewardTreasury,
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
        <SectionCard titleKey="events.title">
          <div className="context-panel__list">
            {save.events.pendingEvents.map((event) => {
              const gladiator = save.gladiators.find(
                (candidate) => candidate.id === event.gladiatorId,
              );

              return (
                <article key={event.id}>
                  <div className="context-panel__portrait-row">
                    {gladiator ? <GladiatorPortrait gladiator={gladiator} size="small" /> : null}
                    <div>
                      <strong>{t(event.titleKey)}</strong>
                      <span>{t(event.descriptionKey)}</span>
                    </div>
                  </div>
                  <div className="event-choice-grid">
                    {event.choices.map((choice) => (
                      <button
                        key={choice.id}
                        type="button"
                        onClick={() => onResolveEventChoice(event.id, choice.id)}
                      >
                        {t(choice.labelKey)}
                      </button>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </SectionCard>
      ) : (
        <EmptyState messageKey="events.noPending" testId="events-empty-pending" />
      )}
    </PanelShell>
  );
}

export function MarketPreviewPanel({ save, onClose }: PanelProps) {
  const { navigate, t } = useUiStore();

  return (
    <PanelShell
      eyebrowKey="market.eyebrow"
      titleKey="market.title"
      testId="market-preview-panel"
      onClose={onClose}
    >
      <SectionCard titleKey="market.availableGladiators">
        <div className="context-panel__list">
          {save.market.availableGladiators.length > 0 ? (
            save.market.availableGladiators.slice(0, 4).map((candidate) => (
              <article className="context-panel__portrait-row" key={candidate.id}>
                <GladiatorPortrait gladiator={candidate} size="small" />
                <div>
                  <strong>{candidate.name}</strong>
                  <span>{t('market.price', { price: candidate.price })}</span>
                </div>
              </article>
            ))
          ) : (
            <EmptyState messageKey="market.noCandidates" testId="market-preview-empty" />
          )}
        </div>
      </SectionCard>
      <div className="context-panel__actions">
        <button data-testid="market-preview-open" type="button" onClick={() => navigate('market')}>
          <span>{t('common.open')}</span>
          <ArrowRight aria-hidden="true" size={17} />
        </button>
      </div>
    </PanelShell>
  );
}

export function ArenaPanel({ save, onClose, onOpenCombat, onScoutOpponent }: ArenaPanelProps) {
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
              { labelKey: 'arena.summaryReward', value: viewModel.summary.totalReward },
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
                <span>
                  {t('arena.winnerLine', {
                    winner:
                      selectedCombat.winnerId === selectedCombat.gladiator.id
                        ? selectedCombat.gladiator.name
                        : selectedCombat.opponent.name,
                  })}
                </span>
              </div>
              <Swords aria-hidden="true" size={20} />
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
                  value: selectedCombat.consequence.playerReward,
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
                <Swords aria-hidden="true" size={17} />
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
                  <Eye aria-hidden="true" size={17} />
                  <span>
                    {odds.isScouted
                      ? t('betting.scouted')
                      : t('betting.scout', { cost: validation.cost })}
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
