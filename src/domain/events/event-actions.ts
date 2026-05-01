import {
  DAILY_EVENT_DEFINITIONS,
  EVENT_CONFIG,
  type DailyEventConsequenceDefinition,
  type DailyEventDefinition,
  type DailyEventEffectTemplate,
  type DailyEventOutcomeDefinition,
} from '../../game-data/events';
import { GAME_BALANCE } from '../../game-data/balance';
import { PROGRESSION_CONFIG } from '../../game-data/progression';
import type { Gladiator } from '../gladiators/types';
import { addSkillLevels } from '../gladiators/skills';
import { synchronizePlanning } from '../planning/planning-actions';
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

type GladiatorNumericField = 'strength' | 'agility' | 'defense' | 'energy' | 'health' | 'morale';

const eventEffectFieldByType: Partial<Record<GameEventEffect['type'], GladiatorNumericField>> = {
  changeGladiatorHealth: 'health',
  changeGladiatorEnergy: 'energy',
  changeGladiatorMorale: 'morale',
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pickIndex(length: number, random: RandomSource) {
  return Math.min(length - 1, Math.floor(random() * length));
}

function getAbsoluteWeek(year: number, week: number) {
  return (year - 1) * PROGRESSION_CONFIG.weeksPerYear + (week - 1);
}

function getDefinitionSelectionWeight(definition: DailyEventDefinition) {
  return definition.selectionWeightPercent ?? EVENT_CONFIG.defaultSelectionWeightPercent;
}

function getDefinitionCooldownWeeks(definition: DailyEventDefinition) {
  return definition.cooldownWeeks ?? EVENT_CONFIG.defaultCooldownWeeks;
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
  const cooldownWeeks = getDefinitionCooldownWeeks(definition);

  if (cooldownWeeks <= 0) {
    return false;
  }

  return save.events.launchedEvents.some(
    (launch) =>
      launch.definitionId === definition.id && getWeeksSinceLaunch(save, launch) < cooldownWeeks,
  );
}

function pickWeightedDefinition(definitions: DailyEventDefinition[], random: RandomSource) {
  const weightedDefinitions = definitions
    .map((definition) => ({ definition, weight: getDefinitionSelectionWeight(definition) }))
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

function isDailyEventWindow(time: GameSave['time']) {
  return (
    time.hour >= EVENT_CONFIG.dailyEventStartHour && time.hour < EVENT_CONFIG.dailyEventEndHour
  );
}

function canDailyEventOccur(save: GameSave, random: RandomSource) {
  return random() < EVENT_CONFIG.dailyEventProbabilityByDay[save.time.dayOfWeek];
}

function canUseDefinition(save: GameSave, definition: DailyEventDefinition) {
  if (!definition.gladiatorSelector) {
    return true;
  }

  if (definition.gladiatorSelector === 'injured') {
    return save.gladiators.some(
      (gladiator) => gladiator.health < EVENT_CONFIG.injuredHealthThreshold,
    );
  }

  return save.gladiators.length > 0;
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
      ? save.gladiators.filter(
          (gladiator) => gladiator.health < EVENT_CONFIG.injuredHealthThreshold,
        )
      : save.gladiators;

  if (candidates.length === 0) {
    return undefined;
  }

  return candidates[pickIndex(candidates.length, random)];
}

function resolveEffectTemplate(
  template: DailyEventEffectTemplate,
  gladiatorId?: string,
): GameEventEffect | null {
  switch (template.type) {
    case 'changeSelectedGladiatorHealth':
      return gladiatorId
        ? { type: 'changeGladiatorHealth', gladiatorId, amount: template.amount }
        : null;
    case 'changeSelectedGladiatorEnergy':
      return gladiatorId
        ? { type: 'changeGladiatorEnergy', gladiatorId, amount: template.amount }
        : null;
    case 'changeSelectedGladiatorMorale':
      return gladiatorId
        ? { type: 'changeGladiatorMorale', gladiatorId, amount: template.amount }
        : null;
    case 'changeSelectedGladiatorStat':
      return gladiatorId
        ? {
            type: 'changeGladiatorStat',
            gladiatorId,
            stat: template.stat,
            amount: template.amount,
          }
        : null;
    case 'removeSelectedGladiator':
      return gladiatorId ? { type: 'removeGladiator', gladiatorId } : null;
    case 'changeTreasury':
    case 'changeLudusReputation':
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
      return {
        kind: 'chance',
        ...createEventOutcome(consequence, gladiatorId),
      };
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

function createDailyEvent(save: GameSave, random: RandomSource): GameEvent | null {
  const availableDefinitions = DAILY_EVENT_DEFINITIONS.filter(
    (definition) => canUseDefinition(save, definition) && !isDefinitionOnCooldown(save, definition),
  );

  if (availableDefinitions.length === 0) {
    return null;
  }

  const definition = pickWeightedDefinition(availableDefinitions, random);

  if (!definition) {
    return null;
  }

  return createDailyEventFromDefinition(save, definition, random);
}

function applyEventEffect(save: GameSave, effect: GameEventEffect): GameSave {
  if (effect.type === 'changeTreasury') {
    return {
      ...save,
      ludus: {
        ...save.ludus,
        treasury: Math.max(
          GAME_BALANCE.economy.minimumTreasury,
          save.ludus.treasury + effect.amount,
        ),
      },
    };
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

  if (effect.type === 'removeGladiator') {
    return {
      ...save,
      gladiators: save.gladiators.filter((gladiator) => gladiator.id !== effect.gladiatorId),
      planning: {
        ...save.planning,
        routines: save.planning.routines.filter(
          (routine) => routine.gladiatorId !== effect.gladiatorId,
        ),
        alerts: save.planning.alerts.filter((alert) => alert.gladiatorId !== effect.gladiatorId),
      },
    };
  }

  if (effect.type === 'changeGladiatorStat') {
    return {
      ...save,
      gladiators: save.gladiators.map((gladiator) =>
        gladiator.id === effect.gladiatorId
          ? {
              ...gladiator,
              [effect.stat]: addSkillLevels(gladiator[effect.stat], effect.amount),
            }
          : gladiator,
      ),
    };
  }

  const field = eventEffectFieldByType[effect.type];

  if (!field) {
    return save;
  }

  return {
    ...save,
    gladiators: save.gladiators.map((gladiator) =>
      gladiator.id === effect.gladiatorId
        ? {
            ...gladiator,
            [field]: clamp(
              gladiator[field] + effect.amount,
              GAME_BALANCE.gladiators.gauges.minimum,
              GAME_BALANCE.gladiators.gauges.maximum,
            ),
          }
        : gladiator,
    ),
  };
}

function applyOutcomeEffects(save: GameSave, outcome: GameEventOutcome) {
  return (outcome.effects ?? []).reduce(
    (updatedSave, effect) => applyEventEffect(updatedSave, effect),
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
): { save: GameSave; resolvedOutcomeIds: string[] } {
  switch (consequence.kind) {
    case 'certain':
      return {
        save: consequence.effects.reduce(
          (updatedSave, effect) => applyEventEffect(updatedSave, effect),
          save,
        ),
        resolvedOutcomeIds: [],
      };
    case 'chance':
      if (random() >= consequence.chancePercent / 100) {
        return { save, resolvedOutcomeIds: [] };
      }

      return {
        save: applyOutcomeEffects(save, consequence),
        resolvedOutcomeIds: [consequence.id],
      };
    case 'oneOf': {
      const selectedOutcome = selectOutcome(consequence.outcomes, random);

      if (!selectedOutcome) {
        return { save, resolvedOutcomeIds: [] };
      }

      return {
        save: applyOutcomeEffects(save, selectedOutcome),
        resolvedOutcomeIds: [selectedOutcome.id],
      };
    }
  }
}

function applyEventConsequences(
  save: GameSave,
  consequences: GameEventConsequence[],
  random: RandomSource,
) {
  return consequences.reduce(
    (result, consequence) => {
      const nextResult = applyEventConsequence(result.save, consequence, random);

      return {
        save: nextResult.save,
        resolvedOutcomeIds: [...result.resolvedOutcomeIds, ...nextResult.resolvedOutcomeIds],
      };
    },
    { save, resolvedOutcomeIds: [] as string[] },
  );
}

export function synchronizeEvents(save: GameSave, random: RandomSource = Math.random): GameSave {
  const expiredEvents = save.events.pendingEvents
    .filter((event) => !isSameEventDay(save, event))
    .map((event) => ({
      ...event,
      status: 'expired' as const,
    }));
  const pendingEvents = save.events.pendingEvents.filter((event) => isSameEventDay(save, event));
  const hasEventForCurrentDay =
    pendingEvents.length > 0 ||
    save.events.resolvedEvents.some((event) => isSameEventDay(save, event)) ||
    save.events.launchedEvents.some((launch) => isSameLaunchDay(save, launch));
  const weeklyEventCount = save.events.launchedEvents.filter(
    (launch) =>
      launch.launchedAtYear === save.time.year && launch.launchedAtWeek === save.time.week,
  ).length;
  const canCreateEvent =
    save.gladiators.length > 0 &&
    save.time.dayOfWeek !== GAME_BALANCE.arena.dayOfWeek &&
    isDailyEventWindow(save.time) &&
    weeklyEventCount < EVENT_CONFIG.maxEventsPerWeek &&
    !hasEventForCurrentDay;
  const createdEvent =
    canCreateEvent &&
    pendingEvents.length < EVENT_CONFIG.maxEventsPerDay &&
    canDailyEventOccur(save, random)
      ? createDailyEvent(save, random)
      : null;
  const nextPendingEvents = createdEvent ? [...pendingEvents, createdEvent] : pendingEvents;
  const nextLaunchedEvents = createdEvent
    ? addLaunchedEventRecord(save.events.launchedEvents, createdEvent)
    : save.events.launchedEvents;

  return {
    ...save,
    events: {
      pendingEvents: nextPendingEvents,
      resolvedEvents: [...expiredEvents, ...save.events.resolvedEvents].slice(
        0,
        EVENT_CONFIG.resolvedEventHistoryLimit,
      ),
      launchedEvents: nextLaunchedEvents,
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
  const event = save.events.pendingEvents.find((candidate) => candidate.id === eventId);

  if (!event) {
    return {
      save,
      validation: {
        isAllowed: false,
        reason: 'eventNotFound',
      },
    };
  }

  const choice = event.choices.find((candidate) => candidate.id === choiceId);

  if (!choice) {
    return {
      save,
      validation: {
        isAllowed: false,
        reason: 'choiceNotFound',
      },
    };
  }

  const consequenceResult = applyEventConsequences(save, choice.consequences, random);
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
    validation: {
      isAllowed: true,
    },
    save: synchronizePlanning({
      ...consequenceResult.save,
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
    }),
  };
}
