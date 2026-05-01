import type { CombatState, GameSave } from '../../domain/types';
import { formatSignedNumber } from '../formatters/number';

export interface DayResultsSummaryViewModel {
  totalReward: number;
  reputationChange: number;
  healthChange: number;
  energyChange: number;
  moraleChange: number;
  wins: number;
  losses: number;
}

export interface ArenaDayViewModel {
  currentCombat?: CombatState;
  emptyMessageKey?: string;
  isArenaDayActive: boolean;
  resolvedCombats: CombatState[];
  statusKey: string;
  summary: DayResultsSummaryViewModel;
}

export function formatSignedValue(value: number) {
  return formatSignedNumber(value);
}

export function getCombatResultKey(combat: CombatState) {
  return combat.consequence.didPlayerWin ? 'arena.result.win' : 'arena.result.loss';
}

export function getCombatResultTone(combat: CombatState): 'success' | 'danger' {
  return combat.consequence.didPlayerWin ? 'success' : 'danger';
}

export function getCombatTitleParams(combat: CombatState) {
  return {
    gladiator: combat.gladiator.name,
    opponent: combat.opponent.name,
  };
}

function summarizeCombats(combats: CombatState[]): DayResultsSummaryViewModel {
  return combats.reduce<DayResultsSummaryViewModel>(
    (summary, combat) => ({
      totalReward: summary.totalReward + combat.consequence.playerReward,
      reputationChange: summary.reputationChange + combat.consequence.reputationChange,
      healthChange: summary.healthChange + combat.consequence.healthChange,
      energyChange: summary.energyChange + combat.consequence.energyChange,
      moraleChange: summary.moraleChange + combat.consequence.moraleChange,
      wins: summary.wins + (combat.consequence.didPlayerWin ? 1 : 0),
      losses: summary.losses + (combat.consequence.didPlayerWin ? 0 : 1),
    }),
    {
      totalReward: 0,
      reputationChange: 0,
      healthChange: 0,
      energyChange: 0,
      moraleChange: 0,
      wins: 0,
      losses: 0,
    },
  );
}

function getCurrentCombat(save: GameSave, combats: CombatState[]) {
  if (combats.length === 0) {
    return undefined;
  }

  return combats.find((combat) => combat.id === save.arena.currentCombatId) ?? combats[0];
}

export function getArenaDayViewModel(save: GameSave): ArenaDayViewModel {
  const resolvedCombats = save.arena.resolvedCombats;
  const currentCombat = getCurrentCombat(save, resolvedCombats);
  const hasAnyCombat = resolvedCombats.length > 0;
  const emptyMessageKey =
    hasAnyCombat || save.gladiators.length > 0
      ? save.arena.isArenaDayActive
        ? 'arena.noEligible'
        : 'arena.nextSunday'
      : 'arena.noGladiators';

  return {
    currentCombat,
    emptyMessageKey: hasAnyCombat ? undefined : emptyMessageKey,
    isArenaDayActive: save.arena.isArenaDayActive,
    resolvedCombats,
    statusKey: save.arena.isArenaDayActive ? 'arena.status.active' : 'arena.status.waiting',
    summary: summarizeCombats(resolvedCombats),
  };
}
