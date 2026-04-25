import type { BuildingId, GameAlert, Gladiator, GladiatorRoutine } from './types';
import { PLANNING_THRESHOLDS, READINESS_WEIGHTS } from '../game-data/planning';

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export function calculateReadinessScore(gladiator: Gladiator): number {
  const reputationStability = clamp(gladiator.reputation / 10, 0, 100);

  return Math.round(
    clamp(
      gladiator.health * READINESS_WEIGHTS.health +
        gladiator.energy * READINESS_WEIGHTS.energy +
        gladiator.morale * READINESS_WEIGHTS.morale +
        gladiator.satiety * READINESS_WEIGHTS.satiety +
        reputationStability * READINESS_WEIGHTS.reputationStability,
      0,
      100,
    ),
  );
}

export function recommendBuildingForGladiator(
  gladiator: Gladiator,
  routine?: GladiatorRoutine,
): BuildingId {
  if (routine?.lockedBuildingId) return routine.lockedBuildingId;

  if (gladiator.health <= PLANNING_THRESHOLDS.criticalHealth) return 'infirmary';
  if (gladiator.energy <= PLANNING_THRESHOLDS.criticalEnergy) return 'dormitory';
  if (gladiator.satiety <= PLANNING_THRESHOLDS.criticalSatiety) return 'canteen';
  if (gladiator.morale <= PLANNING_THRESHOLDS.criticalMorale) return 'pleasureHall';

  switch (routine?.objective) {
    case 'recovery':
    case 'protectChampion':
      return gladiator.health < PLANNING_THRESHOLDS.lowHealth ? 'infirmary' : 'dormitory';
    case 'moraleBoost':
      return 'pleasureHall';
    case 'fightPreparation':
      if (gladiator.energy < PLANNING_THRESHOLDS.lowEnergy) return 'dormitory';
      if (gladiator.satiety < PLANNING_THRESHOLDS.lowSatiety) return 'canteen';
      return 'trainingGround';
    case 'trainStrength':
    case 'trainAgility':
    case 'trainDefense':
    case 'prepareForSale':
    case 'balanced':
    default:
      return 'trainingGround';
  }
}

export function generateGladiatorAlerts(gladiator: Gladiator, nowIso: string): GameAlert[] {
  const alerts: GameAlert[] = [];

  if (gladiator.health <= PLANNING_THRESHOLDS.criticalHealth) {
    alerts.push({
      id: `${gladiator.id}-critical-health`,
      severity: 'critical',
      titleKey: 'alerts.criticalHealth.title',
      descriptionKey: 'alerts.criticalHealth.description',
      gladiatorId: gladiator.id,
      createdAt: nowIso,
    });
  }

  if (gladiator.energy <= PLANNING_THRESHOLDS.criticalEnergy) {
    alerts.push({
      id: `${gladiator.id}-critical-energy`,
      severity: 'warning',
      titleKey: 'alerts.criticalEnergy.title',
      descriptionKey: 'alerts.criticalEnergy.description',
      gladiatorId: gladiator.id,
      createdAt: nowIso,
    });
  }

  if (gladiator.morale <= PLANNING_THRESHOLDS.criticalMorale) {
    alerts.push({
      id: `${gladiator.id}-critical-morale`,
      severity: 'warning',
      titleKey: 'alerts.criticalMorale.title',
      descriptionKey: 'alerts.criticalMorale.description',
      gladiatorId: gladiator.id,
      createdAt: nowIso,
    });
  }

  if (gladiator.satiety <= PLANNING_THRESHOLDS.criticalSatiety) {
    alerts.push({
      id: `${gladiator.id}-critical-satiety`,
      severity: 'warning',
      titleKey: 'alerts.criticalSatiety.title',
      descriptionKey: 'alerts.criticalSatiety.description',
      gladiatorId: gladiator.id,
      createdAt: nowIso,
    });
  }

  return alerts;
}
