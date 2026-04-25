import type { ArenaRank, Gladiator } from './types';
import { ARENA_RANK_THRESHOLDS, COMBAT_CONFIG } from '../game-data/combat';

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export function calculateHitChance(attacker: Gladiator, defender: Gladiator): number {
  return clamp(
    COMBAT_CONFIG.baseHitChance +
      attacker.agility * COMBAT_CONFIG.attackerAgilityHitMultiplier -
      defender.agility * COMBAT_CONFIG.defenderAgilityDodgeMultiplier,
    COMBAT_CONFIG.minHitChance,
    COMBAT_CONFIG.maxHitChance,
  );
}

export function calculateDamage(attacker: Gladiator, defender: Gladiator): number {
  const rawDamage =
    COMBAT_CONFIG.baseDamage + attacker.strength * COMBAT_CONFIG.strengthDamageMultiplier;
  const reducedDamage = rawDamage - defender.defense * COMBAT_CONFIG.defenseReductionMultiplier;

  return clamp(Math.round(reducedDamage), COMBAT_CONFIG.minDamage, COMBAT_CONFIG.maxDamage);
}

export function calculateReputation(wins: number, losses: number): number {
  return Math.max(0, wins * 10 - losses * 3);
}

export function getArenaRank(reputation: number): ArenaRank {
  const matchingThreshold = [...ARENA_RANK_THRESHOLDS]
    .reverse()
    .find((threshold) => reputation >= threshold.minimumReputation);

  return matchingThreshold?.rank ?? 'bronze3';
}
