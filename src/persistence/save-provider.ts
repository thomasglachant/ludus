import type { GameSave, GameSaveMetadata } from '../domain/types';

export interface SaveProvider {
  listSaves(): Promise<GameSaveMetadata[]>;
  loadSave(saveId: string): Promise<GameSave>;
  createSave(save: GameSave): Promise<void>;
  updateSave(save: GameSave): Promise<void>;
  deleteSave(saveId: string): Promise<void>;
}

export function createGameSaveMetadata(save: GameSave): GameSaveMetadata {
  return {
    gameId: save.gameId,
    saveId: save.saveId,
    ludusName: save.player.ludusName,
    createdAt: save.createdAt,
    updatedAt: save.updatedAt,
    schemaVersion: save.schemaVersion,
  };
}

export class SaveNotFoundError extends Error {
  constructor(saveId: string) {
    super(`Save not found: ${saveId}`);
    this.name = 'SaveNotFoundError';
  }
}

export class CorruptedSaveError extends Error {
  constructor(saveId: string) {
    super(`Save is corrupted: ${saveId}`);
    this.name = 'CorruptedSaveError';
  }
}
