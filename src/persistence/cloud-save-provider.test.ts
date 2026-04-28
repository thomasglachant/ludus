import { beforeEach, describe, expect, it } from 'vitest';
import { CURRENT_SCHEMA_VERSION, createInitialSave } from '../domain/saves/create-initial-save';
import { CloudSaveProvider } from './cloud-save-provider';
import { SaveNotFoundError } from './save-provider';

describe('CloudSaveProvider', () => {
  let provider: CloudSaveProvider;

  beforeEach(() => {
    provider = new CloudSaveProvider();
  });

  it('stores, lists and loads a mocked cloud save', async () => {
    const save = createInitialSave({
      ludusName: 'Aquila',
      saveId: 'save-cloud',
      createdAt: '2026-04-25T12:00:00.000Z',
    });

    await provider.createSave(save);

    await expect(provider.listSaves()).resolves.toEqual([
      {
        gameId: 'save-cloud',
        saveId: 'save-cloud',
        ludusName: 'Aquila',
        createdAt: '2026-04-25T12:00:00.000Z',
        updatedAt: '2026-04-25T12:00:00.000Z',
        schemaVersion: CURRENT_SCHEMA_VERSION,
      },
    ]);
    await expect(provider.loadSave('save-cloud')).resolves.toEqual(save);
  });

  it('does not persist language settings in mocked cloud saves', async () => {
    const save = createInitialSave({
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
      ludusName: 'Aquila',
      saveId: 'save-cloud',
      createdAt: '2026-04-25T12:00:00.000Z',
    });

    await provider.createSave(save);
    save.player.ludusName = 'Changed';

    const loadedSave = await provider.loadSave('save-cloud');

    loadedSave.player.ludusName = 'Loaded';

    await expect(provider.loadSave('save-cloud')).resolves.toMatchObject({
      player: {
        ludusName: 'Aquila',
      },
    });
  });

  it('throws when a cloud save is missing', async () => {
    await expect(provider.loadSave('missing')).rejects.toBeInstanceOf(SaveNotFoundError);
  });
});
