import { describe, expect, it } from 'vitest';
import { createInitialSave } from '../saves/create-initial-save';
import type { GameSave } from '../saves/types';
import {
  addGameNotification,
  archiveGameNotification,
  sortGameNotificationsByDateDesc,
} from './notification-actions';

function createTestSave(overrides: Partial<GameSave> = {}): GameSave {
  const save = createInitialSave({
    ludusName: 'Ludus Magnus',
    saveId: 'save-test',
    createdAt: '2026-04-25T12:00:00.000Z',
  });

  return {
    ...save,
    ...overrides,
  };
}

describe('notification actions', () => {
  it('adds notifications with the current game date and stable ids', () => {
    const save = addGameNotification(createTestSave(), {
      titleKey: 'notifications.injury.title',
      descriptionKey: 'notifications.injury.description',
      params: { name: 'Aulus' },
      target: { kind: 'gladiator', gladiatorId: 'gladiator-test' },
    });

    expect(save.notifications).toEqual([
      {
        id: 'notification-1-1-monday-1',
        occurredAt: { year: 1, week: 1, dayOfWeek: 'monday' },
        titleKey: 'notifications.injury.title',
        descriptionKey: 'notifications.injury.description',
        params: { name: 'Aulus' },
        target: { kind: 'gladiator', gladiatorId: 'gladiator-test' },
      },
    ]);
  });

  it('archives notifications with the current game date', () => {
    const save = addGameNotification(createTestSave(), {
      titleKey: 'notifications.injury.title',
      descriptionKey: 'notifications.injury.description',
    });
    const archived = archiveGameNotification(save, 'notification-1-1-monday-1');

    expect(archived.notifications[0].archivedAt).toEqual({
      year: 1,
      week: 1,
      dayOfWeek: 'monday',
    });
    expect(archiveGameNotification(archived, 'notification-1-1-monday-1')).toBe(archived);
  });

  it('sorts notifications by descending game date then descending insertion order', () => {
    const save = createTestSave({
      notifications: [
        {
          id: 'old',
          occurredAt: { year: 1, week: 1, dayOfWeek: 'monday' },
          titleKey: 'old',
          descriptionKey: 'old',
        },
        {
          id: 'same-day-first',
          occurredAt: { year: 1, week: 1, dayOfWeek: 'wednesday' },
          titleKey: 'same-day-first',
          descriptionKey: 'same-day-first',
        },
        {
          id: 'same-day-second',
          occurredAt: { year: 1, week: 1, dayOfWeek: 'wednesday' },
          titleKey: 'same-day-second',
          descriptionKey: 'same-day-second',
        },
        {
          id: 'new',
          occurredAt: { year: 1, week: 2, dayOfWeek: 'monday' },
          titleKey: 'new',
          descriptionKey: 'new',
        },
      ],
    });

    expect(
      sortGameNotificationsByDateDesc(save.notifications).map((notification) => notification.id),
    ).toEqual(['new', 'same-day-second', 'same-day-first', 'old']);
  });
});
