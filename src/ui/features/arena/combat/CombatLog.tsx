import './combat.css';
import { useEffect, useRef, type ReactNode } from 'react';
import type { Gladiator } from '@/domain/types';
import { useUiStore } from '@/state/ui-store-context';
import { ImpactIndicator } from '@/ui/shared/components/ImpactIndicator';
import { ImpactList } from '@/ui/shared/components/ImpactList';
import { GameIcon } from '@/ui/shared/icons/GameIcon';
import { GameCard, GameScrollArea } from '@/ui/shared/ludus/GameCard';
import type { CombatLogViewModel } from './combat-log-view-model';

interface CombatLogProps {
  viewModel: CombatLogViewModel;
}

type CombatLogSide = 'left' | 'right';

interface CombatantLogState {
  gladiator: Gladiator;
  side: CombatLogSide;
}

interface CombatLogTurnViewModel {
  attackerSide: CombatLogSide;
  defenderSide: CombatLogSide;
  energyLoss: number;
  healthDamage: number;
  isHit: boolean;
  left: CombatantLogState;
  right: CombatantLogState;
  summaryKey: string;
  summaryParams: Record<string, string | number>;
  turnNumber: number;
}

interface CombatResultColumnViewModel {
  experienceChange?: number;
  gladiator: Gladiator;
  isWinner: boolean;
  reputationChange?: number;
  reward: number;
  side: CombatLogSide;
}

function getCombatantReward(viewModel: CombatLogViewModel, combatantId: string) {
  const didCombatantWin = viewModel.combat.winnerId === combatantId;

  return didCombatantWin
    ? viewModel.combat.reward.winnerReward
    : viewModel.combat.reward.loserReward;
}

function getCombatResultColumns(viewModel: CombatLogViewModel): CombatResultColumnViewModel[] {
  const player = viewModel.combat.gladiator;
  const opponent = viewModel.combat.opponent;

  return [
    {
      gladiator: player,
      experienceChange: viewModel.consequence.experienceChange,
      isWinner: viewModel.combat.winnerId === player.id,
      reputationChange: viewModel.consequence.reputationChange,
      reward: getCombatantReward(viewModel, player.id),
      side: 'left',
    },
    {
      gladiator: opponent,
      isWinner: viewModel.combat.winnerId === opponent.id,
      reward: getCombatantReward(viewModel, opponent.id),
      side: 'right',
    },
  ];
}

function getTurnParticipantSide(viewModel: CombatLogViewModel, combatantId: string): CombatLogSide {
  return viewModel.combat.gladiator.id === combatantId ? 'left' : 'right';
}

function getCombatLogTurns(viewModel: CombatLogViewModel): CombatLogTurnViewModel[] {
  return viewModel.visibleTurns.map((turn) => {
    const attackerSide = getTurnParticipantSide(viewModel, turn.attackerId);
    const defenderSide = getTurnParticipantSide(viewModel, turn.defenderId);

    return {
      attackerSide,
      defenderSide,
      energyLoss: 1,
      healthDamage: turn.damage,
      isHit: turn.didHit,
      left: {
        gladiator: viewModel.combat.gladiator,
        side: 'left',
      },
      right: {
        gladiator: viewModel.combat.opponent,
        side: 'right',
      },
      summaryKey: turn.logKey,
      summaryParams: turn.logParams,
      turnNumber: turn.turnNumber,
    };
  });
}

function getCombatWinnerAndLoser(viewModel: CombatLogViewModel) {
  const player = viewModel.combat.gladiator;
  const opponent = viewModel.combat.opponent;
  const isPlayerWinner = viewModel.combat.winnerId === player.id;

  return {
    loserName: isPlayerWinner ? opponent.name : player.name,
    winnerName: isPlayerWinner ? player.name : opponent.name,
  };
}

function CombatLogEventEntry({
  children,
  className,
  details,
  isLatest = false,
  title,
}: {
  children: ReactNode;
  className?: string;
  details?: ReactNode;
  isLatest?: boolean;
  title: string;
}) {
  return (
    <li
      className={['combat-replay-log__event-row', isLatest ? 'is-latest' : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="combat-replay-log__turn-header">
        <span>{title}</span>
        <p>{children}</p>
      </div>
      {details ? <div className="combat-replay-log__event-details">{details}</div> : null}
    </li>
  );
}

function CombatantTurnColumn({
  combatant,
  turn,
}: {
  combatant: CombatantLogState;
  turn: CombatLogTurnViewModel;
}) {
  const { t } = useUiStore();
  const isAttacker = turn.attackerSide === combatant.side;
  const isDefender = turn.defenderSide === combatant.side;

  return (
    <div
      className={[
        'combat-replay-log__combatant-turn',
        isAttacker ? 'is-acting' : '',
        isDefender ? 'is-defending' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <strong>{combatant.gladiator.name}</strong>
      <div className="combat-replay-log__impacts">
        {isAttacker ? (
          <>
            <span className="combat-replay-log__impact combat-replay-log__impact--attack">
              <GameIcon name="combatStrike" size={16} />
              <span>
                <small>{t('combatScreen.logImpact.attackerAttack')}</small>
              </span>
            </span>
            {turn.energyLoss > 0 ? (
              <ImpactIndicator
                amount={-turn.energyLoss}
                kind="energy"
                label={t('combatScreen.logImpact.energySpent', {
                  fighter: combatant.gladiator.name,
                })}
                size="sm"
              />
            ) : null}
          </>
        ) : null}
        {isDefender && turn.isHit ? (
          <ImpactIndicator
            amount={-turn.healthDamage}
            kind="health"
            label={t('combatScreen.logImpact.healthLost', {
              fighter: combatant.gladiator.name,
            })}
            size="sm"
          />
        ) : null}
        {isDefender && !turn.isHit ? (
          <>
            <span className="combat-replay-log__impact combat-replay-log__impact--dodge">
              <GameIcon name="combatFeint" size={16} />
              <span>
                <small>{t('combatScreen.logImpact.dodged')}</small>
              </span>
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}

function CombatWinnerLine({ viewModel }: { viewModel: CombatLogViewModel }) {
  const { t } = useUiStore();
  const { loserName, winnerName } = getCombatWinnerAndLoser(viewModel);

  return (
    <>
      <strong className="combat-replay-log__winner-name">{winnerName}</strong>
      <span> {t('combatScreen.winnerLineAgainst')} </span>
      <span className="combat-replay-log__loser-name">{loserName}</span>
    </>
  );
}

function CombatResultColumn({ result }: { result: CombatResultColumnViewModel }) {
  const { t } = useUiStore();

  return (
    <div
      className={['combat-replay-log__combatant-turn', result.isWinner ? 'is-acting' : '']
        .filter(Boolean)
        .join(' ')}
    >
      <strong>{result.gladiator.name}</strong>
      <ImpactList
        className="combat-replay-log__impacts"
        impacts={[
          {
            amount: result.reward,
            id: 'treasury',
            kind: 'treasury',
            label: t('arena.rewardReceived'),
          },
          ...(result.reputationChange === undefined
            ? []
            : [
                {
                  amount: result.reputationChange,
                  id: 'reputation',
                  kind: 'reputation' as const,
                  label: t('arena.reputationChange'),
                },
              ]),
          ...(result.experienceChange === undefined
            ? []
            : [
                {
                  amount: result.experienceChange,
                  id: 'experience',
                  kind: 'xp' as const,
                  label: t('arena.experienceChange'),
                },
              ]),
        ]}
        size="sm"
      />
    </div>
  );
}

export function CombatLog({ viewModel }: CombatLogProps) {
  const { t } = useUiStore();
  const listRef = useRef<HTMLDivElement | null>(null);
  const logTurns = getCombatLogTurns(viewModel);
  const resultColumns = getCombatResultColumns(viewModel);

  useEffect(() => {
    const list = listRef.current;

    if (!list) {
      return;
    }

    list.scrollTop = list.scrollHeight;
  }, [logTurns.length, viewModel.isComplete]);

  return (
    <GameCard
      as="section"
      className="combat-replay-log"
      data-testid="combat-replay-log"
      surface="dark"
    >
      <header>
        <strong>{t('arena.combatLog')}</strong>
      </header>
      <GameScrollArea className="combat-replay-log__scroll" ref={listRef}>
        <ul className="combat-replay-log__entries" aria-live="polite">
          <CombatLogEventEntry
            isLatest={viewModel.visibleTurns.length === 0}
            title={t('combatScreen.logIntroTitle')}
          >
            {t('combatScreen.logIntro', {
              gladiator: viewModel.combat.gladiator.name,
              opponent: viewModel.combat.opponent.name,
            })}
          </CombatLogEventEntry>
          {logTurns.map((turn) => (
            <li
              className={turn.turnNumber === viewModel.latestTurn?.turnNumber ? 'is-latest' : ''}
              key={turn.turnNumber}
            >
              <div className="combat-replay-log__turn-header">
                <span>{t('arena.turnNumber', { turn: turn.turnNumber })}</span>
                <p>{t(turn.summaryKey, turn.summaryParams)}</p>
              </div>
              <div className="combat-replay-log__turn-combatants">
                <CombatantTurnColumn combatant={turn.left} turn={turn} />
                <CombatantTurnColumn combatant={turn.right} turn={turn} />
              </div>
            </li>
          ))}
          {viewModel.isComplete ? (
            <CombatLogEventEntry
              className="combat-replay-log__result"
              details={
                <div className="combat-replay-log__turn-combatants">
                  {resultColumns.map((result) => (
                    <CombatResultColumn key={result.side} result={result} />
                  ))}
                </div>
              }
              title={t('combatScreen.finalResult')}
            >
              <CombatWinnerLine viewModel={viewModel} />
            </CombatLogEventEntry>
          ) : null}
        </ul>
      </GameScrollArea>
    </GameCard>
  );
}
