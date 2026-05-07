export const GAME_PHASES = [
  'planning',
  'simulation',
  'event',
  'arena',
  'report',
  'gameOver',
] as const;

export type GamePhase = (typeof GAME_PHASES)[number];

export const PENDING_ACTION_TRIGGERS = ['startWeek', 'enterArena'] as const;

export type PendingActionTrigger = (typeof PENDING_ACTION_TRIGGERS)[number];

export const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export interface GameTimeState {
  year: number;
  week: number;
  dayOfWeek: DayOfWeek;
  phase: GamePhase;
  pendingActionTrigger?: PendingActionTrigger;
}

export interface GameDate {
  year: number;
  week: number;
  dayOfWeek: DayOfWeek;
}
