import type { DayOfWeek } from '../../domain/time/types';

export const EVENT_GENERATION_CONFIG = {
  // Maximum pending events generated on a single day.
  maxEventsPerDay: 1,
  // Maximum generated events during a single week.
  maxEventsPerWeek: 3,
  // Default relative weight used when selecting one event definition.
  defaultSelectionWeightPercent: 100,
  // Default game-week cooldown before the same event definition can reappear.
  defaultCooldownWeeks: 4,
  // Number of launched event records kept to enforce cooldowns across saves.
  launchedEventHistoryLimit: 128,
  // Chance that an event appears on each weekday once other limits allow it.
  dailyEventProbabilityByDay: {
    monday: 0.1,
    tuesday: 0.25,
    wednesday: 0.25,
    thursday: 0.25,
    friday: 0.25,
    saturday: 0.1,
    sunday: 0,
  } satisfies Record<DayOfWeek, number>,
  // Number of resolved or expired events kept in save history.
  resolvedEventHistoryLimit: 12,
} as const;
