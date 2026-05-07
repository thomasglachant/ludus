import {
  DAILY_EVENT_DEFINITIONS,
  EVENT_CONFIG,
  REACTIVE_EVENT_DEFINITIONS,
  type DailyEventConsequenceDefinition,
  type DailyEventDefinition,
  type DailyEventEffectTemplate,
  type DailyEventOutcomeDefinition,
} from '../../game-data/events';
import { GAME_BALANCE } from '../../game-data/balance';
import { BUILDING_ACTIVITY_DEFINITIONS } from '../../game-data/building-activities';
import { PROGRESSION_CONFIG } from '../../game-data/progression';
import { refreshGameAlerts } from '../alerts/alert-actions';
import type { BuildingActivityId } from '../buildings/types';
import { updateCurrentWeekSummary } from '../economy/economy-actions';
import { recordExpense, recordIncome, validateExpense } from '../economy/treasury-service';
import { addSkillLevels } from '../gladiators/skills';
import { addGladiatorExperience } from '../gladiators/progression';
import type { Gladiator } from '../gladiators/types';
import {
  addGameNotification,
  addGladiatorLevelUpNotifications,
} from '../notifications/notification-actions';
import { synchronizePlanning } from '../planning/planning-actions';
import type { DailyPlan, DailyPlanActivity } from '../planning/types';
import type { GameSave } from '../saves/types';
import {
  applyGladiatorTrait,
  addDaysToGameDate,
  canGladiatorPerformActivities,
  compareGameDates,
  getActivityEligibleGladiators,
  getCurrentGameDate,
  hasActiveGladiatorTrait,
} from '../gladiator-traits/gladiator-trait-actions';
import type {
  GameEvent,
  GameEventChoice,
  GameEventConsequence,
  GameEventEffect,
  GameEventOutcome,
  LaunchedGameEventRecord,
} from './types';

type RandomSource = () => number;

export type EventActionFailureReason = 'eventNotFound' | 'choiceNotFound' | 'insufficientTreasury';

export interface EventActionValidation {
  isAllowed: boolean;
  cost?: number;
  reason?: EventActionFailureReason;
}

export interface EventActionResult {
  save: GameSave;
  validation: EventActionValidation;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pickIndex(length: number, random: RandomSource) {
  return Math.min(length - 1, Math.floor(random() * length));
}

function getAbsoluteWeek(year: number, week: number) {
  return (year - 1) * PROGRESSION_CONFIG.weeksPerYear + (week - 1);
}

function getWeeksSinceLaunch(save: GameSave, launch: LaunchedGameEventRecord) {
  return (
    getAbsoluteWeek(save.time.year, save.time.week) -
    getAbsoluteWeek(launch.launchedAtYear, launch.launchedAtWeek)
  );
}

function isSameLaunchDay(save: GameSave, launch: LaunchedGameEventRecord) {
  return (
    launch.launchedAtYear === save.time.year &&
    launch.launchedAtWeek === save.time.week &&
    launch.launchedAtDay === save.time.dayOfWeek
  );
}

function isDefinitionOnCooldown(save: GameSave, definition: DailyEventDefinition) {
  const cooldownWeeks = definition.cooldownWeeks ?? EVENT_CONFIG.defaultCooldownWeeks;

  return save.events.launchedEvents.some(
    (launch) =>
      launch.definitionId === definition.id && getWeeksSinceLaunch(save, launch) < cooldownWeeks,
  );
}

function pickWeightedDefinition(definitions: DailyEventDefinition[], random: RandomSource) {
  const weightedDefinitions = definitions
    .map((definition) => ({
      definition,
      weight: definition.selectionWeightPercent ?? EVENT_CONFIG.defaultSelectionWeightPercent,
    }))
    .filter(({ weight }) => weight > 0);

  if (weightedDefinitions.length === 0) {
    return null;
  }

  const totalWeight = weightedDefinitions.reduce((total, { weight }) => total + weight, 0);
  const roll = random() * totalWeight;
  let cumulativeWeight = 0;

  return (
    weightedDefinitions.find(({ weight }) => {
      cumulativeWeight += weight;
      return roll < cumulativeWeight;
    })?.definition ?? weightedDefinitions[weightedDefinitions.length - 1].definition
  );
}

function isSameEventDay(save: GameSave, event: GameEvent) {
  return (
    event.createdAtYear === save.time.year &&
    event.createdAtWeek === save.time.week &&
    event.createdAtDay === save.time.dayOfWeek
  );
}

function canDailyEventOccur(save: GameSave, random: RandomSource) {
  return random() < EVENT_CONFIG.dailyEventProbabilityByDay[save.time.dayOfWeek];
}

function canUseDefinition(save: GameSave, definition: DailyEventDefinition) {
  if (
    definition.requiredLudus?.rebellionAtLeast !== undefined &&
    save.ludus.rebellion < definition.requiredLudus.rebellionAtLeast
  ) {
    return false;
  }

  if (
    definition.requiredLudus?.happinessAtMost !== undefined &&
    save.ludus.happiness > definition.requiredLudus.happinessAtMost
  ) {
    return false;
  }

  if (!definition.gladiatorSelector) {
    return true;
  }

  if (definition.gladiatorSelector === 'injured') {
    return save.gladiators.some((gladiator) =>
      hasActiveGladiatorTrait(save, gladiator.id, 'injury'),
    );
  }

  return getActivityEligibleGladiators(save).length > 0;
}

function getPlannedActivityPoints(plan: DailyPlan, activity: DailyPlanActivity) {
  return plan.gladiatorTimePoints[activity] + plan.laborPoints[activity];
}

function getSelectedBuildingActivity(plan: DailyPlan, activityId: BuildingActivityId) {
  const definition = BUILDING_ACTIVITY_DEFINITIONS.find((activity) => activity.id === activityId);

  if (!definition || plan.buildingActivitySelections[definition.activity] !== activityId) {
    return null;
  }

  return definition;
}

function canUseDefinitionForPlan(definition: DailyEventDefinition, plan?: DailyPlan) {
  const hasActivityTriggers = Boolean(definition.triggerActivities?.length);
  const hasBuildingActivityTriggers = Boolean(definition.triggerBuildingActivities?.length);

  if (!hasActivityTriggers && !hasBuildingActivityTriggers) {
    return true;
  }

  if (!plan) {
    return false;
  }

  const activityMatches =
    !hasActivityTriggers ||
    definition.triggerActivities?.some((activity) => getPlannedActivityPoints(plan, activity) > 0);
  const buildingActivityMatches =
    !hasBuildingActivityTriggers ||
    definition.triggerBuildingActivities?.some((activityId) => {
      const selectedActivity = getSelectedBuildingActivity(plan, activityId);

      return selectedActivity
        ? getPlannedActivityPoints(plan, selectedActivity.activity) > 0
        : false;
    });

  return Boolean(activityMatches && buildingActivityMatches);
}

function selectGladiator(
  save: GameSave,
  definition: DailyEventDefinition,
  random: RandomSource,
): Gladiator | undefined {
  if (!definition.gladiatorSelector) {
    return undefined;
  }

  const candidates =
    definition.gladiatorSelector === 'injured'
      ? save.gladiators.filter((gladiator) => hasActiveGladiatorTrait(save, gladiator.id, 'injury'))
      : getActivityEligibleGladiators(save);

  return candidates.length > 0 ? candidates[pickIndex(candidates.length, random)] : undefined;
}

function resolveEffectTemplate(
  template: DailyEventEffectTemplate,
  gladiatorId?: string,
): GameEventEffect | null {
  switch (template.type) {
    case 'changeSelectedGladiatorHealth':
      return gladiatorId
        ? {
            type: 'changeGladiatorStat',
            gladiatorId,
            stat: 'life',
            amount: template.amount,
            bypassActivityEligibility: template.bypassActivityEligibility,
          }
        : { type: 'changeLudusHappiness', amount: Math.round(template.amount / 3) };
    case 'changeSelectedGladiatorEnergy':
      return { type: 'changeLudusHappiness', amount: Math.round(template.amount / 3) };
    case 'changeSelectedGladiatorMorale':
      return { type: 'changeLudusHappiness', amount: template.amount };
    case 'changeSelectedGladiatorExperience':
      return gladiatorId
        ? {
            type: 'changeGladiatorExperience',
            gladiatorId,
            amount: template.amount,
            bypassActivityEligibility: template.bypassActivityEligibility,
          }
        : null;
    case 'applySelectedGladiatorTrait':
      return gladiatorId
        ? {
            type: 'applyGladiatorTrait',
            gladiatorId,
            traitId: template.traitId,
            durationDays: template.durationDays,
            bypassActivityEligibility: template.bypassActivityEligibility,
          }
        : null;
    case 'changeSelectedGladiatorStat':
      return gladiatorId
        ? {
            type: 'changeGladiatorStat',
            gladiatorId,
            stat: template.stat,
            amount: template.amount,
            bypassActivityEligibility: template.bypassActivityEligibility,
          }
        : null;
    case 'removeSelectedGladiator':
      return gladiatorId
        ? {
            type: 'removeGladiator',
            gladiatorId,
            bypassActivityEligibility: template.bypassActivityEligibility,
          }
        : null;
    case 'changeTreasury':
    case 'changeLudusReputation':
    case 'changeLudusHappiness':
    case 'changeLudusRebellion':
    case 'setGameLost':
    case 'startDebtGrace':
    case 'releaseAllGladiators':
      return template;
  }
}

function createEventOutcome(
  outcome: DailyEventOutcomeDefinition,
  gladiatorId?: string,
): GameEventOutcome {
  return {
    id: outcome.id,
    chancePercent: outcome.chancePercent,
    textKey: outcome.textKey,
    effects: outcome.effects
      ?.map((effect) => resolveEffectTemplate(effect, gladiatorId))
      .filter((effect): effect is GameEventEffect => Boolean(effect)),
  };
}

function createEventConsequence(
  consequence: DailyEventConsequenceDefinition,
  gladiatorId?: string,
): GameEventConsequence {
  switch (consequence.kind) {
    case 'certain':
      return {
        kind: 'certain',
        effects: consequence.effects
          .map((effect) => resolveEffectTemplate(effect, gladiatorId))
          .filter((effect): effect is GameEventEffect => Boolean(effect)),
      };
    case 'chance':
      return { kind: 'chance', ...createEventOutcome(consequence, gladiatorId) };
    case 'oneOf':
      return {
        kind: 'oneOf',
        outcomes: consequence.outcomes.map((outcome) => createEventOutcome(outcome, gladiatorId)),
      };
  }
}

function createEventChoice(
  choice: DailyEventDefinition['choices'][number],
  gladiatorId?: string,
): GameEventChoice {
  return {
    id: choice.id,
    labelKey: choice.labelKey,
    consequenceKey: choice.consequenceKey,
    consequences: choice.consequences.map((consequence) =>
      createEventConsequence(consequence, gladiatorId),
    ),
  };
}

function createDailyEventFromDefinition(
  save: GameSave,
  definition: DailyEventDefinition,
  random: RandomSource,
  idSuffix = definition.id,
  source: GameEvent['source'] = 'daily',
): GameEvent | null {
  if (!canUseDefinition(save, definition)) {
    return null;
  }

  const gladiator = selectGladiator(save, definition, random);

  return {
    id: `event-${save.time.year}-${save.time.week}-${save.time.dayOfWeek}-${idSuffix}`,
    definitionId: definition.id,
    source,
    titleKey: definition.titleKey,
    descriptionKey: definition.descriptionKey,
    status: 'pending',
    createdAtYear: save.time.year,
    createdAtWeek: save.time.week,
    createdAtDay: save.time.dayOfWeek,
    gladiatorId: gladiator?.id,
    choices: definition.choices.map((choice) => createEventChoice(choice, gladiator?.id)),
  };
}

function createLaunchedEventRecord(event: GameEvent): LaunchedGameEventRecord {
  return {
    eventId: event.id,
    definitionId: event.definitionId,
    launchedAtYear: event.createdAtYear,
    launchedAtWeek: event.createdAtWeek,
    launchedAtDay: event.createdAtDay,
  };
}

function addLaunchedEventRecord(
  records: LaunchedGameEventRecord[],
  event: GameEvent,
): LaunchedGameEventRecord[] {
  return [...records, createLaunchedEventRecord(event)].slice(
    -EVENT_CONFIG.launchedEventHistoryLimit,
  );
}

function createDailyEvent(
  save: GameSave,
  random: RandomSource,
  plan?: DailyPlan,
): GameEvent | null {
  const availableDefinitions = DAILY_EVENT_DEFINITIONS.filter(
    (definition) =>
      canUseDefinition(save, definition) &&
      canUseDefinitionForPlan(definition, plan) &&
      !isDefinitionOnCooldown(save, definition),
  );

  const definition =
    availableDefinitions.find((candidate) => candidate.priority === 'critical') ??
    pickWeightedDefinition(availableDefinitions, random);

  return definition ? createDailyEventFromDefinition(save, definition, random) : null;
}

function getCurrentWeekEventCount(save: GameSave) {
  return save.events.launchedEvents.filter(
    (launch) =>
      launch.launchedAtYear === save.time.year && launch.launchedAtWeek === save.time.week,
  ).length;
}

function hasEventForCurrentDay(save: GameSave, pendingEvents = save.events.pendingEvents) {
  return (
    pendingEvents.length > 0 ||
    save.events.resolvedEvents.some((event) => isSameEventDay(save, event)) ||
    save.events.launchedEvents.some((launch) => isSameLaunchDay(save, launch))
  );
}

export function synchronizeMacroEvents(
  save: GameSave,
  plan: DailyPlan,
  random: RandomSource = Math.random,
): { save: GameSave; createdEventIds: string[] } {
  const expiredEvents = save.events.pendingEvents
    .filter((event) => event.source !== 'reactive' && !isSameEventDay(save, event))
    .map((event) => ({ ...event, status: 'expired' as const }));
  const pendingEvents = save.events.pendingEvents.filter(
    (event) => event.source === 'reactive' || isSameEventDay(save, event),
  );
  const canCreateEvent =
    save.gladiators.length > 0 &&
    save.time.dayOfWeek !== GAME_BALANCE.arena.dayOfWeek &&
    getCurrentWeekEventCount(save) < EVENT_CONFIG.maxEventsPerWeek &&
    pendingEvents.length < EVENT_CONFIG.maxEventsPerDay &&
    !hasEventForCurrentDay(save, pendingEvents) &&
    canDailyEventOccur(save, random);
  const createdEvent = canCreateEvent ? createDailyEvent(save, random, plan) : null;

  return {
    save: {
      ...save,
      events: {
        pendingEvents: createdEvent ? [...pendingEvents, createdEvent] : pendingEvents,
        resolvedEvents: [...expiredEvents, ...save.events.resolvedEvents].slice(
          0,
          EVENT_CONFIG.resolvedEventHistoryLimit,
        ),
        launchedEvents: createdEvent
          ? addLaunchedEventRecord(save.events.launchedEvents, createdEvent)
          : save.events.launchedEvents,
      },
    },
    createdEventIds: createdEvent ? [createdEvent.id] : [],
  };
}

function applyTreasuryEventEffect(
  save: GameSave,
  effect: Extract<GameEventEffect, { type: 'changeTreasury' }>,
  labelKey: string,
): GameSave {
  if (effect.amount === 0) {
    return save;
  }

  if (effect.amount > 0) {
    return updateCurrentWeekSummary(
      recordIncome(save, {
        category: 'event',
        amount: effect.amount,
        labelKey,
      }),
    );
  }

  return updateCurrentWeekSummary(
    recordExpense(save, {
      category: 'event',
      amount: Math.abs(effect.amount),
      labelKey,
    }).save,
  );
}

function addGladiatorInjuryNotification(save: GameSave, gladiatorId: string): GameSave {
  const gladiator = save.gladiators.find((candidate) => candidate.id === gladiatorId);

  if (!gladiator) {
    return save;
  }

  return addGameNotification(save, {
    titleKey: 'notifications.injury.title',
    descriptionKey: 'notifications.injury.description',
    params: { name: gladiator.name },
    target: { kind: 'gladiator', gladiatorId },
  });
}

function addGladiatorDepartureNotification(save: GameSave, gladiatorId: string): GameSave {
  const gladiator = save.gladiators.find((candidate) => candidate.id === gladiatorId);

  if (!gladiator) {
    return save;
  }

  return addGameNotification(save, {
    titleKey: 'notifications.gladiatorLeft.title',
    descriptionKey: 'notifications.gladiatorLeft.description',
    params: { name: gladiator.name },
  });
}

function addAllGladiatorsReleasedNotification(save: GameSave): GameSave {
  return addGameNotification(save, {
    titleKey: 'notifications.allGladiatorsReleased.title',
    descriptionKey: 'notifications.allGladiatorsReleased.description',
    params: { count: save.gladiators.length },
  });
}

function canApplyTargetedEventEffect(save: GameSave, effect: GameEventEffect) {
  return (
    !('gladiatorId' in effect) ||
    effect.bypassActivityEligibility ||
    canGladiatorPerformActivities(save, effect.gladiatorId)
  );
}

function applyEventEffect(save: GameSave, effect: GameEventEffect, labelKey: string): GameSave {
  if (effect.type === 'changeTreasury') {
    return applyTreasuryEventEffect(save, effect, labelKey);
  }

  if (effect.type === 'changeLudusReputation') {
    return {
      ...save,
      ludus: {
        ...save.ludus,
        reputation: Math.max(
          GAME_BALANCE.economy.minimumReputation,
          save.ludus.reputation + effect.amount,
        ),
      },
    };
  }

  if (effect.type === 'changeLudusHappiness') {
    return {
      ...save,
      ludus: { ...save.ludus, happiness: clamp(save.ludus.happiness + effect.amount, 0, 100) },
    };
  }

  if (effect.type === 'changeLudusRebellion') {
    return {
      ...save,
      ludus: { ...save.ludus, rebellion: clamp(save.ludus.rebellion + effect.amount, 0, 100) },
    };
  }

  if (effect.type === 'setGameLost') {
    return {
      ...save,
      ludus: {
        ...save.ludus,
        gameStatus: 'lost',
      },
      time: {
        ...save.time,
        phase: 'gameOver',
      },
    };
  }

  if (effect.type === 'startDebtGrace') {
    const startedAt = getCurrentGameDate(save);

    return {
      ...save,
      economy: {
        ...save.economy,
        debtCrisis: {
          status: 'grace',
          startedAt,
          deadlineAt: addDaysToGameDate(startedAt, GAME_BALANCE.economy.debtGraceDays),
        },
      },
    };
  }

  if (effect.type === 'removeGladiator') {
    if (!canApplyTargetedEventEffect(save, effect)) {
      return save;
    }

    const notificationSave = addGladiatorDepartureNotification(save, effect.gladiatorId);

    return {
      ...notificationSave,
      gladiators: notificationSave.gladiators.filter(
        (gladiator) => gladiator.id !== effect.gladiatorId,
      ),
      planning: {
        ...notificationSave.planning,
        alerts: notificationSave.planning.alerts.filter(
          (alert) => alert.gladiatorId !== effect.gladiatorId,
        ),
      },
    };
  }

  if (effect.type === 'releaseAllGladiators') {
    const notificationSave = addAllGladiatorsReleasedNotification(save);

    return {
      ...notificationSave,
      gladiators: [],
      planning: { ...notificationSave.planning, alerts: [] },
    };
  }

  if (effect.type === 'changeGladiatorExperience') {
    if (!canApplyTargetedEventEffect(save, effect)) {
      return save;
    }

    const experienceSave = {
      ...save,
      gladiators: save.gladiators.map((gladiator) =>
        gladiator.id === effect.gladiatorId
          ? addGladiatorExperience(gladiator, effect.amount)
          : gladiator,
      ),
    };

    return addGladiatorLevelUpNotifications(experienceSave, save.gladiators);
  }

  if (effect.type === 'applyGladiatorTrait') {
    if (!canApplyTargetedEventEffect(save, effect)) {
      return save;
    }

    const traitSave = applyGladiatorTrait(
      save,
      effect.traitId,
      effect.durationDays,
      effect.gladiatorId,
    );

    return effect.traitId === 'injury' && traitSave !== save
      ? addGladiatorInjuryNotification(traitSave, effect.gladiatorId)
      : traitSave;
  }

  if (effect.type === 'changeGladiatorStat') {
    if (!canApplyTargetedEventEffect(save, effect)) {
      return save;
    }

    return {
      ...save,
      gladiators: save.gladiators.map((gladiator) =>
        gladiator.id === effect.gladiatorId
          ? { ...gladiator, [effect.stat]: addSkillLevels(gladiator[effect.stat], effect.amount) }
          : gladiator,
      ),
    };
  }

  return save;
}

function applyOutcomeEffects(save: GameSave, outcome: GameEventOutcome, labelKey: string) {
  return (outcome.effects ?? []).reduce(
    (updatedSave, effect) => applyEventEffect(updatedSave, effect, labelKey),
    save,
  );
}

function selectOutcome(outcomes: GameEventOutcome[], random: RandomSource) {
  const roll = random() * 100;
  let cumulativeChance = 0;

  return outcomes.find((outcome) => {
    cumulativeChance += outcome.chancePercent;
    return roll < cumulativeChance;
  });
}

function applyEventConsequence(
  save: GameSave,
  consequence: GameEventConsequence,
  random: RandomSource,
  labelKey: string,
): { save: GameSave; resolvedOutcomeIds: string[] } {
  switch (consequence.kind) {
    case 'certain':
      return {
        save: consequence.effects.reduce(
          (updatedSave, effect) => applyEventEffect(updatedSave, effect, labelKey),
          save,
        ),
        resolvedOutcomeIds: [],
      };
    case 'chance':
      if (random() >= consequence.chancePercent / 100) {
        return { save, resolvedOutcomeIds: [] };
      }

      return {
        save: applyOutcomeEffects(save, consequence, labelKey),
        resolvedOutcomeIds: [consequence.id],
      };
    case 'oneOf': {
      const selectedOutcome = selectOutcome(consequence.outcomes, random);

      return selectedOutcome
        ? {
            save: applyOutcomeEffects(save, selectedOutcome, labelKey),
            resolvedOutcomeIds: [selectedOutcome.id],
          }
        : { save, resolvedOutcomeIds: [] };
    }
  }
}

function applyEventConsequences(
  save: GameSave,
  consequences: GameEventConsequence[],
  random: RandomSource,
  labelKey: string,
) {
  return consequences.reduce(
    (result, consequence) => {
      const nextResult = applyEventConsequence(result.save, consequence, random, labelKey);

      return {
        save: nextResult.save,
        resolvedOutcomeIds: [...result.resolvedOutcomeIds, ...nextResult.resolvedOutcomeIds],
      };
    },
    { save, resolvedOutcomeIds: [] as string[] },
  );
}

function getEventEffectsExpenseCost(effects: GameEventEffect[] = []) {
  return effects.reduce((total, effect) => {
    return effect.type === 'changeTreasury' && effect.amount < 0
      ? total + Math.abs(effect.amount)
      : total;
  }, 0);
}

function getEventConsequenceExpenseCost(consequence: GameEventConsequence): number {
  switch (consequence.kind) {
    case 'certain':
      return getEventEffectsExpenseCost(consequence.effects);
    case 'chance':
      return getEventEffectsExpenseCost(consequence.effects);
    case 'oneOf':
      return consequence.outcomes.reduce(
        (maxCost, outcome) => Math.max(maxCost, getEventEffectsExpenseCost(outcome.effects)),
        0,
      );
  }
}

export function getGameEventChoiceTreasuryCost(choice: GameEventChoice) {
  return choice.consequences.reduce(
    (total, consequence) => total + getEventConsequenceExpenseCost(consequence),
    0,
  );
}

export function validateGameEventChoice(
  save: GameSave,
  eventId: string,
  choiceId: string,
): EventActionValidation {
  const event = save.events.pendingEvents.find((candidate) => candidate.id === eventId);

  if (!event) {
    return { isAllowed: false, reason: 'eventNotFound' };
  }

  const choice = event.choices.find((candidate) => candidate.id === choiceId);

  if (!choice) {
    return { isAllowed: false, reason: 'choiceNotFound' };
  }

  const cost = getGameEventChoiceTreasuryCost(choice);
  const treasuryValidation = validateExpense(save, cost);

  if (!treasuryValidation.isAllowed) {
    return { isAllowed: false, cost, reason: 'insufficientTreasury' };
  }

  return { isAllowed: true, cost };
}

function hasPendingDebtCrisisEvent(save: GameSave) {
  return save.events.pendingEvents.some((event) => event.definitionId === 'debtCrisis');
}

function createDebtCrisisEvent(save: GameSave): GameEvent {
  const definition = REACTIVE_EVENT_DEFINITIONS.find((event) => event.id === 'debtCrisis');
  const event = definition
    ? createDailyEventFromDefinition(save, definition, () => 0, 'reactive-debtCrisis', 'reactive')
    : null;

  if (!event) {
    throw new Error('Missing debt crisis reactive event definition.');
  }

  return event;
}

function removePendingDebtCrisisEvent(save: GameSave): GameSave {
  const pendingEvents = save.events.pendingEvents.filter(
    (event) => event.definitionId !== 'debtCrisis',
  );

  return pendingEvents.length === save.events.pendingEvents.length
    ? save
    : {
        ...save,
        events: {
          ...save.events,
          pendingEvents,
        },
      };
}

export function synchronizeDebtCrisis(save: GameSave): GameSave {
  const debtCrisis = save.economy.debtCrisis;

  if (!debtCrisis) {
    return save.ludus.treasury >= 0 ? removePendingDebtCrisisEvent(save) : save;
  }

  if (save.ludus.treasury >= 0) {
    const { debtCrisis: _clearedDebtCrisis, ...economy } = save.economy;

    void _clearedDebtCrisis;

    return removePendingDebtCrisisEvent({
      ...save,
      economy,
    });
  }

  if (compareGameDates(getCurrentGameDate(save), debtCrisis.deadlineAt) >= 0) {
    return {
      ...save,
      ludus: {
        ...save.ludus,
        gameStatus: 'lost',
      },
      time: {
        ...save.time,
        phase: 'gameOver',
      },
    };
  }

  return save;
}

export function synchronizeReactiveEvents(save: GameSave): GameSave {
  const debtSave = synchronizeDebtCrisis(save);

  if (
    debtSave.ludus.gameStatus === 'lost' ||
    debtSave.ludus.treasury >= 0 ||
    debtSave.economy.debtCrisis ||
    hasPendingDebtCrisisEvent(debtSave)
  ) {
    return debtSave;
  }

  const event = createDebtCrisisEvent(debtSave);

  return {
    ...debtSave,
    time: {
      ...debtSave.time,
      phase: 'event',
    },
    events: {
      ...debtSave.events,
      pendingEvents: [event, ...debtSave.events.pendingEvents],
      launchedEvents: addLaunchedEventRecord(debtSave.events.launchedEvents, event),
    },
  };
}

export function triggerDebugDailyEvent(
  save: GameSave,
  definitionId: string,
  random: RandomSource = Math.random,
): GameSave {
  const definition = DAILY_EVENT_DEFINITIONS.find((candidate) => candidate.id === definitionId);

  if (!definition) {
    return save;
  }

  const event = createDailyEventFromDefinition(
    save,
    definition,
    random,
    `debug-${definition.id}-${Math.floor(random() * 1_000_000)}`,
  );

  if (!event) {
    return save;
  }

  return {
    ...save,
    events: {
      ...save.events,
      pendingEvents: [...save.events.pendingEvents, event],
      launchedEvents: addLaunchedEventRecord(save.events.launchedEvents, event),
    },
  };
}

export function resolveGameEventChoice(
  save: GameSave,
  eventId: string,
  choiceId: string,
  random: RandomSource = Math.random,
): EventActionResult {
  const validation = validateGameEventChoice(save, eventId, choiceId);

  if (!validation.isAllowed) {
    return { save, validation };
  }

  const event = save.events.pendingEvents.find((candidate) => candidate.id === eventId);

  if (!event) {
    return { save, validation: { isAllowed: false, reason: 'eventNotFound' } };
  }

  const choice = event.choices.find((candidate) => candidate.id === choiceId);

  if (!choice) {
    return { save, validation: { isAllowed: false, reason: 'choiceNotFound' } };
  }

  const consequenceResult = applyEventConsequences(
    save,
    choice.consequences,
    random,
    event.titleKey,
  );
  const resolvedEvent: GameEvent = {
    ...event,
    status: 'resolved',
    selectedChoiceId: choice.id,
    resolvedOutcomeIds:
      consequenceResult.resolvedOutcomeIds.length > 0
        ? consequenceResult.resolvedOutcomeIds
        : undefined,
  };

  const pendingEvents = consequenceResult.save.events.pendingEvents.filter(
    (candidate) => candidate.id !== eventId,
  );
  const resolvedSave: GameSave = {
    ...consequenceResult.save,
    time: {
      ...consequenceResult.save.time,
      phase:
        consequenceResult.save.ludus.gameStatus === 'lost'
          ? 'gameOver'
          : consequenceResult.save.time.phase === 'event'
            ? 'planning'
            : consequenceResult.save.time.phase,
    },
    events: {
      pendingEvents,
      resolvedEvents: [resolvedEvent, ...consequenceResult.save.events.resolvedEvents].slice(
        0,
        EVENT_CONFIG.resolvedEventHistoryLimit,
      ),
      launchedEvents: consequenceResult.save.events.launchedEvents,
    },
  };
  const nextSave =
    resolvedSave.ludus.gameStatus !== 'lost' &&
    resolvedSave.events.pendingEvents.length === 0 &&
    resolvedSave.time.dayOfWeek === GAME_BALANCE.arena.dayOfWeek &&
    !resolvedSave.arena.arenaDay
      ? {
          ...resolvedSave,
          time: {
            ...resolvedSave.time,
            phase: 'arena' as const,
            pendingActionTrigger: 'enterArena' as const,
          },
        }
      : resolvedSave;

  return {
    validation,
    save: refreshGameAlerts(synchronizePlanning(synchronizeReactiveEvents(nextSave))),
  };
}
