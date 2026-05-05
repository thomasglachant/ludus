export type GamePhase = 'planning' | 'simulation' | 'event' | 'arena' | 'report' | 'gameOver';

export type PendingActionTrigger = 'startWeek' | 'enterArena';

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

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
