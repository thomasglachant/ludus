import { GAME_BALANCE } from './balance';
import type { BuildingActivityId } from '../domain/buildings/types';
import type { DailyPlanActivity } from '../domain/planning/types';

export const EVENT_CONFIG = {
  maxEventsPerDay: GAME_BALANCE.events.maxEventsPerDay,
  maxEventsPerWeek: GAME_BALANCE.events.maxEventsPerWeek,
  defaultSelectionWeightPercent: GAME_BALANCE.events.defaultSelectionWeightPercent,
  defaultCooldownWeeks: GAME_BALANCE.events.defaultCooldownWeeks,
  launchedEventHistoryLimit: GAME_BALANCE.events.launchedEventHistoryLimit,
  dailyEventProbabilityByDay: GAME_BALANCE.events.dailyEventProbabilityByDay,
  resolvedEventHistoryLimit: GAME_BALANCE.events.resolvedEventHistoryLimit,
} as const;

export type DailyEventGladiatorSelector = 'any' | 'injured';

export type DailyEventEffectTemplate =
  | { type: 'changeTreasury'; amount: number }
  | { type: 'changeLudusReputation'; amount: number }
  | { type: 'changeLudusHappiness'; amount: number }
  | { type: 'changeLudusRebellion'; amount: number }
  | { type: 'removeSelectedGladiator' }
  | { type: 'releaseAllGladiators' }
  | { type: 'changeSelectedGladiatorHealth'; amount: number }
  | { type: 'changeSelectedGladiatorEnergy'; amount: number }
  | { type: 'changeSelectedGladiatorMorale'; amount: number }
  | {
      type: 'changeSelectedGladiatorStat';
      stat: 'strength' | 'agility' | 'defense' | 'life';
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
  triggerActivities?: DailyPlanActivity[];
  triggerBuildingActivities?: BuildingActivityId[];
  requiredLudus?: {
    happinessAtMost?: number;
    rebellionAtLeast?: number;
  };
  priority?: 'critical';
  selectionWeightPercent?: number;
  cooldownWeeks?: number;
  gladiatorSelector?: DailyEventGladiatorSelector;
  choices: DailyEventChoiceDefinition[];
}

export const DAILY_EVENT_DEFINITIONS: DailyEventDefinition[] = [
  {
    id: 'rebellionCrisis',
    titleKey: 'events.rebellionCrisis.title',
    descriptionKey: 'events.rebellionCrisis.description',
    priority: 'critical',
    requiredLudus: {
      rebellionAtLeast: GAME_BALANCE.macroSimulation.rebellionCriticalThreshold,
    },
    cooldownWeeks: 1,
    choices: [
      {
        id: 'payForCalm',
        labelKey: 'events.rebellionCrisis.payForCalm.label',
        consequenceKey: 'events.rebellionCrisis.payForCalm.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeTreasury', amount: -220 },
              { type: 'changeLudusHappiness', amount: 8 },
              { type: 'changeLudusRebellion', amount: -45 },
            ],
          },
        ],
      },
      {
        id: 'repressRiot',
        labelKey: 'events.rebellionCrisis.repressRiot.label',
        consequenceKey: 'events.rebellionCrisis.repressRiot.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeLudusHappiness', amount: -18 },
              { type: 'changeLudusRebellion', amount: -30 },
              { type: 'changeLudusReputation', amount: -2 },
            ],
          },
        ],
      },
      {
        id: 'freeGladiators',
        labelKey: 'events.rebellionCrisis.freeGladiators.label',
        consequenceKey: 'events.rebellionCrisis.freeGladiators.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'releaseAllGladiators' },
              { type: 'changeLudusHappiness', amount: 25 },
              { type: 'changeLudusRebellion', amount: -80 },
              { type: 'changeLudusReputation', amount: -5 },
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
    triggerActivities: ['strengthTraining', 'agilityTraining', 'defenseTraining', 'lifeTraining'],
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
    id: 'surplusHarvest',
    titleKey: 'events.surplusHarvest.title',
    descriptionKey: 'events.surplusHarvest.description',
    triggerActivities: ['production'],
    triggerBuildingActivities: ['canteen.supplyContracts'],
    choices: [
      {
        id: 'sellSurplus',
        labelKey: 'events.surplusHarvest.sellSurplus.label',
        consequenceKey: 'events.surplusHarvest.sellSurplus.consequence',
        consequences: [{ kind: 'certain', effects: [{ type: 'changeTreasury', amount: 80 }] }],
      },
      {
        id: 'feedLudus',
        labelKey: 'events.surplusHarvest.feedLudus.label',
        consequenceKey: 'events.surplusHarvest.feedLudus.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeTreasury', amount: 25 },
              { type: 'changeLudusReputation', amount: 1 },
            ],
          },
        ],
      },
    ],
  },
];
