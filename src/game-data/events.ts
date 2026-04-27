import type { GameEventEffect } from '../domain/types';

export const EVENT_CONFIG = {
  dailyEventStartHour: 10,
  maxEventsPerDay: 1,
} as const;

export type DailyEventGladiatorSelector = 'any' | 'injured';

export type DailyEventEffectTemplate =
  | GameEventEffect
  | { type: 'changeSelectedGladiatorHealth'; amount: number }
  | { type: 'changeSelectedGladiatorEnergy'; amount: number }
  | { type: 'changeSelectedGladiatorMorale'; amount: number }
  | { type: 'changeSelectedGladiatorSatiety'; amount: number }
  | {
      type: 'changeSelectedGladiatorStat';
      stat: 'strength' | 'agility' | 'defense';
      amount: number;
    };

export interface DailyEventChoiceDefinition {
  id: string;
  labelKey: string;
  consequenceKey: string;
  effects: DailyEventEffectTemplate[];
}

export interface DailyEventDefinition {
  id: string;
  titleKey: string;
  descriptionKey: string;
  gladiatorSelector?: DailyEventGladiatorSelector;
  choices: DailyEventChoiceDefinition[];
}

export const DAILY_EVENT_DEFINITIONS: DailyEventDefinition[] = [
  {
    id: 'trainingRefusal',
    titleKey: 'events.trainingRefusal.title',
    descriptionKey: 'events.trainingRefusal.description',
    gladiatorSelector: 'any',
    choices: [
      {
        id: 'grantRest',
        labelKey: 'events.trainingRefusal.grantRest.label',
        consequenceKey: 'events.trainingRefusal.grantRest.consequence',
        effects: [
          { type: 'changeSelectedGladiatorMorale', amount: 8 },
          { type: 'changeSelectedGladiatorEnergy', amount: 6 },
        ],
      },
      {
        id: 'strictDrill',
        labelKey: 'events.trainingRefusal.strictDrill.label',
        consequenceKey: 'events.trainingRefusal.strictDrill.consequence',
        effects: [
          { type: 'changeSelectedGladiatorStat', stat: 'strength', amount: 1 },
          { type: 'changeSelectedGladiatorMorale', amount: -8 },
          { type: 'changeSelectedGladiatorEnergy', amount: -6 },
        ],
      },
    ],
  },
  {
    id: 'patricianVisit',
    titleKey: 'events.patricianVisit.title',
    descriptionKey: 'events.patricianVisit.description',
    choices: [
      {
        id: 'hostVisit',
        labelKey: 'events.patricianVisit.hostVisit.label',
        consequenceKey: 'events.patricianVisit.hostVisit.consequence',
        effects: [
          { type: 'changeTreasury', amount: -35 },
          { type: 'changeLudusReputation', amount: 4 },
        ],
      },
      {
        id: 'keepRoutine',
        labelKey: 'events.patricianVisit.keepRoutine.label',
        consequenceKey: 'events.patricianVisit.keepRoutine.consequence',
        effects: [{ type: 'changeLudusReputation', amount: -1 }],
      },
    ],
  },
  {
    id: 'medicusOffer',
    titleKey: 'events.medicusOffer.title',
    descriptionKey: 'events.medicusOffer.description',
    gladiatorSelector: 'injured',
    choices: [
      {
        id: 'payMedicus',
        labelKey: 'events.medicusOffer.payMedicus.label',
        consequenceKey: 'events.medicusOffer.payMedicus.consequence',
        effects: [
          { type: 'changeTreasury', amount: -45 },
          { type: 'changeSelectedGladiatorHealth', amount: 18 },
        ],
      },
      {
        id: 'declineTreatment',
        labelKey: 'events.medicusOffer.declineTreatment.label',
        consequenceKey: 'events.medicusOffer.declineTreatment.consequence',
        effects: [{ type: 'changeSelectedGladiatorMorale', amount: -3 }],
      },
    ],
  },
  {
    id: 'rivalRumors',
    titleKey: 'events.rivalRumors.title',
    descriptionKey: 'events.rivalRumors.description',
    choices: [
      {
        id: 'answerPublicly',
        labelKey: 'events.rivalRumors.answerPublicly.label',
        consequenceKey: 'events.rivalRumors.answerPublicly.consequence',
        effects: [
          { type: 'changeTreasury', amount: -25 },
          { type: 'changeLudusReputation', amount: 3 },
        ],
      },
      {
        id: 'ignoreRumors',
        labelKey: 'events.rivalRumors.ignoreRumors.label',
        consequenceKey: 'events.rivalRumors.ignoreRumors.consequence',
        effects: [{ type: 'changeLudusReputation', amount: -2 }],
      },
    ],
  },
  {
    id: 'youngPromise',
    titleKey: 'events.youngPromise.title',
    descriptionKey: 'events.youngPromise.description',
    gladiatorSelector: 'any',
    choices: [
      {
        id: 'extraCoaching',
        labelKey: 'events.youngPromise.extraCoaching.label',
        consequenceKey: 'events.youngPromise.extraCoaching.consequence',
        effects: [
          { type: 'changeSelectedGladiatorStat', stat: 'agility', amount: 1 },
          { type: 'changeSelectedGladiatorEnergy', amount: -5 },
        ],
      },
      {
        id: 'publicPraise',
        labelKey: 'events.youngPromise.publicPraise.label',
        consequenceKey: 'events.youngPromise.publicPraise.consequence',
        effects: [
          { type: 'changeSelectedGladiatorMorale', amount: 7 },
          { type: 'changeLudusReputation', amount: 1 },
        ],
      },
    ],
  },
];
