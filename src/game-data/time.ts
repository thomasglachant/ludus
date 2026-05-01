import type { DayOfWeek } from '../domain/types';
import { GAME_BALANCE } from './balance';

export const DAYS_OF_WEEK = GAME_BALANCE.time.daysOfWeek satisfies readonly DayOfWeek[];
