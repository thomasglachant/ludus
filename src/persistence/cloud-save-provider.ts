import type { GameSave, GameSaveMetadata } from '../domain/types';
import { cloneJson } from '../utils/clone';
import { SaveNotFoundError, createGameSaveMetadata, type SaveProvider } from './save-provider';

export class CloudSaveProvider implements SaveProvider {
  private readonly saves = new Map<string, GameSave>();

  async listSaves(): Promise<GameSaveMetadata[]> {
    return [...this.saves.values()]
      .map(createGameSaveMetadata)
      .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));
  }

  async loadSave(saveId: string): Promise<GameSave> {
    const save = this.saves.get(saveId);

    if (!save) {
      throw new SaveNotFoundError(saveId);
    }

    return cloneJson(save);
  }

  async createSave(save: GameSave): Promise<void> {
    this.saves.set(save.saveId, cloneJson(save));
  }

  async updateSave(save: GameSave): Promise<void> {
    this.saves.set(save.saveId, cloneJson(save));
  }

  async deleteSave(saveId: string): Promise<void> {
    this.saves.delete(saveId);
  }
}
