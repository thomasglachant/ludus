import {
  DAILY_EVENT_DEFINITIONS,
  EVENT_CONFIG,
  type DailyEventDefinition,
  type DailyEventEffectTemplate,
} from '../../game-data/events';
import type { Gladiator } from '../gladiators/types';
import { synchronizePlanning } from '../planning/planning-actions';
import type { GameSave } from '../saves/types';
import type { GameEvent, GameEventChoice, GameEventEffect } from './types';

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

type GladiatorNumericField =
  | 'strength'
  | 'agility'
  | 'defense'
  | 'energy'
  | 'health'
  | 'morale'
  | 'satiety';

const eventEffectFieldByType: Partial<Record<GameEventEffect['type'], GladiatorNumericField>> = {
  changeGladiatorHealth: 'health',
  changeGladiatorEnergy: 'energy',
  changeGladiatorMorale: 'morale',
  changeGladiatorSatiety: 'satiety',
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pickIndex(length: number, random: RandomSource) {
  return Math.min(length - 1, Math.floor(random() * length));
}

function isSameEventDay(save: GameSave, event: GameEvent) {
  return (
    event.createdAtYear === save.time.year &&
    event.createdAtWeek === save.time.week &&
    event.createdAtDay === save.time.dayOfWeek
  );
}

function canUseDefinition(save: GameSave, definition: DailyEventDefinition) {
  if (!definition.gladiatorSelector) {
    return true;
  }

  if (definition.gladiatorSelector === 'injured') {
    return save.gladiators.some((gladiator) => gladiator.health < 80);
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
      ? save.gladiators.filter((gladiator) => gladiator.health < 80)
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
    case 'changeSelectedGladiatorSatiety':
      return gladiatorId
        ? { type: 'changeGladiatorSatiety', gladiatorId, amount: template.amount }
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
    case 'changeTreasury':
    case 'changeLudusReputation':
    case 'changeGladiatorHealth':
    case 'changeGladiatorEnergy':
    case 'changeGladiatorMorale':
    case 'changeGladiatorSatiety':
    case 'changeGladiatorStat':
      return template;
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
    effects: choice.effects
      .map((effect) => resolveEffectTemplate(effect, gladiatorId))
      .filter((effect): effect is GameEventEffect => Boolean(effect)),
  };
}

function createDailyEvent(save: GameSave, random: RandomSource): GameEvent | null {
  const availableDefinitions = DAILY_EVENT_DEFINITIONS.filter((definition) =>
    canUseDefinition(save, definition),
  );

  if (availableDefinitions.length === 0) {
    return null;
  }

  const definition = availableDefinitions[pickIndex(availableDefinitions.length, random)];
  const gladiator = selectGladiator(save, definition, random);

  return {
    id: `event-${save.time.year}-${save.time.week}-${save.time.dayOfWeek}-${definition.id}`,
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

function applyEventEffect(save: GameSave, effect: GameEventEffect): GameSave {
  if (effect.type === 'changeTreasury') {
    return {
      ...save,
      ludus: {
        ...save.ludus,
        treasury: Math.max(0, save.ludus.treasury + effect.amount),
      },
    };
  }

  if (effect.type === 'changeLudusReputation') {
    return {
      ...save,
      ludus: {
        ...save.ludus,
        reputation: Math.max(0, save.ludus.reputation + effect.amount),
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
              [effect.stat]: clamp(gladiator[effect.stat] + effect.amount, 0, 100),
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
            [field]: clamp(gladiator[field] + effect.amount, 0, 100),
          }
        : gladiator,
    ),
  };
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
    save.events.resolvedEvents.some((event) => isSameEventDay(save, event));
  const canCreateEvent =
    save.time.dayOfWeek !== 'sunday' &&
    save.time.hour >= EVENT_CONFIG.dailyEventStartHour &&
    !hasEventForCurrentDay;
  const nextPendingEvents =
    canCreateEvent && pendingEvents.length < EVENT_CONFIG.maxEventsPerDay
      ? [...pendingEvents, createDailyEvent(save, random)].filter((event): event is GameEvent =>
          Boolean(event),
        )
      : pendingEvents;

  return {
    ...save,
    events: {
      pendingEvents: nextPendingEvents,
      resolvedEvents: [...expiredEvents, ...save.events.resolvedEvents].slice(0, 12),
    },
  };
}

export function resolveGameEventChoice(
  save: GameSave,
  eventId: string,
  choiceId: string,
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

  const saveWithEffects = choice.effects.reduce(
    (updatedSave, effect) => applyEventEffect(updatedSave, effect),
    save,
  );
  const resolvedEvent: GameEvent = {
    ...event,
    status: 'resolved',
    selectedChoiceId: choice.id,
  };

  return {
    validation: {
      isAllowed: true,
    },
    save: synchronizePlanning({
      ...saveWithEffects,
      events: {
        pendingEvents: save.events.pendingEvents.filter((candidate) => candidate.id !== eventId),
        resolvedEvents: [resolvedEvent, ...save.events.resolvedEvents].slice(0, 12),
      },
    }),
  };
}
