import {
  DAILY_EVENT_DEFINITIONS,
  EVENT_CONFIG,
  type DailyEventConsequenceDefinition,
  type DailyEventDefinition,
  type DailyEventEffectTemplate,
  type DailyEventOutcomeDefinition,
} from '../../game-data/events';
import { GAME_BALANCE } from '../../game-data/balance';
import { BUILDING_ACTIVITY_DEFINITIONS } from '../../game-data/building-activities';
import { PROGRESSION_CONFIG } from '../../game-data/progression';
import type { BuildingActivityId } from '../buildings/types';
import {
  addLedgerEntry,
  createLedgerEntry,
  updateCurrentWeekSummary,
} from '../economy/economy-actions';
import { hasActiveWeeklyInjury } from '../gladiators/injuries';
import { addSkillLevels } from '../gladiators/skills';
import type { Gladiator } from '../gladiators/types';
import type { DailyPlan, DailyPlanActivity } from '../planning/types';
import type { GameSave } from '../saves/types';
import type {
  GameEvent,
  GameEventChoice,
  GameEventConsequence,
  GameEventEffect,
  GameEventOutcome,
  LaunchedGameEventRecord,
} from './types';

type RandomSource = () => number;

export type EventActionFailureReason = 'eventNotFound' | 'choiceNotFound';

export interface EventActionValidation {
  isAllowed: boolean;
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

  if (
    definition.requiredLudus?.securityAtMost !== undefined &&
    save.ludus.security > definition.requiredLudus.securityAtMost
  ) {
    return false;
  }

  if (!definition.gladiatorSelector) {
    return true;
  }

  if (definition.gladiatorSelector === 'injured') {
    return save.gladiators.some((gladiator) =>
      hasActiveWeeklyInjury(gladiator, save.time.year, save.time.week),
    );
  }

  return save.gladiators.length > 0;
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
      ? save.gladiators.filter((gladiator) =>
          hasActiveWeeklyInjury(gladiator, save.time.year, save.time.week),
        )
      : save.gladiators;

  return candidates.length > 0 ? candidates[pickIndex(candidates.length, random)] : undefined;
}

function resolveEffectTemplate(
  template: DailyEventEffectTemplate,
  gladiatorId?: string,
): GameEventEffect | null {
  switch (template.type) {
    case 'changeSelectedGladiatorHealth':
      return gladiatorId
        ? { type: 'changeGladiatorStat', gladiatorId, stat: 'life', amount: template.amount }
        : { type: 'changeLudusHappiness', amount: Math.round(template.amount / 3) };
    case 'changeSelectedGladiatorEnergy':
      return { type: 'changeLudusHappiness', amount: Math.round(template.amount / 3) };
    case 'changeSelectedGladiatorMorale':
      return { type: 'changeLudusHappiness', amount: template.amount };
    case 'changeSelectedGladiatorStat':
      return gladiatorId
        ? { type: 'changeGladiatorStat', gladiatorId, stat: template.stat, amount: template.amount }
        : null;
    case 'removeSelectedGladiator':
      return gladiatorId ? { type: 'removeGladiator', gladiatorId } : null;
    case 'changeTreasury':
    case 'changeLudusReputation':
    case 'changeLudusSecurity':
    case 'changeLudusHappiness':
    case 'changeLudusRebellion':
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
): GameEvent | null {
  if (!canUseDefinition(save, definition)) {
    return null;
  }

  const gladiator = selectGladiator(save, definition, random);

  return {
    id: `event-${save.time.year}-${save.time.week}-${save.time.dayOfWeek}-${idSuffix}`,
    definitionId: definition.id,
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
    .filter((event) => !isSameEventDay(save, event))
    .map((event) => ({ ...event, status: 'expired' as const }));
  const pendingEvents = save.events.pendingEvents.filter((event) => isSameEventDay(save, event));
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

  const nextSave = updateCurrentWeekSummary(
    addLedgerEntry(
      save,
      createLedgerEntry(save, {
        kind: effect.amount > 0 ? 'income' : 'expense',
        category: 'event',
        amount: Math.abs(effect.amount),
        labelKey,
      }),
    ),
  );
  const isLost = nextSave.ludus.treasury <= GAME_BALANCE.macroSimulation.gameOverTreasuryThreshold;

  return {
    ...nextSave,
    ludus: { ...nextSave.ludus, gameStatus: isLost ? 'lost' : nextSave.ludus.gameStatus },
    time: { ...nextSave.time, phase: isLost ? 'gameOver' : nextSave.time.phase },
  };
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

  if (effect.type === 'changeLudusSecurity') {
    return {
      ...save,
      ludus: { ...save.ludus, security: clamp(save.ludus.security + effect.amount, 0, 100) },
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

  if (effect.type === 'removeGladiator') {
    return {
      ...save,
      gladiators: save.gladiators.filter((gladiator) => gladiator.id !== effect.gladiatorId),
      planning: {
        ...save.planning,
        alerts: save.planning.alerts.filter((alert) => alert.gladiatorId !== effect.gladiatorId),
      },
    };
  }

  if (effect.type === 'releaseAllGladiators') {
    return { ...save, gladiators: [], planning: { ...save.planning, alerts: [] } };
  }

  if (effect.type === 'changeGladiatorStat') {
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

  return {
    validation: { isAllowed: true },
    save: {
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
        pendingEvents: consequenceResult.save.events.pendingEvents.filter(
          (candidate) => candidate.id !== eventId,
        ),
        resolvedEvents: [resolvedEvent, ...consequenceResult.save.events.resolvedEvents].slice(
          0,
          EVENT_CONFIG.resolvedEventHistoryLimit,
        ),
        launchedEvents: consequenceResult.save.events.launchedEvents,
      },
    },
  };
}
