import type { CombatState, CombatTurn } from '../../domain/types';

export interface CombatConsequenceViewModel {
  didPlayerWin: boolean;
  playerReward: number;
  reputationChange: number;
  resultKey: string;
  winnerName: string;
}

export interface CombatLogViewModel {
  combat: CombatState;
  consequence: CombatConsequenceViewModel;
  isComplete: boolean;
  latestTurn?: CombatTurn;
  visibleTurns: CombatTurn[];
}

export function getCombatLogViewModel(combat: CombatState): CombatLogViewModel {
  const winnerName =
    combat.winnerId === combat.gladiator.id ? combat.gladiator.name : combat.opponent.name;

  return {
    combat,
    consequence: {
      didPlayerWin: combat.consequence.didPlayerWin,
      playerReward: combat.consequence.playerReward,
      reputationChange: combat.consequence.reputationChange,
      resultKey: combat.consequence.didPlayerWin ? 'arena.result.win' : 'arena.result.loss',
      winnerName,
    },
    isComplete: true,
    latestTurn: combat.turns.at(-1),
    visibleTurns: combat.turns,
  };
}
