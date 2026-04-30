import type {
  GladiatorCombatAnimationDefinition,
  GladiatorCombatAnimationId,
} from '../../../game-data/gladiator-animations';

export interface CombatSceneCombatantViewModel {
  animation: GladiatorCombatAnimationDefinition;
  animationId: GladiatorCombatAnimationId;
  animationRevision: string;
  fallbackFramePaths: string[];
  frameNames: string[];
  health: number;
  healthRatio: number;
  id: string;
  name: string;
  side: 'left' | 'right';
  spritesheetAtlasPath?: string;
}

export interface CombatSceneTurnEffectViewModel {
  attackerSide: 'left' | 'right';
  defenderSide: 'left' | 'right';
  didHit: boolean;
  dodgeLabel?: string;
  healthDelta: number;
  id: string;
}

export interface CombatSceneViewModel {
  backgroundPath: string;
  crowdPath: string;
  currentActionId?: string;
  effect?: CombatSceneTurnEffectViewModel;
  left: CombatSceneCombatantViewModel;
  reducedMotion: boolean;
  right: CombatSceneCombatantViewModel;
}
