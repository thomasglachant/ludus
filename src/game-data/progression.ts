import { GAME_BALANCE } from './balance';

export const PROGRESSION_CONFIG = {
  weeksPerYear: GAME_BALANCE.progression.weeksPerYear,
  startingYear: GAME_BALANCE.progression.startingYear,
  startingWeek: GAME_BALANCE.progression.startingWeek,
  startingDayOfWeek: GAME_BALANCE.progression.startingDayOfWeek,
  startingHour: GAME_BALANCE.progression.startingHour,
  startingMinute: GAME_BALANCE.progression.startingMinute,
  initialSpeed: GAME_BALANCE.progression.initialSpeed,
  initialIsPaused: GAME_BALANCE.progression.initialIsPaused,
} as const;
