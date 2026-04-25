import type { GameSave, GameSaveMetadata } from '../domain/types';
import { DEMO_SAVE_DEFINITIONS } from '../game-data/demo-saves';
import { cloneJson } from '../utils/clone';
import { SaveNotFoundError, type SaveProvider } from './save-provider';

export class DemoSaveReadOnlyError extends Error {
  constructor() {
    super('Demo saves are read-only.');
    this.name = 'DemoSaveReadOnlyError';
  }
}

export class DemoSaveProvider implements SaveProvider {
  async listSaves(): Promise<GameSaveMetadata[]> {
    return DEMO_SAVE_DEFINITIONS.map((definition) => ({
      saveId: definition.id,
      ownerName: definition.save.player.ownerName,
      ludusName: definition.save.player.ludusName,
      createdAt: definition.save.createdAt,
      updatedAt: definition.save.updatedAt,
      schemaVersion: definition.save.schemaVersion,
      isDemo: true,
      demoSaveId: definition.id,
    }));
  }

  async loadSave(saveId: string): Promise<GameSave> {
    const definition = DEMO_SAVE_DEFINITIONS.find((item) => item.id === saveId);

    if (!definition) {
      throw new SaveNotFoundError(saveId);
    }

    return cloneJson({
      ...definition.save,
      metadata: {
        ...definition.save.metadata,
        isDemo: true,
        demoSaveId: definition.id,
      },
    });
  }

  async createSave(save: GameSave): Promise<void> {
    void save;
    throw new DemoSaveReadOnlyError();
  }

  async updateSave(save: GameSave): Promise<void> {
    void save;
    throw new DemoSaveReadOnlyError();
  }

  async deleteSave(saveId: string): Promise<void> {
    void saveId;
    throw new DemoSaveReadOnlyError();
  }
}
