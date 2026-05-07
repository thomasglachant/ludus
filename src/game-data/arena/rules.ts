import type { ArenaRank } from '../../domain/combat/types';
import type { DayOfWeek } from '../../domain/time/types';

export const ARENA_RULES = {
  // Weekday on which arena fights happen.
  dayOfWeek: 'sunday' satisfies DayOfWeek,
  // Hour at which arena day starts and interrupts normal time flow.
  startHour: 6,
  // Hour set when the player completes the arena day summary.
  endHour: 20,
  // Minimum health required for a gladiator to receive a fight.
  minimumEligibleHealth: 1,
} as const;

export const ARENA_REWARDS = {
  // Base victory reward for the lowest bronze rank.
  bronze3: 80,
  // Base victory reward for the middle bronze rank.
  bronze2: 120,
  // Base victory reward for the highest bronze rank.
  bronze1: 180,
  // Base victory reward for the lowest silver rank.
  silver3: 260,
  // Base victory reward for the middle silver rank.
  silver2: 380,
  // Base victory reward for the highest silver rank.
  silver1: 540,
  // Base victory reward for the lowest gold rank.
  gold3: 760,
  // Base victory reward for the middle gold rank.
  gold2: 1050,
  // Base victory reward for the highest gold rank.
  gold1: 1400,
} as const satisfies Record<ArenaRank, number>;

export const ARENA_VICTORY_ODDS_REWARD_MULTIPLIER = 0.42;

export const ARENA_PUBLIC_STAKE_MODIFIER_SPREAD = 20;

export const ARENA_ODDS_CONFIG = {
  // House edge removed from fair decimal odds.
  houseEdge: 0.08,
  // Minimum decimal odds displayed after house edge.
  minimumDecimalOdds: 1.1,
} as const;

export const ARENA_RANK_THRESHOLDS = [
  { rank: 'bronze3', minimumReputation: 0 },
  { rank: 'bronze2', minimumReputation: 25 },
  { rank: 'bronze1', minimumReputation: 50 },
  { rank: 'silver3', minimumReputation: 100 },
  { rank: 'silver2', minimumReputation: 150 },
  { rank: 'silver1', minimumReputation: 225 },
  { rank: 'gold3', minimumReputation: 325 },
  { rank: 'gold2', minimumReputation: 450 },
  { rank: 'gold1', minimumReputation: 600 },
] as const;
