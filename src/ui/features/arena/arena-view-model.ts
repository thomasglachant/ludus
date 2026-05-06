import type { CombatState, GameSave } from '@/domain/types';

export interface DayResultsSummaryViewModel {
  totalReward: number;
  reputationChange: number;
  wins: number;
  losses: number;
}

export interface ArenaDayViewModel {
  emptyMessageKey?: string;
  isArenaDayActive: boolean;
  resolvedCombats: CombatState[];
  statusKey: string;
  summary: DayResultsSummaryViewModel;
}

function summarizeCombats(combats: CombatState[]): DayResultsSummaryViewModel {
  return combats.reduce<DayResultsSummaryViewModel>(
    (summary, combat) => ({
      totalReward: summary.totalReward + combat.consequence.playerReward,
      reputationChange: summary.reputationChange + combat.consequence.reputationChange,
      wins: summary.wins + (combat.consequence.didPlayerWin ? 1 : 0),
      losses: summary.losses + (combat.consequence.didPlayerWin ? 0 : 1),
    }),
    {
      totalReward: 0,
      reputationChange: 0,
      wins: 0,
      losses: 0,
    },
  );
}

export function getArenaDayViewModel(save: GameSave): ArenaDayViewModel {
  const resolvedCombats = save.arena.resolvedCombats;
  const hasAnyCombat = resolvedCombats.length > 0;
  const emptyMessageKey =
    hasAnyCombat || save.gladiators.length > 0
      ? save.arena.isArenaDayActive
        ? 'arena.noEligible'
        : 'arena.nextSunday'
      : 'arena.noGladiators';

  return {
    emptyMessageKey: hasAnyCombat ? undefined : emptyMessageKey,
    isArenaDayActive: save.arena.isArenaDayActive,
    resolvedCombats,
    statusKey: save.arena.isArenaDayActive ? 'arena.status.active' : 'arena.status.waiting',
    summary: summarizeCombats(resolvedCombats),
  };
}
