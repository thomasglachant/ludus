import type { GameTimeState } from './types';

export function formatClock(time: Pick<GameTimeState, 'hour' | 'minute'>) {
  return `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`;
}
