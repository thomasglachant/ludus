import { describe, expect, it } from 'vitest';
import { createInitialSave } from '../saves/create-initial-save';
import type { Gladiator } from '../gladiators/types';
import type { GameSave } from '../saves/types';
import {
  addGameNotification,
  addGladiatorLevelUpNotifications,
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

function createGladiator(overrides: Partial<Gladiator> = {}): Gladiator {
  return {
    id: 'gladiator-test',
    name: 'Aulus',
    age: 20,
    experience: 0,
    strength: 3,
    agility: 3,
    defense: 2,
    life: 2,
    reputation: 0,
    wins: 0,
    losses: 0,
    traits: [],
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

  it('adds level-up notifications for gladiators that crossed a level threshold', () => {
    const previousGladiator = createGladiator({ experience: 99 });
    const save = createTestSave({
      gladiators: [{ ...previousGladiator, experience: 100 }],
    });

    const result = addGladiatorLevelUpNotifications(save, [previousGladiator]);

    expect(result.notifications).toEqual([
      expect.objectContaining({
        id: 'notification-1-1-monday-1',
        titleKey: 'notifications.levelUp.title',
        descriptionKey: 'notifications.levelUp.description',
        params: { name: 'Aulus', level: 2 },
        target: { kind: 'gladiator', gladiatorId: 'gladiator-test' },
      }),
    ]);
  });

  it('does not add level-up notifications when the level is unchanged', () => {
    const previousGladiator = createGladiator({ experience: 80 });
    const save = createTestSave({
      gladiators: [{ ...previousGladiator, experience: 90 }],
    });

    expect(addGladiatorLevelUpNotifications(save, [previousGladiator])).toBe(save);
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
