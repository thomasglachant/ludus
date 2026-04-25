import { BUILDING_IMPROVEMENTS, BUILDING_POLICIES } from '../../game-data/building-improvements';
import { BUILDING_DEFINITIONS } from '../../game-data/buildings';
import { DAYS_OF_WEEK, TIME_CONFIG, TRAINING_INTENSITY_EFFECTS } from '../../game-data/time';
import type { BuildingEffect, BuildingId, GameSave, GameSpeed, GameTickContext } from '../types';
import { synchronizeArena, synchronizeBetting } from '../combat/combat-actions';
import { synchronizeContracts } from '../contracts/contract-actions';
import { synchronizeEvents } from '../events/event-actions';
import {
  applyPlanningRecommendations,
  getRoutineForGladiator,
  synchronizePlanning,
} from '../planning/planning-actions';
import type { Gladiator } from '../gladiators/types';
import type { GameTimeState } from './types';

export interface GameTickResult {
  save: GameSave;
  advancedGameMinutes: number;
  appliedEffectHours: number;
  effectAccumulatorMinutes: number;
}

type GladiatorNumericField =
  | 'strength'
  | 'agility'
  | 'defense'
  | 'energy'
  | 'health'
  | 'morale'
  | 'satiety';

const effectFieldByType: Partial<Record<BuildingEffect['type'], GladiatorNumericField>> = {
  increaseSatiety: 'satiety',
  increaseEnergy: 'energy',
  increaseHealth: 'health',
  increaseMorale: 'morale',
  increaseStrength: 'strength',
  increaseAgility: 'agility',
  increaseDefense: 'defense',
  decreaseEnergy: 'energy',
  decreaseMorale: 'morale',
};

const decreasingEffects = new Set<BuildingEffect['type']>(['decreaseEnergy', 'decreaseMorale']);

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundStat(value: number) {
  return Math.round(value);
}

function getNextWeekState(year: number, week: number) {
  const nextWeek = week + 1;

  if (nextWeek > 8) {
    return {
      year: year + 1,
      week: 1,
    };
  }

  return {
    year,
    week: nextWeek,
  };
}

function advanceDay(time: GameTimeState): GameTimeState {
  const currentDayIndex = DAYS_OF_WEEK.indexOf(time.dayOfWeek);
  const nextDayIndex = (currentDayIndex + 1) % DAYS_OF_WEEK.length;
  const nextDayOfWeek = DAYS_OF_WEEK[nextDayIndex];

  if (time.dayOfWeek !== 'sunday') {
    return {
      ...time,
      dayOfWeek: nextDayOfWeek,
    };
  }

  return {
    ...time,
    ...getNextWeekState(time.year, time.week),
    dayOfWeek: nextDayOfWeek,
  };
}

function getAdvancedGameMinutes(elapsedRealMilliseconds: number, speed: GameSpeed) {
  if (speed === 0 || elapsedRealMilliseconds <= 0) {
    return 0;
  }

  return Math.floor(
    (elapsedRealMilliseconds * speed * TIME_CONFIG.minutesPerHour) /
      TIME_CONFIG.realMillisecondsPerGameHour,
  );
}

function getCurrentLevelEffects(save: GameSave, buildingId: BuildingId) {
  const building = save.buildings[buildingId];

  if (!building.isPurchased || building.level <= 0) {
    return [];
  }

  return (
    BUILDING_DEFINITIONS[buildingId].levels.find((level) => level.level === building.level)
      ?.effects ?? []
  );
}

function getPurchasedImprovementEffects(save: GameSave, buildingId: BuildingId) {
  const building = save.buildings[buildingId];

  return BUILDING_IMPROVEMENTS.filter(
    (improvement) =>
      improvement.buildingId === buildingId &&
      building.purchasedImprovementIds.includes(improvement.id),
  ).flatMap((improvement) => improvement.effects);
}

function getSelectedPolicyEffects(save: GameSave, buildingId: BuildingId) {
  const building = save.buildings[buildingId];

  if (!building.selectedPolicyId) {
    return [];
  }

  return (
    BUILDING_POLICIES.find(
      (policy) =>
        policy.buildingId === buildingId &&
        policy.id === building.selectedPolicyId &&
        policy.requiredBuildingLevel <= building.level,
    )?.effects ?? []
  );
}

function getHourlyEffects(save: GameSave, buildingId: BuildingId) {
  return [
    ...getCurrentLevelEffects(save, buildingId),
    ...getPurchasedImprovementEffects(save, buildingId),
    ...getSelectedPolicyEffects(save, buildingId),
  ].filter((effect) => effect.perHour);
}

function getTrainingStatEffectType(gladiator: Gladiator, save: GameSave): BuildingEffect['type'] {
  const routine = getRoutineForGladiator(save, gladiator.id);

  switch (routine.objective) {
    case 'trainAgility':
      return 'increaseAgility';
    case 'trainDefense':
    case 'protectChampion':
      return 'increaseDefense';
    case 'trainStrength':
    case 'balanced':
    case 'fightPreparation':
    case 'moraleBoost':
    case 'prepareForSale':
    case 'recovery':
      return 'increaseStrength';
  }
}

function getAdjustedEffect(
  save: GameSave,
  gladiator: Gladiator,
  buildingId: BuildingId,
  effect: BuildingEffect,
): BuildingEffect {
  if (buildingId !== 'trainingGround') {
    return effect;
  }

  const routine = getRoutineForGladiator(save, gladiator.id);
  const intensity = TRAINING_INTENSITY_EFFECTS[routine.intensity];

  if (
    effect.type === 'increaseStrength' ||
    effect.type === 'increaseAgility' ||
    effect.type === 'increaseDefense'
  ) {
    return {
      ...effect,
      type: getTrainingStatEffectType(gladiator, save),
      value: effect.value * intensity.statMultiplier,
    };
  }

  if (effect.type === 'decreaseEnergy') {
    return {
      ...effect,
      value: effect.value * intensity.energyCostMultiplier,
    };
  }

  return effect;
}

function applyEffect(gladiator: Gladiator, effect: BuildingEffect, hours: number): Gladiator {
  const field = effectFieldByType[effect.type];

  if (!field) {
    return gladiator;
  }

  const direction = decreasingEffects.has(effect.type) ? -1 : 1;
  const nextValue = gladiator[field] + effect.value * hours * direction;
  const max = field === 'strength' || field === 'agility' || field === 'defense' ? 100 : 100;

  return {
    ...gladiator,
    [field]: roundStat(clamp(nextValue, 0, max)),
  };
}

function applyTrainingMoraleCost(save: GameSave, gladiator: Gladiator, hours: number) {
  if (gladiator.currentBuildingId !== 'trainingGround') {
    return gladiator;
  }

  const routine = getRoutineForGladiator(save, gladiator.id);
  const moraleCost = TRAINING_INTENSITY_EFFECTS[routine.intensity].moraleCost;

  if (moraleCost <= 0) {
    return gladiator;
  }

  return applyEffect(
    gladiator,
    {
      type: 'decreaseMorale',
      value: moraleCost,
    },
    hours,
  );
}

function applyAssignedBuildingEffects(save: GameSave, gladiator: Gladiator, hours: number) {
  if (!gladiator.currentBuildingId) {
    return gladiator;
  }

  const effects = getHourlyEffects(save, gladiator.currentBuildingId).filter(
    (effect) => (effect.target ?? 'assignedGladiator') === 'assignedGladiator',
  );

  return applyTrainingMoraleCost(
    save,
    effects.reduce((updatedGladiator, effect) => {
      return applyEffect(
        updatedGladiator,
        getAdjustedEffect(
          save,
          updatedGladiator,
          gladiator.currentBuildingId as BuildingId,
          effect,
        ),
        hours,
      );
    }, gladiator),
    hours,
  );
}

function applyAllGladiatorEffects(save: GameSave, gladiator: Gladiator, hours: number) {
  return Object.values(save.buildings)
    .flatMap((building) =>
      getHourlyEffects(save, building.id).filter((effect) => effect.target === 'allGladiators'),
    )
    .reduce((updatedGladiator, effect) => applyEffect(updatedGladiator, effect, hours), gladiator);
}

function applyHourlyBuildingEffects(save: GameSave, hours: number): GameSave {
  if (hours <= 0 || save.gladiators.length === 0) {
    return save;
  }

  return synchronizePlanning({
    ...save,
    gladiators: save.gladiators.map((gladiator) =>
      applyAllGladiatorEffects(save, applyAssignedBuildingEffects(save, gladiator, hours), hours),
    ),
  });
}

export function advanceGameTime(time: GameTimeState, gameMinutes: number): GameTimeState {
  if (gameMinutes <= 0) {
    return time;
  }

  let nextTime = { ...time };
  const minutesPerDay = TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour;
  const currentMinuteOfDay =
    nextTime.hour * TIME_CONFIG.minutesPerHour + nextTime.minute + gameMinutes;
  const daysToAdvance = Math.floor(currentMinuteOfDay / minutesPerDay);
  const nextMinuteOfDay = currentMinuteOfDay % minutesPerDay;

  for (let dayIndex = 0; dayIndex < daysToAdvance; dayIndex += 1) {
    nextTime = advanceDay(nextTime);
  }

  return {
    ...nextTime,
    hour: Math.floor(nextMinuteOfDay / TIME_CONFIG.minutesPerHour),
    minute: nextMinuteOfDay % TIME_CONFIG.minutesPerHour,
  };
}

export function setGameSpeed(save: GameSave, speed: GameSpeed): GameSave {
  return {
    ...save,
    time: {
      ...save.time,
      speed,
      isPaused: speed === 0,
    },
  };
}

export function tickGame(context: GameTickContext): GameTickResult {
  const speed = context.currentSave.time.isPaused ? 0 : context.speed;
  const advancedGameMinutes = getAdvancedGameMinutes(context.elapsedRealMilliseconds, speed);

  if (advancedGameMinutes <= 0) {
    return {
      save: context.currentSave,
      advancedGameMinutes: 0,
      appliedEffectHours: 0,
      effectAccumulatorMinutes: context.effectAccumulatorMinutes ?? 0,
    };
  }

  const nextTime = advanceGameTime(context.currentSave.time, advancedGameMinutes);
  const accumulatedEffectMinutes = (context.effectAccumulatorMinutes ?? 0) + advancedGameMinutes;
  const appliedEffectHours = Math.floor(accumulatedEffectMinutes / TIME_CONFIG.minutesPerHour);
  const effectAccumulatorMinutes = accumulatedEffectMinutes % TIME_CONFIG.minutesPerHour;
  const saveWithTime = {
    ...context.currentSave,
    time: nextTime,
  };
  const saveWithWeeklyLayers = synchronizePlanning(
    synchronizeEvents(
      synchronizeContracts(
        synchronizeArena(synchronizeBetting(saveWithTime, context.random), context.random),
      ),
      context.random,
    ),
  );
  const saveWithAssignments =
    appliedEffectHours > 0
      ? applyPlanningRecommendations(saveWithWeeklyLayers)
      : saveWithWeeklyLayers;
  const saveWithEffects =
    appliedEffectHours > 0
      ? applyHourlyBuildingEffects(saveWithAssignments, appliedEffectHours)
      : saveWithAssignments;

  return {
    save: saveWithEffects,
    advancedGameMinutes,
    appliedEffectHours,
    effectAccumulatorMinutes,
  };
}
