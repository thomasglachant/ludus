import { TIME_CONFIG } from '../../game-data/time';
import {
  getTimeOfDayDefinition,
  TIME_OF_DAY_DEFINITIONS,
  type TimeOfDayPhase,
} from '../../game-data/time-of-day';
import type { GameTimeState } from '../../domain/time/types';

export interface DayCycleSegmentViewModel {
  phase: TimeOfDayPhase;
  widthPercent: number;
}

export interface DayCycleViewModel {
  phase: TimeOfDayPhase;
  progressPercent: number;
  segments: DayCycleSegmentViewModel[];
}

function getDefinitionDurationHours(startHour: number, endHour: number) {
  if (endHour > startHour) {
    return endHour - startHour;
  }

  return TIME_CONFIG.hoursPerDay - startHour + endHour;
}

export function getDayCycleViewModel(
  time: Pick<GameTimeState, 'hour' | 'minute'>,
): DayCycleViewModel {
  const minutesPerDay = TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour;
  const cycleStartMinutes = TIME_OF_DAY_DEFINITIONS[0].startHour * TIME_CONFIG.minutesPerHour;
  const minuteOfDay = time.hour * TIME_CONFIG.minutesPerHour + time.minute;
  const elapsedCycleMinutes = (minuteOfDay - cycleStartMinutes + minutesPerDay) % minutesPerDay;
  const progressPercent = (elapsedCycleMinutes / minutesPerDay) * 100;
  const segments = TIME_OF_DAY_DEFINITIONS.map((definition) => {
    const durationHours = getDefinitionDurationHours(definition.startHour, definition.endHour);

    return {
      phase: definition.phase,
      widthPercent: (durationHours / TIME_CONFIG.hoursPerDay) * 100,
    };
  });

  return {
    phase: getTimeOfDayDefinition(time.hour).phase,
    progressPercent,
    segments,
  };
}
