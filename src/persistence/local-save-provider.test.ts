import { beforeEach, describe, expect, it } from 'vitest';
import { createInitialSave } from '../domain/saves/create-initial-save';
import { LocalSaveProvider } from './local-save-provider';
import { CorruptedSaveError } from './save-provider';

describe('LocalSaveProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('writes, lists and loads a local save', async () => {
    const provider = new LocalSaveProvider();
    const save = createInitialSave({
      ownerName: 'Flavia',
      ludusName: 'Aquila',
      language: 'en',
      saveId: 'save-local',
      createdAt: '2026-04-25T12:00:00.000Z',
    });

    await provider.createSave(save);

    await expect(provider.listSaves()).resolves.toEqual([
      {
        saveId: 'save-local',
        ownerName: 'Flavia',
        ludusName: 'Aquila',
        updatedAt: '2026-04-25T12:00:00.000Z',
        schemaVersion: 1,
      },
    ]);
    await expect(provider.loadSave('save-local')).resolves.toEqual(save);
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
