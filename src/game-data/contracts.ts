import type { ArenaRank, ContractObjective } from '../domain/types';
import { GAME_BALANCE } from './balance';

export interface WeeklyContractDefinition {
  id: string;
  titleKey: string;
  descriptionKey: string;
  rewardTreasury: number;
  rewardReputation?: number;
  objective: ContractObjective;
}

export const CONTRACT_CONFIG = {
  availableContractsPerWeek: GAME_BALANCE.contracts.availableContractsPerWeek,
  rotationYearMultiplier: GAME_BALANCE.contracts.rotationYearMultiplier,
  rotationWeekMultiplier: GAME_BALANCE.contracts.rotationWeekMultiplier,
} as const;

export const WEEKLY_CONTRACT_DEFINITIONS: WeeklyContractDefinition[] = [
  {
    id: 'localChampion',
    titleKey: 'contracts.localChampion.title',
    descriptionKey: 'contracts.localChampion.description',
    rewardTreasury: 90,
    rewardReputation: 2,
    objective: { type: 'winFightCount', count: 1 },
  },
  {
    id: 'crowdRevenue',
    titleKey: 'contracts.crowdRevenue.title',
    descriptionKey: 'contracts.crowdRevenue.description',
    rewardTreasury: 70,
    rewardReputation: 1,
    objective: { type: 'earnTreasuryFromArena', amount: 120 },
  },
  {
    id: 'bronzeSpotlight',
    titleKey: 'contracts.bronzeSpotlight.title',
    descriptionKey: 'contracts.bronzeSpotlight.description',
    rewardTreasury: 110,
    rewardReputation: 2,
    objective: { type: 'winWithRank', rank: 'bronze3' satisfies ArenaRank },
  },
  {
    id: 'dangerousRecovery',
    titleKey: 'contracts.dangerousRecovery.title',
    descriptionKey: 'contracts.dangerousRecovery.description',
    rewardTreasury: 130,
    rewardReputation: 3,
    objective: { type: 'winWithLowHealth', maxHealth: 60 },
  },
  {
    id: 'profitableSale',
    titleKey: 'contracts.profitableSale.title',
    descriptionKey: 'contracts.profitableSale.description',
    rewardTreasury: 80,
    rewardReputation: 1,
    objective: { type: 'sellGladiatorForAtLeast', amount: 220 },
  },
];
