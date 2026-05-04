import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  calculateDecimalOdds,
  calculateProjectedWinChance,
} from '../../domain/combat/combat-actions';
import type { CombatState, GameSave } from '../../domain/types';
import { useUiStore } from '../../state/ui-store-context';
import { GladiatorSummary } from '../gladiators/GladiatorSummary';
import { CardBlured } from '../components/CardBlured';
import { CTAButton } from '../components/CTAButton';
import { ImpactList } from '../components/ImpactList';
import { GameIcon } from '../icons/GameIcon';
import { CombatArenaStage } from './CombatArenaStage';
import { CombatLog } from './CombatLog';
import { CombatPlaybackBar } from './CombatPlaybackBar';
import { getCombatReplayCombat, getCombatReplayViewModel } from './combat-replay-view-model';

interface CombatReplayViewProps {
  combatId?: string;
  embedded?: boolean;
  save: GameSave;
  onClose(): void;
}

function getCombatOdds(combat: CombatState) {
  if (
    combat.reward.playerDecimalOdds !== undefined &&
    combat.reward.opponentDecimalOdds !== undefined
  ) {
    return {
      opponent: combat.reward.opponentDecimalOdds,
      player: combat.reward.playerDecimalOdds,
    };
  }

  const playerChance = calculateProjectedWinChance(combat.gladiator, combat.opponent);

  return {
    opponent: combat.reward.opponentDecimalOdds ?? calculateDecimalOdds(1 - playerChance),
    player: combat.reward.playerDecimalOdds ?? calculateDecimalOdds(playerChance),
  };
}

export function CombatReplayView({
  combatId,
  embedded = false,
  onClose,
  save,
}: CombatReplayViewProps) {
  const { t } = useUiStore();
  const combat = useMemo(() => getCombatReplayCombat(save, combatId), [combatId, save]);
  const [playbackState, setPlaybackState] = useState<{
    combatId?: string;
    isPlaying: boolean;
  }>({
    combatId: undefined,
    isPlaying: true,
  });
  const [turnProgress, setTurnProgress] = useState<{ combatId?: string; count: number }>({
    combatId: undefined,
    count: 0,
  });
  const visibleTurnCount = turnProgress.combatId === combat?.id ? turnProgress.count : 0;
  const isCombatComplete = Boolean(combat && visibleTurnCount >= combat.turns.length);
  const isPlaying =
    !isCombatComplete && (playbackState.combatId === combat?.id ? playbackState.isPlaying : true);

  const setVisibleTurnCount = useCallback(
    (nextVisibleTurnCount: number) => {
      if (!combat) {
        return;
      }

      const boundedTurnCount = Math.min(Math.max(0, nextVisibleTurnCount), combat.turns.length);

      setTurnProgress({
        combatId: combat.id,
        count: boundedTurnCount,
      });

      if (boundedTurnCount >= combat.turns.length) {
        setPlaybackState({
          combatId: combat.id,
          isPlaying: false,
        });
      }
    },
    [combat],
  );

  const revealNextTurn = useCallback(() => {
    setVisibleTurnCount(visibleTurnCount + 1);
  }, [setVisibleTurnCount, visibleTurnCount]);

  useEffect(() => {
    if (!combat || !isPlaying || visibleTurnCount >= combat.turns.length) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setVisibleTurnCount(visibleTurnCount + 1);
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [combat, isPlaying, setVisibleTurnCount, visibleTurnCount]);

  if (!combat) {
    return (
      <section className="combat-replay combat-replay--empty" data-testid="combat-replay">
        <button type="button" onClick={onClose}>
          <GameIcon color="currentColor" name="back" size={18} />
          <span>{t('common.back')}</span>
        </button>
        <p>{t('arena.noCombatLog')}</p>
      </section>
    );
  }

  const viewModel = getCombatReplayViewModel(combat, visibleTurnCount);
  const odds = getCombatOdds(combat);
  const handleTogglePlayback = () => {
    setPlaybackState({
      combatId: combat.id,
      isPlaying: !isPlaying,
    });
  };

  return (
    <section
      aria-label={t('combatScreen.title')}
      className={['combat-replay', embedded ? 'combat-replay--embedded' : '']
        .filter(Boolean)
        .join(' ')}
      data-testid="combat-replay"
    >
      <div className="combat-replay__body">
        <div className="combat-replay__fighter-sheets">
          <div className="combat-replay__fighter-sheet combat-replay__fighter-sheet--player">
            <GladiatorSummary
              gladiator={combat.gladiator}
              odds={odds.player}
              side="player"
              statValues={{
                energy: viewModel.player.energy,
                health: viewModel.player.health,
                morale: viewModel.player.morale,
              }}
            />
          </div>
          <div className="combat-replay__fighter-sheet combat-replay__fighter-sheet--opponent">
            <GladiatorSummary
              gladiator={combat.opponent}
              odds={odds.opponent}
              side="opponent"
              statValues={{
                energy: viewModel.opponent.energy,
                health: viewModel.opponent.health,
                morale: viewModel.opponent.morale,
              }}
            />
          </div>
        </div>
        <CombatArenaStage viewModel={viewModel} />
        {viewModel.isComplete ? (
          <CardBlured as="section" className="combat-replay__result-overlay">
            <div className="combat-replay__result-title">
              <GameIcon
                name={viewModel.consequence.didPlayerWin ? 'victory' : 'defeat'}
                size={58}
              />
              <strong>{t(viewModel.consequence.resultKey)}</strong>
            </div>
            <p className="combat-replay__winner-line">
              {t('combatScreen.winnerLine', {
                winner: viewModel.consequence.winnerName,
              })}
            </p>
            <ImpactList
              className="combat-replay__result-impacts"
              impacts={[
                {
                  amount: viewModel.consequence.playerReward,
                  id: 'treasury',
                  kind: 'treasury',
                  label: t('arena.rewardReceived'),
                },
                {
                  amount: viewModel.consequence.reputationChange,
                  id: 'reputation',
                  kind: 'reputation',
                  label: t('arena.reputationChange'),
                },
              ]}
            />
            <CTAButton onClick={onClose}>
              <GameIcon color="#fff9e7" name="logout" size={18} />
              <span>{t('combatScreen.returnToArena')}</span>
            </CTAButton>
          </CardBlured>
        ) : null}
        <CombatLog viewModel={viewModel} />
        <CombatPlaybackBar
          isPlaying={isPlaying}
          viewModel={viewModel}
          onEnd={() => setVisibleTurnCount(combat.turns.length)}
          onNext={revealNextTurn}
          onPrevious={() => setVisibleTurnCount(visibleTurnCount - 1)}
          onStart={() => setVisibleTurnCount(0)}
          onTogglePlayback={handleTogglePlayback}
        />
      </div>
    </section>
  );
}
