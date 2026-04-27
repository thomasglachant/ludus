import { DEFAULT_ROUTINE_CONFIG, PLANNING_THRESHOLDS } from '../../game-data/planning';
import { TIME_CONFIG } from '../../game-data/time';
import { GAME_BALANCE } from '../../game-data/balance';
import type { BuildingId } from '../buildings/types';
import type { CombatStrategy } from '../combat/types';
import { assignGladiatorMapLocation, getGameMinuteStamp } from '../gladiators/map-movement';
import type { Gladiator } from '../gladiators/types';
import type { GameSave } from '../saves/types';
import { calculateEffectiveReadiness } from './readiness';
import type {
  GameAlert,
  GladiatorRoutine,
  GladiatorWeeklyObjective,
  TrainingIntensity,
} from './types';

export interface PlanningRecommendation {
  buildingId?: BuildingId;
  reasonKey: string;
  isAvailable: boolean;
}

export interface GladiatorPlanningStatus {
  gladiator: Gladiator;
  routine: GladiatorRoutine;
  readiness: number;
  alerts: GameAlert[];
  recommendation: PlanningRecommendation;
}

export interface GladiatorRoutineUpdate {
  objective?: GladiatorWeeklyObjective;
  intensity?: TrainingIntensity;
  allowAutomaticAssignment?: boolean;
  lockedBuildingId?: BuildingId;
  combatStrategy?: CombatStrategy;
}

type GaugeAlertKind =
  | 'criticalHealth'
  | 'lowHealth'
  | 'criticalEnergy'
  | 'lowEnergy'
  | 'criticalSatiety'
  | 'lowSatiety'
  | 'criticalMorale'
  | 'lowMorale';

const alertBuildingTargets: Partial<Record<GaugeAlertKind, BuildingId>> = {
  criticalHealth: 'infirmary',
  lowHealth: 'infirmary',
  criticalEnergy: 'dormitory',
  lowEnergy: 'dormitory',
  criticalSatiety: 'canteen',
  lowSatiety: 'canteen',
  criticalMorale: 'pleasureHall',
  lowMorale: 'pleasureHall',
};

function isSleepTime(hour: number) {
  return hour >= TIME_CONFIG.sleepStartHour || hour < TIME_CONFIG.wakeUpHour;
}

function isArenaAssemblyLocked(save: GameSave, gladiator: Gladiator) {
  return (
    save.time.dayOfWeek === GAME_BALANCE.arena.dayOfWeek &&
    save.time.hour >= GAME_BALANCE.arena.startHour &&
    !save.arena.arenaDay &&
    !save.arena.isArenaDayActive &&
    (gladiator.currentLocationId === 'arena' || gladiator.mapMovement?.targetLocation === 'arena')
  );
}

function isTaskLocked(gladiator: Gladiator, save: GameSave) {
  if (gladiator.currentTaskStartedAt === undefined) {
    return false;
  }

  return (
    getGameMinuteStamp(save.time) - gladiator.currentTaskStartedAt < TIME_CONFIG.minimumTaskMinutes
  );
}

function createDefaultRoutine(gladiatorId: string): GladiatorRoutine {
  return {
    gladiatorId,
    objective: DEFAULT_ROUTINE_CONFIG.objective,
    intensity: DEFAULT_ROUTINE_CONFIG.intensity,
    allowAutomaticAssignment: DEFAULT_ROUTINE_CONFIG.allowAutomaticAssignment,
  };
}

function createGaugeAlert(
  gladiatorId: string,
  kind: GaugeAlertKind,
  severity: GameAlert['severity'],
  createdAt: string,
): GameAlert {
  return {
    id: `alert-${gladiatorId}-${kind}`,
    severity,
    titleKey: `alerts.${kind}.title`,
    descriptionKey: `alerts.${kind}.description`,
    gladiatorId,
    buildingId: alertBuildingTargets[kind],
    createdAt,
  };
}

function addGaugeAlert(
  alerts: GameAlert[],
  gladiator: Gladiator,
  value: number,
  lowThreshold: number,
  criticalThreshold: number,
  lowKind: GaugeAlertKind,
  criticalKind: GaugeAlertKind,
  createdAt: string,
) {
  if (value <= criticalThreshold) {
    alerts.push(createGaugeAlert(gladiator.id, criticalKind, 'critical', createdAt));
    return;
  }

  if (value <= lowThreshold) {
    alerts.push(createGaugeAlert(gladiator.id, lowKind, 'warning', createdAt));
  }
}

function getExistingRoutine(save: GameSave, gladiatorId: string) {
  return save.planning.routines.find((routine) => routine.gladiatorId === gladiatorId);
}

function getAvailableRecommendation(save: GameSave, buildingId: BuildingId, reasonKey: string) {
  return {
    buildingId,
    reasonKey,
    isAvailable: save.buildings[buildingId].isPurchased,
  };
}

function getObjectiveRecommendation(objective: GladiatorWeeklyObjective) {
  switch (objective) {
    case 'fightPreparation':
      return {
        buildingId: 'trainingGround' as const,
        reasonKey: 'weeklyPlan.recommendations.fightPreparation',
      };
    case 'trainStrength':
      return {
        buildingId: 'trainingGround' as const,
        reasonKey: 'weeklyPlan.recommendations.trainStrength',
      };
    case 'trainAgility':
      return {
        buildingId: 'trainingGround' as const,
        reasonKey: 'weeklyPlan.recommendations.trainAgility',
      };
    case 'trainDefense':
      return {
        buildingId: 'trainingGround' as const,
        reasonKey: 'weeklyPlan.recommendations.trainDefense',
      };
    case 'recovery':
      return { buildingId: 'dormitory' as const, reasonKey: 'weeklyPlan.recommendations.recovery' };
    case 'moraleBoost':
      return {
        buildingId: 'pleasureHall' as const,
        reasonKey: 'weeklyPlan.recommendations.moraleBoost',
      };
    case 'protectChampion':
      return {
        buildingId: 'dormitory' as const,
        reasonKey: 'weeklyPlan.recommendations.protectChampion',
      };
    case 'prepareForSale':
      return {
        buildingId: 'pleasureHall' as const,
        reasonKey: 'weeklyPlan.recommendations.prepareForSale',
      };
    case 'balanced':
      return {
        buildingId: 'trainingGround' as const,
        reasonKey: 'weeklyPlan.recommendations.balanced',
      };
  }
}

function getDaytimeObjectiveRecommendation(objective: GladiatorWeeklyObjective) {
  const recommendation = getObjectiveRecommendation(objective);

  if (recommendation.buildingId !== 'dormitory') {
    return recommendation;
  }

  return {
    buildingId: 'infirmary' as const,
    reasonKey: recommendation.reasonKey,
  };
}

export function getRoutineForGladiator(save: GameSave, gladiatorId: string): GladiatorRoutine {
  return getExistingRoutine(save, gladiatorId) ?? createDefaultRoutine(gladiatorId);
}

export function generatePlanningAlerts(save: GameSave, createdAt = save.updatedAt): GameAlert[] {
  const alerts: GameAlert[] = [];

  for (const gladiator of save.gladiators) {
    addGaugeAlert(
      alerts,
      gladiator,
      gladiator.health,
      PLANNING_THRESHOLDS.lowHealth,
      PLANNING_THRESHOLDS.criticalHealth,
      'lowHealth',
      'criticalHealth',
      createdAt,
    );
    addGaugeAlert(
      alerts,
      gladiator,
      gladiator.energy,
      PLANNING_THRESHOLDS.lowEnergy,
      PLANNING_THRESHOLDS.criticalEnergy,
      'lowEnergy',
      'criticalEnergy',
      createdAt,
    );
    addGaugeAlert(
      alerts,
      gladiator,
      gladiator.satiety,
      PLANNING_THRESHOLDS.lowSatiety,
      PLANNING_THRESHOLDS.criticalSatiety,
      'lowSatiety',
      'criticalSatiety',
      createdAt,
    );
    addGaugeAlert(
      alerts,
      gladiator,
      gladiator.morale,
      PLANNING_THRESHOLDS.lowMorale,
      PLANNING_THRESHOLDS.criticalMorale,
      'lowMorale',
      'criticalMorale',
      createdAt,
    );
  }

  return alerts;
}

export function getPlanningRecommendation(
  save: GameSave,
  gladiator: Gladiator,
  routine = getRoutineForGladiator(save, gladiator.id),
): PlanningRecommendation {
  if (!routine.allowAutomaticAssignment) {
    if (!routine.lockedBuildingId) {
      return {
        reasonKey: 'weeklyPlan.recommendations.manualOverride',
        isAvailable: false,
      };
    }

    return getAvailableRecommendation(
      save,
      routine.lockedBuildingId,
      'weeklyPlan.recommendations.manualOverride',
    );
  }

  if (gladiator.health <= PLANNING_THRESHOLDS.lowHealth) {
    return getAvailableRecommendation(save, 'infirmary', 'weeklyPlan.recommendations.health');
  }

  if (isSleepTime(save.time.hour)) {
    return getAvailableRecommendation(save, 'dormitory', 'weeklyPlan.recommendations.energy');
  }

  if (
    !gladiator.mapMovement &&
    gladiator.currentBuildingId === 'canteen' &&
    gladiator.satiety < GAME_BALANCE.gladiators.gauges.maximum
  ) {
    return getAvailableRecommendation(save, 'canteen', 'weeklyPlan.recommendations.satiety');
  }

  if (gladiator.satiety <= PLANNING_THRESHOLDS.lowSatiety) {
    return getAvailableRecommendation(save, 'canteen', 'weeklyPlan.recommendations.satiety');
  }

  if (gladiator.morale <= PLANNING_THRESHOLDS.lowMorale) {
    return getAvailableRecommendation(save, 'pleasureHall', 'weeklyPlan.recommendations.morale');
  }

  const objectiveRecommendation = getDaytimeObjectiveRecommendation(routine.objective);

  return getAvailableRecommendation(
    save,
    objectiveRecommendation.buildingId,
    objectiveRecommendation.reasonKey,
  );
}

export function getGladiatorPlanningStatuses(save: GameSave): GladiatorPlanningStatus[] {
  return save.gladiators.map((gladiator) => {
    const routine = getRoutineForGladiator(save, gladiator.id);
    const alerts = save.planning.alerts.filter((alert) => alert.gladiatorId === gladiator.id);

    return {
      gladiator,
      routine,
      readiness: calculateEffectiveReadiness(save, gladiator),
      alerts,
      recommendation: getPlanningRecommendation(save, gladiator, routine),
    };
  });
}

export function synchronizePlanning(save: GameSave, createdAt = save.updatedAt): GameSave {
  const routines = save.gladiators.map((gladiator) => ({
    ...createDefaultRoutine(gladiator.id),
    ...getExistingRoutine(save, gladiator.id),
  }));
  const saveWithRoutines = {
    ...save,
    planning: {
      ...save.planning,
      year: save.time.year,
      week: save.time.week,
      routines,
    },
  };

  return {
    ...saveWithRoutines,
    planning: {
      ...saveWithRoutines.planning,
      alerts: generatePlanningAlerts(saveWithRoutines, createdAt),
    },
  };
}

export function updateGladiatorRoutine(
  save: GameSave,
  gladiatorId: string,
  update: GladiatorRoutineUpdate,
): GameSave {
  const routine = {
    ...getRoutineForGladiator(save, gladiatorId),
    ...update,
  };
  const routines = [
    ...save.planning.routines.filter(
      (currentRoutine) => currentRoutine.gladiatorId !== gladiatorId,
    ),
    routine,
  ];

  return synchronizePlanning({
    ...save,
    planning: {
      ...save.planning,
      routines,
    },
  });
}

export function setAutomaticAssignment(
  save: GameSave,
  gladiatorId: string,
  allowAutomaticAssignment: boolean,
): GameSave {
  return updateGladiatorRoutine(save, gladiatorId, {
    allowAutomaticAssignment,
    lockedBuildingId: allowAutomaticAssignment
      ? undefined
      : save.gladiators.find((gladiator) => gladiator.id === gladiatorId)?.currentBuildingId,
  });
}

export function setManualBuildingOverride(
  save: GameSave,
  gladiatorId: string,
  buildingId?: BuildingId,
): GameSave {
  return synchronizePlanning({
    ...updateGladiatorRoutine(save, gladiatorId, {
      allowAutomaticAssignment: false,
      lockedBuildingId: buildingId,
    }),
    gladiators: save.gladiators.map((gladiator) =>
      gladiator.id === gladiatorId
        ? {
            ...assignGladiatorMapLocation(gladiator, buildingId, save.time, 'manualOverride'),
          }
        : gladiator,
    ),
  });
}

export function applyPlanningRecommendations(save: GameSave): GameSave {
  const synchronizedSave = synchronizePlanning(save);

  return synchronizePlanning({
    ...synchronizedSave,
    gladiators: synchronizedSave.gladiators.map((gladiator) => {
      const routine = getRoutineForGladiator(synchronizedSave, gladiator.id);

      if (isArenaAssemblyLocked(synchronizedSave, gladiator)) {
        return gladiator;
      }

      if (isSleepTime(synchronizedSave.time.hour)) {
        return assignGladiatorMapLocation(gladiator, 'dormitory', synchronizedSave.time, 'sleep');
      }

      if (!routine.allowAutomaticAssignment) {
        return gladiator;
      }

      if (isTaskLocked(gladiator, synchronizedSave)) {
        return gladiator;
      }

      const recommendation = getPlanningRecommendation(synchronizedSave, gladiator, routine);

      if (!recommendation.buildingId || !recommendation.isAvailable) {
        return gladiator;
      }

      return {
        ...assignGladiatorMapLocation(
          gladiator,
          recommendation.buildingId,
          synchronizedSave.time,
          routine.objective,
        ),
      };
    }),
  });
}
