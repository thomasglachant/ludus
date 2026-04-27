export interface CombatSceneCombatantViewModel {
  id: string;
  name: string;
  health: number;
  side: 'left' | 'right';
  idleFrames: string[];
  attackFrames: string[];
  healthRatio: number;
}

export interface CombatSceneViewModel {
  backgroundPath: string;
  latestAttackerId?: string;
  left: CombatSceneCombatantViewModel;
  reducedMotion: boolean;
  right: CombatSceneCombatantViewModel;
  currentActionId?: string;
}
