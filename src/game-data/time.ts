import type { DayOfWeek, GameSpeed, TrainingIntensity } from '../domain/types';

export const GAME_SPEEDS = [0, 1, 2, 4, 8, 16] as const satisfies GameSpeed[];

export const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const satisfies DayOfWeek[];

export const TIME_CONFIG = {
  realMillisecondsPerGameHour: 5_000,
  minutesPerHour: 60,
  hoursPerDay: 24,
} as const;

export const TRAINING_INTENSITY_EFFECTS: Record<
  TrainingIntensity,
  {
    statMultiplier: number;
    energyCostMultiplier: number;
    moraleCost: number;
  }
> = {
  light: {
    statMultiplier: 1,
    energyCostMultiplier: 0.5,
    moraleCost: 0,
  },
  normal: {
    statMultiplier: 1,
    energyCostMultiplier: 1,
    moraleCost: 0,
  },
  hard: {
    statMultiplier: 2,
    energyCostMultiplier: 1.5,
    moraleCost: 0,
  },
  brutal: {
    statMultiplier: 3,
    energyCostMultiplier: 2,
    moraleCost: 1,
  },
};
