import { PROGRESSION_CONFIG } from '../../game-data/progression';
import { DAYS_OF_WEEK } from '../../game-data/time';
import type { GameSave } from '../saves/types';
import type { GameDate } from '../time/types';
import type { GameNotification, GameNotificationParams, GameNotificationTarget } from './types';

export interface GameNotificationInput {
  descriptionKey: string;
  id?: string;
  params?: GameNotificationParams;
  target?: GameNotificationTarget;
  titleKey: string;
}

export function getGameDateFromSave(save: GameSave): GameDate {
  return {
    year: save.time.year,
    week: save.time.week,
    dayOfWeek: save.time.dayOfWeek,
  };
}

function getAbsoluteDay(date: GameDate) {
  const weekIndex = (date.year - 1) * PROGRESSION_CONFIG.weeksPerYear + (date.week - 1);
  const dayIndex = DAYS_OF_WEEK.indexOf(date.dayOfWeek);

  return weekIndex * DAYS_OF_WEEK.length + dayIndex;
}

function createGameNotificationId(save: GameSave, date: GameDate) {
  return `notification-${date.year}-${date.week}-${date.dayOfWeek}-${save.notifications.length + 1}`;
}

export function sortGameNotificationsByDateDesc(notifications: GameNotification[]) {
  return notifications
    .map((notification, index) => ({ index, notification }))
    .sort((left, right) => {
      const dateDelta =
        getAbsoluteDay(right.notification.occurredAt) -
        getAbsoluteDay(left.notification.occurredAt);

      return dateDelta || right.index - left.index;
    })
    .map(({ notification }) => notification);
}

export function addGameNotification(save: GameSave, input: GameNotificationInput): GameSave {
  const occurredAt = getGameDateFromSave(save);
  const notification: GameNotification = {
    id: input.id ?? createGameNotificationId(save, occurredAt),
    occurredAt,
    titleKey: input.titleKey,
    descriptionKey: input.descriptionKey,
    params: input.params,
    target: input.target,
  };

  return {
    ...save,
    notifications: [...save.notifications, notification],
  };
}

export function archiveGameNotification(save: GameSave, notificationId: string): GameSave {
  const notification = save.notifications.find((candidate) => candidate.id === notificationId);

  if (!notification || notification.archivedAt) {
    return save;
  }

  const archivedAt = getGameDateFromSave(save);

  return {
    ...save,
    notifications: save.notifications.map((candidate) =>
      candidate.id === notificationId ? { ...candidate, archivedAt } : candidate,
    ),
  };
}
