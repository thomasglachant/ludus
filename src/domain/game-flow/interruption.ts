import type { GameSave } from '../saves/types';

export type GameInterruption = { kind: 'dailyEvent'; eventId: string } | { kind: 'sundayArena' };

export function getActiveGameInterruption(save: GameSave): GameInterruption | null {
  const pendingEvent = save.events.pendingEvents[0];

  if (pendingEvent) {
    return { kind: 'dailyEvent', eventId: pendingEvent.id };
  }

  if (save.arena.arenaDay) {
    return { kind: 'sundayArena' };
  }

  return null;
}

export function isGameInterrupted(save: GameSave) {
  return getActiveGameInterruption(save) !== null;
}
