import type { GameSave } from '../saves/types';

export type GameSpeed = 0 | 1 | 2 | 4 | 8 | 16 | 32 | 48;

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
  hour: number;
  minute: number;
  speed: GameSpeed;
  isPaused: boolean;
}

export interface GameTickContext {
  elapsedRealMilliseconds: number;
  speed: GameSpeed;
  currentSave: GameSave;
  effectAccumulatorMinutes?: number;
  random?: () => number;
}
