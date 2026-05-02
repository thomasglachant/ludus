import type { Gladiator } from './types';

export function hasActiveWeeklyInjury(gladiator: Gladiator, year: number, week: number) {
  return gladiator.weeklyInjury?.year === year && gladiator.weeklyInjury.week === week;
}
