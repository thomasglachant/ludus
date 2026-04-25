import { READINESS_WEIGHTS } from '../../game-data/planning';
import { getGladiatorReadinessEffectBonus } from '../buildings/building-effects';
import type { Gladiator } from '../gladiators/types';
import type { GameSave } from '../saves/types';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function calculateReadiness(gladiator: Gladiator) {
  const reputationStability = clamp(100 - Math.abs(50 - gladiator.reputation), 0, 100);
  const score =
    gladiator.health * READINESS_WEIGHTS.health +
    gladiator.energy * READINESS_WEIGHTS.energy +
    gladiator.morale * READINESS_WEIGHTS.morale +
    gladiator.satiety * READINESS_WEIGHTS.satiety +
    reputationStability * READINESS_WEIGHTS.reputationStability;

  return Math.round(clamp(score, 0, 100));
}

export function calculateEffectiveReadiness(save: GameSave, gladiator: Gladiator) {
  return Math.round(
    clamp(
      calculateReadiness(gladiator) + getGladiatorReadinessEffectBonus(save, gladiator),
      0,
      100,
    ),
  );
}
