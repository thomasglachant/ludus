import { beforeEach, describe, expect, it } from 'vitest';
import { createInitialSave } from '../domain/saves/create-initial-save';
import { CloudSaveProvider } from './cloud-save-provider';
import { SaveNotFoundError } from './save-provider';

describe('CloudSaveProvider', () => {
  let provider: CloudSaveProvider;

  beforeEach(() => {
    provider = new CloudSaveProvider();
  });

  it('stores, lists and loads a mocked cloud save', async () => {
    const save = createInitialSave({
      ownerName: 'Flavia',
      ludusName: 'Aquila',
      saveId: 'save-cloud',
      createdAt: '2026-04-25T12:00:00.000Z',
    });

    await provider.createSave(save);

    await expect(provider.listSaves()).resolves.toEqual([
      {
        saveId: 'save-cloud',
        ownerName: 'Flavia',
        ludusName: 'Aquila',
        updatedAt: '2026-04-25T12:00:00.000Z',
        schemaVersion: 1,
      },
    ]);
    await expect(provider.loadSave('save-cloud')).resolves.toEqual(save);
  });

  it('does not persist language settings in mocked cloud saves', async () => {
    const save = createInitialSave({
      ownerName: 'Flavia',
      ludusName: 'Aquila',
      saveId: 'save-cloud',
      createdAt: '2026-04-25T12:00:00.000Z',
    });

    await provider.createSave({
      ...save,
      settings: {
        language: 'fr',
      },
    } as typeof save & { settings: { language: 'fr' } });

    await expect(provider.loadSave('save-cloud')).resolves.toEqual(save);
  });

  it('does not expose stored save references', async () => {
    const save = createInitialSave({
      ownerName: 'Flavia',
      ludusName: 'Aquila',
      saveId: 'save-cloud',
      createdAt: '2026-04-25T12:00:00.000Z',
    });

    await provider.createSave(save);
    save.player.ownerName = 'Changed';

    const loadedSave = await provider.loadSave('save-cloud');

    loadedSave.player.ownerName = 'Loaded';

    await expect(provider.loadSave('save-cloud')).resolves.toMatchObject({
      player: {
        ownerName: 'Flavia',
      },
    });
  });

  it('throws when a cloud save is missing', async () => {
    await expect(provider.loadSave('missing')).rejects.toBeInstanceOf(SaveNotFoundError);
  });
});
