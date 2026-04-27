import { READINESS_CONFIG, READINESS_WEIGHTS } from '../../game-data/planning';
import { getGladiatorReadinessEffectBonus } from '../buildings/building-effects';
import type { Gladiator } from '../gladiators/types';
import type { GameSave } from '../saves/types';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function calculateReadiness(gladiator: Gladiator) {
  const reputationStability = clamp(
    READINESS_CONFIG.maximum -
      Math.abs(READINESS_CONFIG.reputationStabilityCenter - gladiator.reputation),
    READINESS_CONFIG.minimum,
    READINESS_CONFIG.maximum,
  );
  const score =
    gladiator.health * READINESS_WEIGHTS.health +
    gladiator.energy * READINESS_WEIGHTS.energy +
    gladiator.morale * READINESS_WEIGHTS.morale +
    gladiator.satiety * READINESS_WEIGHTS.satiety +
    reputationStability * READINESS_WEIGHTS.reputationStability;

  return Math.round(clamp(score, READINESS_CONFIG.minimum, READINESS_CONFIG.maximum));
}

export function calculateEffectiveReadiness(save: GameSave, gladiator: Gladiator) {
  return Math.round(
    clamp(
      calculateReadiness(gladiator) + getGladiatorReadinessEffectBonus(save, gladiator),
      READINESS_CONFIG.minimum,
      READINESS_CONFIG.maximum,
    ),
  );
}
