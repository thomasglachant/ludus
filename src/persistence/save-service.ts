import { createInitialSave } from '../domain/saves/create-initial-save';
import type { GameSave, GameSaveMetadata } from '../domain/types';
import { createId } from '../utils/id';
import { SaveNotFoundError } from './save-provider';
import type { SaveProvider } from './save-provider';

export interface CreateSaveInput {
  ludusName: string;
}

export interface SaveAsInput {
  ludusName?: string;
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

  async loadLatestLocalSaveForGame(gameId: string): Promise<GameSave> {
    const latestSave = (await this.listLocalSaves()).find((save) => save.gameId === gameId);

    if (!latestSave) {
      throw new SaveNotFoundError(gameId);
    }

    return this.loadLocalSave(latestSave.saveId);
  }

  async createLocalSave(input: CreateSaveInput): Promise<GameSave> {
    const save = createInitialSave({
      ludusName: input.ludusName,
      gameId: createId('game'),
      saveId: createId('save'),
      createdAt: new Date().toISOString(),
    });

    await this.localSaveProvider.createSave(save);

    return save;
  }

  async updateLocalSave(save: GameSave): Promise<GameSave> {
    const updatedSave = this.withUpdatedAt(save);

    await this.localSaveProvider.updateSave(updatedSave);

    return updatedSave;
  }

  async createLocalSaveFromExisting(save: GameSave, input: SaveAsInput = {}): Promise<GameSave> {
    const now = new Date().toISOString();
    const ludusName = input.ludusName?.trim() || save.player.ludusName;
    const localSave: GameSave = {
      ...save,
      saveId: createId('save'),
      createdAt: now,
      updatedAt: now,
      metadata: undefined,
      player: {
        ...save.player,
        ludusName,
        isCloudUser: false,
      },
    };

    await this.localSaveProvider.createSave(localSave);

    return localSave;
  }

  async createLocalSaveFromDemoTemplate(save: GameSave): Promise<GameSave> {
    const now = new Date().toISOString();
    const localSave: GameSave = {
      ...save,
      gameId: createId('game'),
      saveId: createId('save'),
      createdAt: now,
      updatedAt: now,
      metadata: save.metadata?.demoSaveId
        ? {
            demoSaveId: save.metadata.demoSaveId,
          }
        : undefined,
      player: {
        ...save.player,
        isCloudUser: false,
      },
    };

    await this.localSaveProvider.createSave(localSave);

    return localSave;
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
    const cloudSave = this.asCloudSave(save);

    await this.cloudSaveProvider.createSave(cloudSave);

    return cloudSave;
  }

  async updateCloudSave(save: GameSave): Promise<GameSave> {
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
