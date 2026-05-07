import { DAYS_OF_WEEK } from '../domain/time/types';
import type { DayOfWeek } from '../domain/time/types';

export { DAYS_OF_WEEK } from '../domain/time/types';

export const GAME_TIME_CONFIG = {
  // Number of weeks played before the campaign year increments.
  weeksPerYear: 8,
  // Campaign year used when a new save starts.
  startingYear: 1,
  // Campaign week used when a new save starts.
  startingWeek: 1,
  // Weekday used when a new save starts.
  startingDayOfWeek: 'monday' satisfies DayOfWeek,
  // First displayed hour of an automatically simulated day.
  dayStartHour: 8,
  // Hour at which the current day is resolved and the next day starts.
  dayEndHour: 20,
  // Ordered weekdays used by time progression and weekly systems.
  daysOfWeek: DAYS_OF_WEEK satisfies readonly DayOfWeek[],
  // In-game minutes advanced every real-time second while the game is not paused.
  minutesPerRealSecond: 30,
} as const;

export const DEBUG_TIME_SCALE_OPTIONS = [1, 2, 4, 8, 16] as const;
