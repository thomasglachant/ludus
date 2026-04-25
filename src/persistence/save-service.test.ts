import { beforeEach, describe, expect, it } from 'vitest';
import { CloudSaveProvider } from './cloud-save-provider';
import { DemoSaveProvider } from './demo-save-provider';
import { LocalSaveProvider } from './local-save-provider';
import { SaveService } from './save-service';

describe('SaveService demo saves', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('does not write demo saves to local storage when updated', async () => {
    const service = new SaveService(
      new LocalSaveProvider(),
      new CloudSaveProvider(),
      new DemoSaveProvider(),
    );
    const demoSave = await service.loadDemoSave('demo-early-ludus');

    await service.updateLocalSave({
      ...demoSave,
      ludus: {
        ...demoSave.ludus,
        treasury: 1,
      },
    });

    await expect(service.listLocalSaves()).resolves.toEqual([]);
    expect(localStorage.getItem('ludus:save:demo-early-ludus')).toBeNull();
  });

  it('can save an existing game as a new local save', async () => {
    const service = new SaveService(
      new LocalSaveProvider(),
      new CloudSaveProvider(),
      new DemoSaveProvider(),
    );
    const originalSave = await service.createLocalSave({
      language: 'en',
      ludusName: 'Ludus Magnus',
      ownerName: 'Marcus',
    });

    const copiedSave = await service.createLocalSaveFromExisting(originalSave, {
      ludusName: 'Ludus Felix',
    });

    expect(copiedSave.saveId).not.toBe(originalSave.saveId);
    expect(copiedSave.player.ludusName).toBe('Ludus Felix');
    await expect(service.listLocalSaves()).resolves.toHaveLength(2);
  });
});
