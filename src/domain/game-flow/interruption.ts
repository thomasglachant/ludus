import type { GameSave } from '../saves/types';
import { isWeeklyPlanningComplete } from '../planning/planning-actions';

export type GameInterruption =
  | { kind: 'dailyEvent'; eventId: string }
  | { kind: 'sundayArena' }
  | { kind: 'weeklyPlanning' };

export function getActiveGameInterruption(save: GameSave): GameInterruption | null {
  const pendingEvent = save.events.pendingEvents[0];

  if (pendingEvent) {
    return { kind: 'dailyEvent', eventId: pendingEvent.id };
  }

  if (save.arena.arenaDay) {
    return { kind: 'sundayArena' };
  }

  if (save.ludus.gameStatus !== 'lost' && !isWeeklyPlanningComplete(save)) {
    return { kind: 'weeklyPlanning' };
  }

  return null;
}

export function isGameInterrupted(save: GameSave) {
  return getActiveGameInterruption(save) !== null;
}
