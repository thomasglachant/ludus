import { WEEKLY_SIMULATION_CONFIG } from '../weekly-simulation';
import {
  GLADIATOR_COMBAT_EXPERIENCE_CONFIG,
  GLADIATOR_TRAINING_CONFIG,
} from '../gladiators/combat';
import { GLADIATOR_TEMPORARY_TRAITS } from '../gladiators/traits';
import type { TemporaryGladiatorTraitId } from '../../domain/gladiators/traits';
import type { BuildingActivityId } from '../../domain/buildings/types';
import type { GladiatorSkillName } from '../../domain/gladiators/skills';
import type { DailyPlanActivity } from '../../domain/planning/types';

export const DAILY_EVENT_GLADIATOR_SELECTORS = ['any', 'injured'] as const;

export type DailyEventGladiatorSelector = (typeof DAILY_EVENT_GLADIATOR_SELECTORS)[number];

export type DailyEventEffectTemplate =
  | { type: 'changeTreasury'; amount: number }
  | { type: 'changeLudusReputation'; amount: number }
  | { type: 'changeLudusHappiness'; amount: number }
  | { type: 'changeLudusRebellion'; amount: number }
  | { type: 'setGameLost' }
  | { type: 'startDebtGrace' }
  | { type: 'removeSelectedGladiator'; bypassActivityEligibility?: boolean }
  | { type: 'releaseAllGladiators' }
  | { type: 'changeSelectedGladiatorHealth'; amount: number; bypassActivityEligibility?: boolean }
  | { type: 'changeSelectedGladiatorEnergy'; amount: number; bypassActivityEligibility?: boolean }
  | { type: 'changeSelectedGladiatorMorale'; amount: number; bypassActivityEligibility?: boolean }
  | {
      type: 'changeSelectedGladiatorExperience';
      amount: number;
      bypassActivityEligibility?: boolean;
    }
  | {
      type: 'applySelectedGladiatorTrait';
      traitId: TemporaryGladiatorTraitId;
      durationDays: number;
      bypassActivityEligibility?: boolean;
    }
  | {
      type: 'changeSelectedGladiatorStat';
      stat: GladiatorSkillName;
      amount: number;
      bypassActivityEligibility?: boolean;
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

export const REACTIVE_EVENT_DEFINITIONS: DailyEventDefinition[] = [
  {
    id: 'debtCrisis',
    titleKey: 'events.debtCrisis.title',
    descriptionKey: 'events.debtCrisis.description',
    priority: 'critical',
    cooldownWeeks: 0,
    choices: [
      {
        id: 'abandon',
        labelKey: 'events.debtCrisis.abandon.label',
        consequenceKey: 'events.debtCrisis.abandon.consequence',
        consequences: [{ kind: 'certain', effects: [{ type: 'setGameLost' }] }],
      },
      {
        id: 'recover',
        labelKey: 'events.debtCrisis.recover.label',
        consequenceKey: 'events.debtCrisis.recover.consequence',
        consequences: [{ kind: 'certain', effects: [{ type: 'startDebtGrace' }] }],
      },
    ],
  },
];

export const DAILY_EVENT_DEFINITIONS: DailyEventDefinition[] = [
  {
    id: 'rebellionCrisis',
    titleKey: 'events.rebellionCrisis.title',
    descriptionKey: 'events.rebellionCrisis.description',
    priority: 'critical',
    requiredLudus: {
      rebellionAtLeast: WEEKLY_SIMULATION_CONFIG.rebellionCriticalThreshold,
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
    triggerActivities: ['training'],
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
              {
                type: 'applySelectedGladiatorTrait',
                traitId: 'rest',
                durationDays: GLADIATOR_TEMPORARY_TRAITS.rest.durationDays,
              },
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
              {
                type: 'changeSelectedGladiatorExperience',
                amount:
                  GLADIATOR_TRAINING_CONFIG.experiencePerPoint *
                  GLADIATOR_COMBAT_EXPERIENCE_CONFIG.dailyTrainingEquivalentPoints,
              },
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
