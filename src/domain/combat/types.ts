import type { Gladiator } from '../gladiators/types';

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

export interface ArenaState {
  currentCombatId?: string;
  arenaDay?: ArenaDayState;
  resolvedCombats: CombatState[];
  isArenaDayActive: boolean;
}

export type ArenaDayPhase = 'intro' | 'summary';

export interface ArenaDayState {
  year: number;
  week: number;
  phase: ArenaDayPhase;
  presentedCombatIds: string[];
}

export interface CombatState {
  id: string;
  gladiator: Gladiator;
  opponent: Gladiator;
  gauges: CombatGauges;
  rank: ArenaRank;
  turns: CombatTurn[];
  winnerId?: string;
  loserId?: string;
  reward: CombatReward;
  consequence: CombatConsequence;
}

export interface CombatParticipantGauges {
  maxHealth: number;
  health: number;
  maxEnergy: number;
  energy: number;
  morale: number;
}

export interface CombatGauges {
  player: CombatParticipantGauges;
  opponent: CombatParticipantGauges;
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
  participationReward?: number;
  victoryReward?: number;
  publicStakeModifier?: number;
  playerDecimalOdds?: number;
  opponentDecimalOdds?: number;
}

export interface CombatConsequence {
  didPlayerWin: boolean;
  playerReward: number;
  reputationChange: number;
  finalReputation: number;
}
