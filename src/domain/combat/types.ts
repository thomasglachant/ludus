import type { Gladiator } from '../gladiators/types';
import type { DayOfWeek } from '../time/types';

export type ArenaRank =
  | 'bronze3'
  | 'bronze2'
  | 'bronze1'
  | 'silver3'
  | 'silver2'
  | 'silver1'
  | 'gold3'
  | 'gold2'
  | 'gold1';

export type CombatStrategy =
  | 'balanced'
  | 'aggressive'
  | 'defensive'
  | 'evasive'
  | 'exhaustOpponent'
  | 'protectInjury';

export interface ArenaState {
  currentCombatId?: string;
  pendingCombats: CombatState[];
  resolvedCombats: CombatState[];
  isArenaDayActive: boolean;
  betting?: BettingState;
}

export interface BettingState {
  year: number;
  week: number;
  odds: BettingOdds[];
  scoutingReports: ScoutingReport[];
  areBetsLocked: boolean;
}

export interface BettingOdds {
  id: string;
  gladiatorId: string;
  opponent: Gladiator;
  rank: ArenaRank;
  playerWinChance: number;
  playerDecimalOdds: number;
  opponentDecimalOdds: number;
  isScouted: boolean;
  createdAtDay: DayOfWeek;
}

export interface ScoutingReport {
  id: string;
  gladiatorId: string;
  opponentId: string;
  opponentStrength: number;
  opponentAgility: number;
  opponentDefense: number;
  summaryKey: string;
  createdAtYear: number;
  createdAtWeek: number;
  createdAtDay: DayOfWeek;
}

export interface CombatState {
  id: string;
  gladiator: Gladiator;
  opponent: Gladiator;
  rank: ArenaRank;
  strategy: CombatStrategy;
  turns: CombatTurn[];
  winnerId?: string;
  loserId?: string;
  reward: CombatReward;
  consequence: CombatConsequence;
}

export interface CombatTurn {
  turnNumber: number;
  attackerId: string;
  defenderId: string;
  didHit: boolean;
  damage: number;
  attackerHealthAfterTurn: number;
  defenderHealthAfterTurn: number;
  logKey: string;
  logParams: Record<string, string | number>;
}

export interface CombatReward {
  totalReward: number;
  winnerReward: number;
  loserReward: number;
}

export interface CombatConsequence {
  didPlayerWin: boolean;
  playerReward: number;
  healthChange: number;
  energyChange: number;
  moraleChange: number;
  reputationChange: number;
  finalHealth: number;
  finalEnergy: number;
  finalMorale: number;
  finalReputation: number;
}
