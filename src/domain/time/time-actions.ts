import { DAYS_OF_WEEK, TIME_CONFIG, TRAINING_INTENSITY_EFFECTS } from '../../game-data/time';
import { PROGRESSION_CONFIG } from '../../game-data/progression';
import { getHourlyBuildingEffects } from '../buildings/building-effects';
import type { BuildingEffect, BuildingId, GameSave, GameSpeed, GameTickContext } from '../types';
import { synchronizeArena, synchronizeBetting } from '../combat/combat-actions';
import { synchronizeContracts } from '../contracts/contract-actions';
import { synchronizeEvents } from '../events/event-actions';
import { getActiveGameInterruption, isGameInterrupted } from '../game-flow/interruption';
import {
  applyPlanningRecommendations,
  getRoutineForGladiator,
  synchronizePlanning,
} from '../planning/planning-actions';
import { assignGladiatorMapLocation } from '../gladiators/map-movement';
import type { Gladiator } from '../gladiators/types';
import type { GameTimeState } from './types';

export interface GameTickResult {
  save: GameSave;
  advancedGameMinutes: number;
  appliedEffectHours: number;
  effectAccumulatorMinutes: number;
}

function getDayKey(time: GameTimeState) {
  return `${time.year}-${time.week}-${time.dayOfWeek}`;
}

function expirePendingEvents(save: GameSave): GameSave {
  if (save.events.pendingEvents.length === 0) {
    return save;
  }

  return {
    ...save,
    events: {
      pendingEvents: [],
      resolvedEvents: [
        ...save.events.pendingEvents.map((event) => ({
          ...event,
          status: 'expired' as const,
        })),
        ...save.events.resolvedEvents,
      ].slice(0, 12),
    },
  };
}

type GladiatorNumericField =
  | 'strength'
  | 'agility'
  | 'defense'
  | 'energy'
  | 'health'
  | 'morale'
  | 'satiety';

type RandomSource = () => number;

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
const SUNDAY_ARENA_START_HOUR = 8;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundStat(value: number) {
  return Math.round(value);
}

function getNextWeekState(year: number, week: number) {
  const nextWeek = week + 1;

  if (nextWeek > PROGRESSION_CONFIG.weeksPerYear) {
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

function getGameMinuteStamp(time: GameTimeState) {
  const dayIndex = DAYS_OF_WEEK.indexOf(time.dayOfWeek);

  return (
    (((time.year - 1) * PROGRESSION_CONFIG.weeksPerYear + (time.week - 1)) * DAYS_OF_WEEK.length +
      dayIndex) *
      TIME_CONFIG.hoursPerDay *
      TIME_CONFIG.minutesPerHour +
    time.hour * TIME_CONFIG.minutesPerHour +
    time.minute
  );
}

function createTimeFromMinuteStamp(stamp: number, template: GameTimeState): GameTimeState {
  const minutesPerDay = TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour;
  const minutesPerWeek = DAYS_OF_WEEK.length * minutesPerDay;
  const weeksPerYear = PROGRESSION_CONFIG.weeksPerYear;
  const absoluteWeekIndex = Math.floor(stamp / minutesPerWeek);
  const minuteInWeek = stamp % minutesPerWeek;
  const dayIndex = Math.floor(minuteInWeek / minutesPerDay);
  const minuteInDay = minuteInWeek % minutesPerDay;

  return {
    ...template,
    year: Math.floor(absoluteWeekIndex / weeksPerYear) + 1,
    week: (absoluteWeekIndex % weeksPerYear) + 1,
    dayOfWeek: DAYS_OF_WEEK[dayIndex],
    hour: Math.floor(minuteInDay / TIME_CONFIG.minutesPerHour),
    minute: minuteInDay % TIME_CONFIG.minutesPerHour,
  };
}

function getNextSundayArenaStartStamp(time: GameTimeState) {
  const minutesPerDay = TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour;
  const minutesPerWeek = DAYS_OF_WEEK.length * minutesPerDay;
  const currentStamp = getGameMinuteStamp(time);
  const weekStartStamp = Math.floor(currentStamp / minutesPerWeek) * minutesPerWeek;
  const sundayIndex = DAYS_OF_WEEK.indexOf('sunday');
  let targetStamp =
    weekStartStamp +
    sundayIndex * minutesPerDay +
    SUNDAY_ARENA_START_HOUR * TIME_CONFIG.minutesPerHour;

  while (targetStamp <= currentStamp) {
    targetStamp += minutesPerWeek;
  }

  return targetStamp;
}

function getDayStartStamp(time: GameTimeState) {
  return getGameMinuteStamp({
    ...time,
    hour: 0,
    minute: 0,
  });
}

function getNextSleepBoundaryStamp(time: GameTimeState) {
  const currentStamp = getGameMinuteStamp(time);
  const dayStartStamp = getDayStartStamp(time);
  const sleepStartStamp = dayStartStamp + TIME_CONFIG.sleepStartHour * TIME_CONFIG.minutesPerHour;
  const wakeUpStamp = dayStartStamp + TIME_CONFIG.wakeUpHour * TIME_CONFIG.minutesPerHour;
  const nextDayWakeUpStamp =
    dayStartStamp +
    TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour +
    TIME_CONFIG.wakeUpHour * TIME_CONFIG.minutesPerHour;

  if (currentStamp < wakeUpStamp) {
    return wakeUpStamp;
  }

  if (currentStamp < sleepStartStamp) {
    return sleepStartStamp;
  }

  return nextDayWakeUpStamp;
}

function clampToSundayArenaStart(currentTime: GameTimeState, intendedMinutes: number) {
  const currentStamp = getGameMinuteStamp(currentTime);
  const intendedStamp = currentStamp + intendedMinutes;
  const arenaStartStamp = getNextSundayArenaStartStamp(currentTime);
  const sleepBoundaryStamp = getNextSleepBoundaryStamp(currentTime);
  const interruptionStamp = Math.min(arenaStartStamp, sleepBoundaryStamp);

  if (interruptionStamp > intendedStamp) {
    return {
      advancedGameMinutes: intendedMinutes,
      time: advanceGameTime(currentTime, intendedMinutes),
    };
  }

  const advancedGameMinutes = interruptionStamp - currentStamp;

  return {
    advancedGameMinutes,
    time: createTimeFromMinuteStamp(interruptionStamp, currentTime),
  };
}

function isSleepTime(hour: number) {
  return hour >= TIME_CONFIG.sleepStartHour || hour < TIME_CONFIG.wakeUpHour;
}

function isWakeUpTime(time: GameTimeState) {
  return time.hour === TIME_CONFIG.wakeUpHour && time.minute === 0;
}

function didEndSleepAtWakeUp(currentTime: GameTimeState, nextTime: GameTimeState) {
  return isSleepTime(currentTime.hour) && isWakeUpTime(nextTime);
}

function assignNightSleep(save: GameSave, time = save.time): GameSave {
  return {
    ...save,
    gladiators: save.gladiators.map((gladiator) =>
      assignGladiatorMapLocation(gladiator, 'dormitory', time, 'sleep'),
    ),
  };
}

function restoreRestedGladiatorEnergy(save: GameSave): GameSave {
  return {
    ...save,
    gladiators: save.gladiators.map((gladiator) => ({
      ...gladiator,
      energy: 100,
    })),
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

  const effects = getHourlyBuildingEffects(save, gladiator.currentBuildingId).filter(
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
      getHourlyBuildingEffects(save, building.id).filter(
        (effect) => effect.target === 'allGladiators',
      ),
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
  if (isGameInterrupted(context.currentSave)) {
    return {
      save: context.currentSave,
      advancedGameMinutes: 0,
      appliedEffectHours: 0,
      effectAccumulatorMinutes: context.effectAccumulatorMinutes ?? 0,
    };
  }

  const speed = context.currentSave.time.isPaused ? 0 : context.speed;
  const intendedGameMinutes = getAdvancedGameMinutes(context.elapsedRealMilliseconds, speed);

  if (intendedGameMinutes <= 0) {
    return {
      save: context.currentSave,
      advancedGameMinutes: 0,
      appliedEffectHours: 0,
      effectAccumulatorMinutes: context.effectAccumulatorMinutes ?? 0,
    };
  }

  const { advancedGameMinutes, time: nextTime } = clampToSundayArenaStart(
    context.currentSave.time,
    intendedGameMinutes,
  );
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
  const shouldWakeAfterSleep = didEndSleepAtWakeUp(context.currentSave.time, nextTime);

  if (shouldWakeAfterSleep) {
    const saveWithSleepAssignments = assignNightSleep(
      saveWithWeeklyLayers,
      context.currentSave.time,
    );
    const saveWithSleepEffects =
      appliedEffectHours > 0
        ? applyHourlyBuildingEffects(saveWithSleepAssignments, appliedEffectHours)
        : saveWithSleepAssignments;
    const saveWithRestoredEnergy = restoreRestedGladiatorEnergy(saveWithSleepEffects);

    return {
      save: applyPlanningRecommendations(saveWithRestoredEnergy),
      advancedGameMinutes,
      appliedEffectHours,
      effectAccumulatorMinutes,
    };
  }

  const saveWithAssignments =
    appliedEffectHours > 0 || isSleepTime(nextTime.hour)
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

export function advanceToNextDay(
  save: GameSave,
  input: { effectAccumulatorMinutes?: number; random?: RandomSource } = {},
): GameTickResult {
  const activeInterruption = getActiveGameInterruption(save);

  if (activeInterruption?.kind === 'sundayArena') {
    return {
      save,
      advancedGameMinutes: 0,
      appliedEffectHours: 0,
      effectAccumulatorMinutes: input.effectAccumulatorMinutes ?? 0,
    };
  }

  const initialDayKey = getDayKey(save.time);
  const originalSpeed = save.time.speed;
  const originalIsPaused = save.time.isPaused;
  const startSave = activeInterruption?.kind === 'dailyEvent' ? expirePendingEvents(save) : save;
  let result: GameTickResult = {
    save: {
      ...startSave,
      time: {
        ...startSave.time,
        speed: 1,
        isPaused: false,
      },
    },
    advancedGameMinutes: 0,
    appliedEffectHours: 0,
    effectAccumulatorMinutes: input.effectAccumulatorMinutes ?? 0,
  };

  while (getDayKey(result.save.time) === initialDayKey) {
    const nextResult = tickGame({
      currentSave: result.save,
      elapsedRealMilliseconds: TIME_CONFIG.realMillisecondsPerGameHour * TIME_CONFIG.hoursPerDay,
      speed: 1,
      effectAccumulatorMinutes: result.effectAccumulatorMinutes,
      random: input.random,
    });

    if (nextResult.advancedGameMinutes <= 0) {
      break;
    }

    result = {
      save:
        getDayKey(nextResult.save.time) === initialDayKey &&
        getActiveGameInterruption(nextResult.save)?.kind === 'dailyEvent'
          ? expirePendingEvents(nextResult.save)
          : nextResult.save,
      advancedGameMinutes: result.advancedGameMinutes + nextResult.advancedGameMinutes,
      appliedEffectHours: result.appliedEffectHours + nextResult.appliedEffectHours,
      effectAccumulatorMinutes: nextResult.effectAccumulatorMinutes,
    };
  }

  if (result.advancedGameMinutes <= 0) {
    return {
      save,
      advancedGameMinutes: 0,
      appliedEffectHours: 0,
      effectAccumulatorMinutes: result.effectAccumulatorMinutes,
    };
  }

  return {
    ...result,
    save: {
      ...result.save,
      time: {
        ...result.save.time,
        speed: originalSpeed,
        isPaused: originalIsPaused,
      },
    },
  };
}

export function completeSundayArenaDay(save: GameSave): GameSave {
  if (!save.arena.arenaDay) {
    return save;
  }

  const saveWithResolvedContracts = synchronizeContracts(save);
  const sundayEveningSave: GameSave = {
    ...saveWithResolvedContracts,
    time: {
      ...saveWithResolvedContracts.time,
      dayOfWeek: 'sunday',
      hour: 20,
      minute: 0,
    },
    arena: {
      ...saveWithResolvedContracts.arena,
      arenaDay: undefined,
      currentCombatId: undefined,
      pendingCombats: [],
      isArenaDayActive: true,
    },
  };

  return synchronizePlanning(synchronizeEvents(synchronizeBetting(sundayEveningSave)));
}
