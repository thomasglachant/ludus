import { createInitialSave } from '../domain/saves/create-initial-save';
import type { GameSave, GameSaveMetadata, LanguageCode } from '../domain/types';
import { createId } from '../utils/id';
import { SaveNotFoundError } from './save-provider';
import type { SaveProvider } from './save-provider';

export interface CreateSaveInput {
  ownerName: string;
  ludusName: string;
  language: LanguageCode;
}

export class SaveService {
  private readonly localSaveProvider: SaveProvider;
  private readonly cloudSaveProvider: SaveProvider;
  private readonly demoSaveProvider?: SaveProvider;

  constructor(
    localSaveProvider: SaveProvider,
    cloudSaveProvider: SaveProvider,
    demoSaveProvider?: SaveProvider,
  ) {
    this.localSaveProvider = localSaveProvider;
    this.cloudSaveProvider = cloudSaveProvider;
    this.demoSaveProvider = demoSaveProvider;
  }

  async listLocalSaves(): Promise<GameSaveMetadata[]> {
    return this.localSaveProvider.listSaves();
  }

  async loadLocalSave(saveId: string): Promise<GameSave> {
    return this.localSaveProvider.loadSave(saveId);
  }

  async createLocalSave(input: CreateSaveInput): Promise<GameSave> {
    const save = createInitialSave({
      ownerName: input.ownerName,
      ludusName: input.ludusName,
      language: input.language,
      saveId: createId('save'),
      createdAt: new Date().toISOString(),
    });

    await this.localSaveProvider.createSave(save);

    return save;
  }

  async updateLocalSave(save: GameSave): Promise<GameSave> {
    if (save.metadata?.isDemo) {
      return save;
    }

    const updatedSave = this.withUpdatedAt(save);

    await this.localSaveProvider.updateSave(updatedSave);

    return updatedSave;
  }

  async deleteLocalSave(saveId: string): Promise<void> {
    await this.localSaveProvider.deleteSave(saveId);
  }

  async listCloudSaves(): Promise<GameSaveMetadata[]> {
    return this.cloudSaveProvider.listSaves();
  }

  async loadCloudSave(saveId: string): Promise<GameSave> {
    return this.cloudSaveProvider.loadSave(saveId);
  }

  async createCloudSave(save: GameSave): Promise<GameSave> {
    if (save.metadata?.isDemo) {
      return save;
    }

    const cloudSave = this.asCloudSave(save);

    await this.cloudSaveProvider.createSave(cloudSave);

    return cloudSave;
  }

  async updateCloudSave(save: GameSave): Promise<GameSave> {
    if (save.metadata?.isDemo) {
      return save;
    }

    const cloudSave = this.asCloudSave(this.withUpdatedAt(save));

    await this.cloudSaveProvider.updateSave(cloudSave);

    return cloudSave;
  }

  async deleteCloudSave(saveId: string): Promise<void> {
    await this.cloudSaveProvider.deleteSave(saveId);
  }

  async listDemoSaves(): Promise<GameSaveMetadata[]> {
    return this.demoSaveProvider?.listSaves() ?? [];
  }

  async loadDemoSave(saveId: string): Promise<GameSave> {
    if (!this.demoSaveProvider) {
      throw new SaveNotFoundError(saveId);
    }

    return this.demoSaveProvider.loadSave(saveId);
  }

  private withUpdatedAt(save: GameSave): GameSave {
    return {
      ...save,
      updatedAt: new Date().toISOString(),
    };
  }

  private asCloudSave(save: GameSave): GameSave {
    return {
      ...save,
      player: {
        ...save.player,
        isCloudUser: true,
      },
    };
  }
}
