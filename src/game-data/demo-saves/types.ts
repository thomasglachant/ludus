import type { DemoSaveId, GameSave } from '../../domain/types';

export interface DemoSaveDefinition {
  id: DemoSaveId;
  nameKey: string;
  descriptionKey: string;
  stageKey: string;
  tags: string[];
  save: GameSave;
  preferredRoute?: string;
  preferredCameraTarget?: 'ludus' | 'market' | 'arena';
}
