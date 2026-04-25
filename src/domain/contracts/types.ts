import type { ArenaRank } from '../combat/types';

export type ContractStatus = 'available' | 'accepted' | 'completed' | 'failed' | 'expired';

export interface WeeklyContract {
  id: string;
  titleKey: string;
  descriptionKey: string;
  status: ContractStatus;
  rewardTreasury: number;
  rewardReputation?: number;
  issuedAtYear: number;
  issuedAtWeek: number;
  expiresAtYear: number;
  expiresAtWeek: number;
  objective: ContractObjective;
}

export type ContractObjective =
  | { type: 'winFightCount'; count: number }
  | { type: 'winWithRank'; rank: ArenaRank }
  | { type: 'winWithLowHealth'; maxHealth: number }
  | { type: 'earnTreasuryFromArena'; amount: number }
  | { type: 'sellGladiatorForAtLeast'; amount: number };

export interface ContractState {
  availableContracts: WeeklyContract[];
  acceptedContracts: WeeklyContract[];
}

export interface ContractProgress {
  current: number;
  target: number;
  isComplete: boolean;
}
