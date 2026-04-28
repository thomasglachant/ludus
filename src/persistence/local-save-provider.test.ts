import { beforeEach, describe, expect, it } from 'vitest';
import { CURRENT_SCHEMA_VERSION, createInitialSave } from '../domain/saves/create-initial-save';
import { LocalSaveProvider } from './local-save-provider';
import { CorruptedSaveError } from './save-provider';

describe('LocalSaveProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('writes, lists and loads a local save', async () => {
    const provider = new LocalSaveProvider();
    const save = createInitialSave({
      ludusName: 'Aquila',
      saveId: 'save-local',
      createdAt: '2026-04-25T12:00:00.000Z',
    });

    await provider.createSave(save);

    await expect(provider.listSaves()).resolves.toEqual([
      {
        gameId: 'save-local',
        saveId: 'save-local',
        ludusName: 'Aquila',
        createdAt: '2026-04-25T12:00:00.000Z',
        updatedAt: '2026-04-25T12:00:00.000Z',
        schemaVersion: CURRENT_SCHEMA_VERSION,
      },
    ]);
    await expect(provider.loadSave('save-local')).resolves.toEqual(save);
    expect(localStorage.getItem('ludus:save:save-local')).not.toContain('language');
    expect(localStorage.getItem('ludus:save:save-local')).not.toContain('settings');
  });

  it('loads old saves without keeping persisted language settings', async () => {
    const provider = new LocalSaveProvider();
    const save = createInitialSave({
      ludusName: 'Aquila',
      saveId: 'save-local',
      createdAt: '2026-04-25T12:00:00.000Z',
    });

    localStorage.setItem('ludus:save-index', JSON.stringify(['save-local']));
    localStorage.setItem(
      'ludus:save:save-local',
      JSON.stringify({
        ...save,
        schemaVersion: 1,
        player: {
          ...save.player,
          ownerName: 'Flavia',
        },
        settings: {
          language: 'fr',
        },
      }),
    );

    await expect(provider.loadSave('save-local')).resolves.toEqual(save);
  });

  it('does not persist pending or resolved events', async () => {
    const provider = new LocalSaveProvider();
    const save = createInitialSave({
      ludusName: 'Aquila',
      saveId: 'save-local',
      createdAt: '2026-04-25T12:00:00.000Z',
    });
    const event = {
      id: 'event-1',
      titleKey: 'events.test.title',
      descriptionKey: 'events.test.description',
      status: 'pending' as const,
      createdAtYear: save.time.year,
      createdAtWeek: save.time.week,
      createdAtDay: save.time.dayOfWeek,
      choices: [
        {
          id: 'choice-1',
          labelKey: 'events.test.choice',
          consequenceKey: 'events.test.consequence',
          effects: [{ type: 'changeTreasury' as const, amount: 10 }],
        },
      ],
    };

    await provider.createSave({
      ...save,
      events: {
        pendingEvents: [event],
        resolvedEvents: [{ ...event, status: 'resolved', selectedChoiceId: 'choice-1' }],
      },
    });

    expect(localStorage.getItem('ludus:save:save-local')).not.toContain('event-1');
    await expect(provider.loadSave('save-local')).resolves.toMatchObject({
      events: {
        pendingEvents: [],
        resolvedEvents: [],
      },
    });
  });

  it('rejects saves with invalid nested game state', async () => {
    const save = createInitialSave({
      ludusName: 'Aquila',
      saveId: 'broken',
      createdAt: '2026-04-25T12:00:00.000Z',
    });

    localStorage.setItem('ludus:save-index', JSON.stringify(['broken']));
    localStorage.setItem(
      'ludus:save:broken',
      JSON.stringify({
        ...save,
        gladiators: [{ id: 'gladiator-broken' }],
      }),
    );

    await expect(new LocalSaveProvider().loadSave('broken')).rejects.toBeInstanceOf(
      CorruptedSaveError,
    );
  });

  it('ignores corrupted saves in the metadata list', async () => {
    localStorage.setItem('ludus:save-index', JSON.stringify(['broken']));
    localStorage.setItem('ludus:save:broken', '{');

    await expect(new LocalSaveProvider().listSaves()).resolves.toEqual([]);
    expect(localStorage.getItem('ludus:save-index')).toBe('[]');
  });

  it('throws a corrupted save error when loading invalid save data', async () => {
    localStorage.setItem('ludus:save-index', JSON.stringify(['broken']));
    localStorage.setItem('ludus:save:broken', '{');

    await expect(new LocalSaveProvider().loadSave('broken')).rejects.toBeInstanceOf(
      CorruptedSaveError,
    );
  });
});
