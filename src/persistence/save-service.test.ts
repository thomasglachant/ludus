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
});
