import { beforeEach, describe, expect, it } from 'vitest';
import { CloudSaveProvider } from './cloud-save-provider';
import { DemoSaveProvider } from './demo-save-provider';
import { LocalSaveProvider } from './local-save-provider';
import { SaveService } from './save-service';

describe('SaveService demo saves', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('can start a normal local save from a demo template', async () => {
    const service = new SaveService(
      new LocalSaveProvider(),
      new CloudSaveProvider(),
      new DemoSaveProvider(),
    );
    const demoSave = await service.loadDemoSave('demo-early-ludus');

    const localSave = await service.createLocalSaveFromDemoTemplate({
      ...demoSave,
      ludus: {
        ...demoSave.ludus,
        treasury: 1,
      },
    });

    expect(localSave.saveId).not.toBe('demo-early-ludus');
    expect(localSave.metadata).toEqual({ demoSaveId: 'demo-early-ludus' });
    await expect(service.listLocalSaves()).resolves.toHaveLength(1);

    const updatedSave = await service.updateLocalSave({
      ...localSave,
      ludus: {
        ...localSave.ludus,
        treasury: 2,
      },
      time: {
        ...localSave.time,
        speed: 4,
        isPaused: true,
      },
    });

    await expect(service.loadLocalSave(localSave.saveId)).resolves.toMatchObject({
      ludus: {
        treasury: 2,
      },
      saveId: localSave.saveId,
      time: {
        speed: 1,
        isPaused: false,
      },
      updatedAt: updatedSave.updatedAt,
    });
  });

  it('can save an existing game as a new local save', async () => {
    const service = new SaveService(
      new LocalSaveProvider(),
      new CloudSaveProvider(),
      new DemoSaveProvider(),
    );
    const originalSave = await service.createLocalSave({
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

  it('does not persist the current game speed when saving an existing game as a copy', async () => {
    const service = new SaveService(
      new LocalSaveProvider(),
      new CloudSaveProvider(),
      new DemoSaveProvider(),
    );
    const originalSave = await service.createLocalSave({
      ludusName: 'Ludus Magnus',
      ownerName: 'Marcus',
    });
    const copiedSave = await service.createLocalSaveFromExisting({
      ...originalSave,
      time: {
        ...originalSave.time,
        speed: 8,
        isPaused: true,
      },
    });

    expect(copiedSave.time.speed).toBe(8);
    await expect(service.loadLocalSave(copiedSave.saveId)).resolves.toMatchObject({
      time: {
        speed: 1,
        isPaused: false,
      },
    });
  });
});
