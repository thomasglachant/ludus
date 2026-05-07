import type { GameSave } from '../../domain/types';

export const DEMO_CAMERA_TARGETS = ['ludus', 'market', 'arena'] as const;

export type DemoCameraTarget = (typeof DEMO_CAMERA_TARGETS)[number];

export interface DemoSaveDefinition {
  id: string;
  nameKey: string;
  descriptionKey: string;
  stageKey: string;
  tags: string[];
  save: GameSave;
  preferredRoute?: string;
  preferredCameraTarget?: DemoCameraTarget;
}
