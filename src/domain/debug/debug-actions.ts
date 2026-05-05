import { GAME_BALANCE } from '../../game-data/balance';
import { DAYS_OF_WEEK } from '../../game-data/time';
import { refreshGameAlerts } from '../alerts/alert-actions';
import { getGladiatorExperienceProgress } from '../gladiators/progression';
import { getActiveGameInterruption } from '../game-flow/interruption';
import { synchronizePlanning } from '../planning/planning-actions';
import { applyGladiatorStatusEffect } from '../status-effects/status-effect-actions';
import { resolveWeekStep } from '../weekly-simulation/weekly-simulation-actions';
import type { GameSave } from '../types';
import type { DayOfWeek } from '../time/types';

type RandomSource = () => number;

export function adjustDebugTreasury(save: GameSave, amount: number): GameSave {
  return {
    ...save,
    ludus: {
      ...save.ludus,
      treasury: Math.max(GAME_BALANCE.economy.minimumTreasury, save.ludus.treasury + amount),
    },
  };
}

export function getDebugDayAdvanceDistance(currentDay: DayOfWeek, targetDay: DayOfWeek) {
  const currentIndex = DAYS_OF_WEEK.indexOf(currentDay);
  const targetIndex = DAYS_OF_WEEK.indexOf(targetDay);

  if (currentIndex < 0 || targetIndex < 0) {
    return 0;
  }

  return (targetIndex - currentIndex + DAYS_OF_WEEK.length) % DAYS_OF_WEEK.length;
}

function canResolveDebugStep(save: GameSave) {
  return (
    save.ludus.gameStatus !== 'lost' &&
    !save.time.pendingActionTrigger &&
    getActiveGameInterruption(save) === null
  );
}

function shouldStartTargetSundayArena(save: GameSave, targetDay: DayOfWeek) {
  return (
    targetDay === 'sunday' &&
    save.time.dayOfWeek === 'sunday' &&
    !save.arena.arenaDay &&
    canResolveDebugStep(save)
  );
}

export function levelUpDebugGladiator(save: GameSave, gladiatorId: string): GameSave {
  let didChange = false;
  const gladiators = save.gladiators.map((gladiator) => {
    if (gladiator.id !== gladiatorId) {
      return gladiator;
    }

    const progress = getGladiatorExperienceProgress(gladiator);

    if (progress.nextLevelStart === undefined) {
      return gladiator;
    }

    didChange = true;

    return {
      ...gladiator,
      experience: progress.nextLevelStart,
    };
  });

  return didChange ? refreshGameAlerts(synchronizePlanning({ ...save, gladiators })) : save;
}

export function createDebugInjuryAlert(save: GameSave, gladiatorId: string): GameSave {
  if (!save.gladiators.some((gladiator) => gladiator.id === gladiatorId)) {
    return save;
  }

  return refreshGameAlerts(
    synchronizePlanning(
      applyGladiatorStatusEffect(
        save,
        'injury',
        GAME_BALANCE.statusEffects.injury.eventDurationDays,
        gladiatorId,
      ),
    ),
  );
}

export function advanceDebugToDay(
  save: GameSave,
  targetDay: DayOfWeek,
  random: RandomSource = Math.random,
): GameSave {
  if (!DAYS_OF_WEEK.includes(targetDay)) {
    return save;
  }

  if (save.time.dayOfWeek === targetDay) {
    return shouldStartTargetSundayArena(save, targetDay) ? resolveWeekStep(save, random) : save;
  }

  let nextSave = save;
  const maxSteps = getDebugDayAdvanceDistance(save.time.dayOfWeek, targetDay);

  for (let step = 0; step < maxSteps; step += 1) {
    if (!canResolveDebugStep(nextSave)) {
      return nextSave;
    }

    const steppedSave = resolveWeekStep(nextSave, random);

    if (steppedSave === nextSave) {
      return nextSave;
    }

    nextSave = steppedSave;

    if (nextSave.time.dayOfWeek === targetDay) {
      return shouldStartTargetSundayArena(nextSave, targetDay)
        ? resolveWeekStep(nextSave, random)
        : nextSave;
    }
  }

  return nextSave;
}
