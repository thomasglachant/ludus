import { GAME_BALANCE } from './balance';

export const EVENT_CONFIG = {
  dailyEventStartHour: GAME_BALANCE.events.dailyEventStartHour,
  dailyEventEndHour: GAME_BALANCE.events.dailyEventEndHour,
  maxEventsPerDay: GAME_BALANCE.events.maxEventsPerDay,
  maxEventsPerWeek: GAME_BALANCE.events.maxEventsPerWeek,
  defaultSelectionWeightPercent: GAME_BALANCE.events.defaultSelectionWeightPercent,
  defaultCooldownWeeks: GAME_BALANCE.events.defaultCooldownWeeks,
  launchedEventHistoryLimit: GAME_BALANCE.events.launchedEventHistoryLimit,
  dailyEventProbabilityByDay: GAME_BALANCE.events.dailyEventProbabilityByDay,
  injuredHealthThreshold: GAME_BALANCE.events.injuredHealthThreshold,
  resolvedEventHistoryLimit: GAME_BALANCE.events.resolvedEventHistoryLimit,
} as const;

export type DailyEventGladiatorSelector = 'any' | 'injured';

export type DailyEventEffectTemplate =
  | { type: 'changeTreasury'; amount: number }
  | { type: 'changeLudusReputation'; amount: number }
  | { type: 'removeSelectedGladiator' }
  | { type: 'changeSelectedGladiatorHealth'; amount: number }
  | { type: 'changeSelectedGladiatorEnergy'; amount: number }
  | { type: 'changeSelectedGladiatorMorale'; amount: number }
  | {
      type: 'changeSelectedGladiatorStat';
      stat: 'strength' | 'agility' | 'defense';
      amount: number;
    };

export interface DailyEventOutcomeDefinition {
  id: string;
  chancePercent: number;
  effects?: DailyEventEffectTemplate[];
  textKey?: string;
}

export type DailyEventConsequenceDefinition =
  | { kind: 'certain'; effects: DailyEventEffectTemplate[] }
  | ({ kind: 'chance' } & DailyEventOutcomeDefinition)
  | { kind: 'oneOf'; outcomes: DailyEventOutcomeDefinition[] };

export interface DailyEventChoiceDefinition {
  id: string;
  labelKey: string;
  consequenceKey: string;
  consequences: DailyEventConsequenceDefinition[];
}

export interface DailyEventDefinition {
  id: string;
  titleKey: string;
  descriptionKey: string;
  selectionWeightPercent?: number;
  cooldownWeeks?: number;
  gladiatorSelector?: DailyEventGladiatorSelector;
  choices: DailyEventChoiceDefinition[];
}

export const DAILY_EVENT_DEFINITIONS: DailyEventDefinition[] = [
  {
    id: 'departureThreat',
    titleKey: 'events.departureThreat.title',
    descriptionKey: 'events.departureThreat.description',
    selectionWeightPercent: 50,
    gladiatorSelector: 'any',
    choices: [
      {
        id: 'offerBonus',
        labelKey: 'events.departureThreat.offerBonus.label',
        consequenceKey: 'events.departureThreat.offerBonus.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeTreasury', amount: -60 },
              { type: 'changeSelectedGladiatorMorale', amount: 10 },
            ],
          },
        ],
      },
      {
        id: 'refusePayment',
        labelKey: 'events.departureThreat.refusePayment.label',
        consequenceKey: 'events.departureThreat.refusePayment.consequence',
        consequences: [
          {
            kind: 'oneOf',
            outcomes: [
              {
                id: 'gladiatorLeaves',
                chancePercent: 50,
                effects: [{ type: 'removeSelectedGladiator' }],
              },
              {
                id: 'moraleLoss',
                chancePercent: 50,
                effects: [{ type: 'changeSelectedGladiatorMorale', amount: -20 }],
              },
            ],
          },
        ],
      },
    ],
  },
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
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeSelectedGladiatorMorale', amount: 8 },
              { type: 'changeSelectedGladiatorEnergy', amount: 6 },
            ],
          },
        ],
      },
      {
        id: 'strictDrill',
        labelKey: 'events.trainingRefusal.strictDrill.label',
        consequenceKey: 'events.trainingRefusal.strictDrill.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeSelectedGladiatorStat', stat: 'strength', amount: 1 },
              { type: 'changeSelectedGladiatorMorale', amount: -8 },
              { type: 'changeSelectedGladiatorEnergy', amount: -6 },
            ],
          },
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
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeTreasury', amount: -35 },
              { type: 'changeLudusReputation', amount: 4 },
            ],
          },
        ],
      },
      {
        id: 'keepRoutine',
        labelKey: 'events.patricianVisit.keepRoutine.label',
        consequenceKey: 'events.patricianVisit.keepRoutine.consequence',
        consequences: [
          { kind: 'certain', effects: [{ type: 'changeLudusReputation', amount: -1 }] },
        ],
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
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeTreasury', amount: -45 },
              { type: 'changeSelectedGladiatorHealth', amount: 18 },
            ],
          },
        ],
      },
      {
        id: 'declineTreatment',
        labelKey: 'events.medicusOffer.declineTreatment.label',
        consequenceKey: 'events.medicusOffer.declineTreatment.consequence',
        consequences: [
          { kind: 'certain', effects: [{ type: 'changeSelectedGladiatorMorale', amount: -3 }] },
        ],
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
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeTreasury', amount: -25 },
              { type: 'changeLudusReputation', amount: 3 },
            ],
          },
        ],
      },
      {
        id: 'ignoreRumors',
        labelKey: 'events.rivalRumors.ignoreRumors.label',
        consequenceKey: 'events.rivalRumors.ignoreRumors.consequence',
        consequences: [
          { kind: 'certain', effects: [{ type: 'changeLudusReputation', amount: -2 }] },
        ],
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
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeSelectedGladiatorStat', stat: 'agility', amount: 1 },
              { type: 'changeSelectedGladiatorEnergy', amount: -5 },
            ],
          },
        ],
      },
      {
        id: 'publicPraise',
        labelKey: 'events.youngPromise.publicPraise.label',
        consequenceKey: 'events.youngPromise.publicPraise.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeSelectedGladiatorMorale', amount: 7 },
              { type: 'changeLudusReputation', amount: 1 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'badOmen',
    titleKey: 'events.badOmen.title',
    descriptionKey: 'events.badOmen.description',
    gladiatorSelector: 'any',
    choices: [
      {
        id: 'performRite',
        labelKey: 'events.badOmen.performRite.label',
        consequenceKey: 'events.badOmen.performRite.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeTreasury', amount: -15 },
              { type: 'changeSelectedGladiatorMorale', amount: -2 },
            ],
          },
        ],
      },
      {
        id: 'dismissFear',
        labelKey: 'events.badOmen.dismissFear.label',
        consequenceKey: 'events.badOmen.dismissFear.consequence',
        consequences: [
          { kind: 'certain', effects: [{ type: 'changeSelectedGladiatorMorale', amount: -7 }] },
        ],
      },
    ],
  },
  {
    id: 'spoiledRations',
    titleKey: 'events.spoiledRations.title',
    descriptionKey: 'events.spoiledRations.description',
    gladiatorSelector: 'any',
    choices: [
      {
        id: 'replaceRations',
        labelKey: 'events.spoiledRations.replaceRations.label',
        consequenceKey: 'events.spoiledRations.replaceRations.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeTreasury', amount: -25 },
              { type: 'changeSelectedGladiatorMorale', amount: -3 },
            ],
          },
        ],
      },
      {
        id: 'serveAnyway',
        labelKey: 'events.spoiledRations.serveAnyway.label',
        consequenceKey: 'events.spoiledRations.serveAnyway.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [{ type: 'changeSelectedGladiatorMorale', amount: -9 }],
          },
        ],
      },
    ],
  },
  {
    id: 'insultFromVeteran',
    titleKey: 'events.insultFromVeteran.title',
    descriptionKey: 'events.insultFromVeteran.description',
    gladiatorSelector: 'any',
    choices: [
      {
        id: 'mediate',
        labelKey: 'events.insultFromVeteran.mediate.label',
        consequenceKey: 'events.insultFromVeteran.mediate.consequence',
        consequences: [
          { kind: 'certain', effects: [{ type: 'changeSelectedGladiatorMorale', amount: -4 }] },
        ],
      },
      {
        id: 'letItStand',
        labelKey: 'events.insultFromVeteran.letItStand.label',
        consequenceKey: 'events.insultFromVeteran.letItStand.consequence',
        consequences: [
          { kind: 'certain', effects: [{ type: 'changeSelectedGladiatorMorale', amount: -10 }] },
        ],
      },
    ],
  },
  {
    id: 'homesickNight',
    titleKey: 'events.homesickNight.title',
    descriptionKey: 'events.homesickNight.description',
    gladiatorSelector: 'any',
    choices: [
      {
        id: 'grantLetter',
        labelKey: 'events.homesickNight.grantLetter.label',
        consequenceKey: 'events.homesickNight.grantLetter.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeTreasury', amount: -10 },
              { type: 'changeSelectedGladiatorMorale', amount: -2 },
            ],
          },
        ],
      },
      {
        id: 'demandFocus',
        labelKey: 'events.homesickNight.demandFocus.label',
        consequenceKey: 'events.homesickNight.demandFocus.consequence',
        consequences: [
          { kind: 'certain', effects: [{ type: 'changeSelectedGladiatorMorale', amount: -6 }] },
        ],
      },
    ],
  },
];
