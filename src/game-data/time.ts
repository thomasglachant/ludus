import type { DayOfWeek, GameSpeed, TrainingIntensity } from '../domain/types';
import { GAME_BALANCE } from './balance';

export const GAME_SPEEDS = GAME_BALANCE.time.gameSpeeds satisfies readonly GameSpeed[];

export const SUPPORTED_GAME_SPEEDS = GAME_BALANCE.time
  .supportedGameSpeeds satisfies readonly GameSpeed[];

export const DAYS_OF_WEEK = GAME_BALANCE.time.daysOfWeek satisfies readonly DayOfWeek[];

export const TIME_CONFIG = {
  realMillisecondsPerGameHour: GAME_BALANCE.time.realMillisecondsPerGameHour,
  minutesPerHour: GAME_BALANCE.time.minutesPerHour,
  hoursPerDay: GAME_BALANCE.time.hoursPerDay,
  dawnStartHour: GAME_BALANCE.time.dawnStartHour,
  dayStartHour: GAME_BALANCE.time.dayStartHour,
  duskStartHour: GAME_BALANCE.time.duskStartHour,
  nightStartHour: GAME_BALANCE.time.nightStartHour,
  nextDayAdvanceTargetHour: GAME_BALANCE.time.nextDayAdvanceTargetHour,
  nextDayAdvanceTargetMinute: GAME_BALANCE.time.nextDayAdvanceTargetMinute,
  wakeUpHour: GAME_BALANCE.time.wakeUpHour,
  wakeUpMinute: GAME_BALANCE.time.wakeUpMinute,
  sleepStartHour: GAME_BALANCE.time.sleepStartHour,
  minimumTaskMinutes: GAME_BALANCE.time.minimumTaskMinutes,
} as const;

export const TRAINING_INTENSITY_EFFECTS: Record<
  TrainingIntensity,
  {
    statMultiplier: number;
    energyCostMultiplier: number;
    moraleCost: number;
  }
> = {
  light: GAME_BALANCE.training.intensityEffects.light,
  normal: GAME_BALANCE.training.intensityEffects.normal,
  hard: GAME_BALANCE.training.intensityEffects.hard,
  brutal: GAME_BALANCE.training.intensityEffects.brutal,
};
