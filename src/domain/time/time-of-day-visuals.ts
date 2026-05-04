import type { TimeOfDayPhase } from '../../game-data/time-of-day';
import type { DayOfWeek, GamePhase, GameTimeState } from './types';

const DAY_OF_WEEK_TIME_OF_DAY: Record<DayOfWeek, TimeOfDayPhase> = {
  monday: 'dawn',
  tuesday: 'day',
  wednesday: 'day',
  thursday: 'day',
  friday: 'day',
  saturday: 'dusk',
  sunday: 'dusk',
};

const GAME_PHASE_TIME_OF_DAY: Partial<Record<GamePhase, TimeOfDayPhase>> = {
  arena: 'dusk',
  event: 'night',
  gameOver: 'night',
  report: 'dawn',
};

export function resolveTimeOfDayPhase(time: GameTimeState): TimeOfDayPhase {
  return GAME_PHASE_TIME_OF_DAY[time.phase] ?? DAY_OF_WEEK_TIME_OF_DAY[time.dayOfWeek];
}
