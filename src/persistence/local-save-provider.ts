import type { GameSave, GameSaveMetadata } from '../domain/types';
import { normalizeGameSave, parseGameSave } from '../domain/saves/save-validation';
import {
  CorruptedSaveError,
  SaveNotFoundError,
  createGameSaveMetadata,
  type SaveProvider,
} from './save-provider';

const SAVE_INDEX_KEY = 'ludus:save-index';
const SAVE_KEY_PREFIX = 'ludus:save:';

function getSaveKey(saveId: string) {
  return `${SAVE_KEY_PREFIX}${saveId}`;
}

function areStringListsEqual(first: string[], second: string[]) {
  return first.length === second.length && first.every((value, index) => value === second[index]);
}

export class LocalSaveProvider implements SaveProvider {
  async listSaves(): Promise<GameSaveMetadata[]> {
    const indexedSaveIds = [...new Set(this.readIndex())];
    const saves = indexedSaveIds
      .map((saveId) => this.readSaveFromStorage(saveId))
      .filter((save): save is GameSave => save !== null);
    const nextIndex = saves.map((save) => save.saveId);

    if (!areStringListsEqual(indexedSaveIds, nextIndex)) {
      this.writeIndex(nextIndex);
    }

    return saves
      .map((save, index) => ({ index, metadata: createGameSaveMetadata(save) }))
      .sort((first, second) => {
        const updatedAtComparison = second.metadata.updatedAt.localeCompare(
          first.metadata.updatedAt,
        );

        return updatedAtComparison || second.index - first.index;
      })
      .map((save) => save.metadata);
  }

  async loadSave(saveId: string): Promise<GameSave> {
    const rawSave = localStorage.getItem(getSaveKey(saveId));

    if (!rawSave) {
      throw new SaveNotFoundError(saveId);
    }

    const save = parseGameSave(rawSave);

    if (!save) {
      throw new CorruptedSaveError(saveId);
    }

    if (save.saveId !== saveId) {
      throw new CorruptedSaveError(saveId);
    }

    return save;
  }

  async createSave(save: GameSave): Promise<void> {
    this.writeSave(save);
  }

  async updateSave(save: GameSave): Promise<void> {
    this.writeSave(save);
  }

  async deleteSave(saveId: string): Promise<void> {
    localStorage.removeItem(getSaveKey(saveId));
    this.writeIndex(this.readIndex().filter((indexedSaveId) => indexedSaveId !== saveId));
  }

  private writeSave(save: GameSave) {
    localStorage.setItem(getSaveKey(save.saveId), JSON.stringify(normalizeGameSave(save)));
    this.writeIndex([...new Set([...this.readIndex(), save.saveId])]);
  }

  private readSaveFromStorage(saveId: string) {
    const rawSave = localStorage.getItem(getSaveKey(saveId));

    if (!rawSave) {
      return null;
    }

    const save = parseGameSave(rawSave);

    return save?.saveId === saveId ? save : null;
  }

  private readIndex() {
    const rawIndex = localStorage.getItem(SAVE_INDEX_KEY);

    if (!rawIndex) {
      return [];
    }

    try {
      const parsed = JSON.parse(rawIndex) as unknown;

      return Array.isArray(parsed)
        ? parsed.filter((saveId): saveId is string => typeof saveId === 'string')
        : [];
    } catch {
      return [];
    }
  }

  private writeIndex(saveIds: string[]) {
    localStorage.setItem(SAVE_INDEX_KEY, JSON.stringify(saveIds));
  }
}
