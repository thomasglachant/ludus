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
  injuredHealthThreshold: GAME_BALANCE.events.injuredHealthThreshold,
  resolvedEventHistoryLimit: GAME_BALANCE.events.resolvedEventHistoryLimit,
} as const;

export type DailyEventGladiatorSelector = 'any' | 'injured';

export type DailyEventEffectTemplate =
  | { type: 'changeTreasury'; amount: number }
  | { type: 'changeLudusReputation'; amount: number }
  | { type: 'changeLudusGlory'; amount: number }
  | { type: 'changeLudusSecurity'; amount: number }
  | { type: 'changeLudusHappiness'; amount: number }
  | { type: 'changeLudusRebellion'; amount: number }
  | { type: 'removeSelectedGladiator' }
  | { type: 'releaseAllGladiators' }
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
  triggerActivities?: DailyPlanActivity[];
  triggerBuildingActivities?: BuildingActivityId[];
  requiredLudus?: {
    happinessAtMost?: number;
    rebellionAtLeast?: number;
    securityAtMost?: number;
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
              { type: 'changeLudusSecurity', amount: -10 },
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
    triggerActivities: ['contracts', 'events'],
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
    triggerActivities: ['care'],
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
    triggerActivities: ['training'],
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
    triggerActivities: ['meals'],
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
    triggerActivities: ['training', 'leisure'],
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
    triggerActivities: ['sleep'],
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
  {
    id: 'nobleBodyguardOffer',
    titleKey: 'events.nobleBodyguardOffer.title',
    descriptionKey: 'events.nobleBodyguardOffer.description',
    triggerActivities: ['contracts'],
    choices: [
      {
        id: 'acceptEscort',
        labelKey: 'events.nobleBodyguardOffer.acceptEscort.label',
        consequenceKey: 'events.nobleBodyguardOffer.acceptEscort.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeTreasury', amount: 70 },
              { type: 'changeLudusReputation', amount: 1 },
            ],
          },
        ],
      },
      {
        id: 'declineEscort',
        labelKey: 'events.nobleBodyguardOffer.declineEscort.label',
        consequenceKey: 'events.nobleBodyguardOffer.declineEscort.consequence',
        consequences: [
          { kind: 'certain', effects: [{ type: 'changeLudusReputation', amount: -1 }] },
        ],
      },
    ],
  },
  {
    id: 'merchantGuildOffer',
    titleKey: 'events.merchantGuildOffer.title',
    descriptionKey: 'events.merchantGuildOffer.description',
    triggerActivities: ['contracts'],
    choices: [
      {
        id: 'acceptExclusiveDeal',
        labelKey: 'events.merchantGuildOffer.acceptExclusiveDeal.label',
        consequenceKey: 'events.merchantGuildOffer.acceptExclusiveDeal.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeTreasury', amount: 95 },
              { type: 'changeLudusReputation', amount: -1 },
            ],
          },
        ],
      },
      {
        id: 'keepOpenMarket',
        labelKey: 'events.merchantGuildOffer.keepOpenMarket.label',
        consequenceKey: 'events.merchantGuildOffer.keepOpenMarket.consequence',
        consequences: [
          { kind: 'certain', effects: [{ type: 'changeLudusReputation', amount: 1 }] },
        ],
      },
    ],
  },
  {
    id: 'fixedOddsWhisper',
    titleKey: 'events.fixedOddsWhisper.title',
    descriptionKey: 'events.fixedOddsWhisper.description',
    triggerActivities: ['contracts'],
    triggerBuildingActivities: ['bookmakerOffice.publicOdds', 'bookmakerOffice.championshipBook'],
    choices: [
      {
        id: 'auditLedger',
        labelKey: 'events.fixedOddsWhisper.auditLedger.label',
        consequenceKey: 'events.fixedOddsWhisper.auditLedger.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeTreasury', amount: -30 },
              { type: 'changeLudusReputation', amount: 2 },
              { type: 'changeLudusSecurity', amount: 3 },
            ],
          },
        ],
      },
      {
        id: 'rideRumor',
        labelKey: 'events.fixedOddsWhisper.rideRumor.label',
        consequenceKey: 'events.fixedOddsWhisper.rideRumor.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeTreasury', amount: 85 },
              { type: 'changeLudusReputation', amount: -2 },
              { type: 'changeLudusSecurity', amount: -4 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'armyTrainingRequest',
    titleKey: 'events.armyTrainingRequest.title',
    descriptionKey: 'events.armyTrainingRequest.description',
    triggerActivities: ['contracts'],
    triggerBuildingActivities: ['trainingGround.soldierTraining'],
    gladiatorSelector: 'any',
    choices: [
      {
        id: 'drillSoldiers',
        labelKey: 'events.armyTrainingRequest.drillSoldiers.label',
        consequenceKey: 'events.armyTrainingRequest.drillSoldiers.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeTreasury', amount: 55 },
              { type: 'changeSelectedGladiatorEnergy', amount: -6 },
            ],
          },
        ],
      },
      {
        id: 'protectRoutine',
        labelKey: 'events.armyTrainingRequest.protectRoutine.label',
        consequenceKey: 'events.armyTrainingRequest.protectRoutine.consequence',
        consequences: [
          { kind: 'certain', effects: [{ type: 'changeLudusReputation', amount: -1 }] },
        ],
      },
    ],
  },
  {
    id: 'festivalSponsorDemand',
    titleKey: 'events.festivalSponsorDemand.title',
    descriptionKey: 'events.festivalSponsorDemand.description',
    triggerActivities: ['events'],
    choices: [
      {
        id: 'honorSponsor',
        labelKey: 'events.festivalSponsorDemand.honorSponsor.label',
        consequenceKey: 'events.festivalSponsorDemand.honorSponsor.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeTreasury', amount: -45 },
              { type: 'changeLudusGlory', amount: 2 },
              { type: 'changeLudusReputation', amount: 1 },
            ],
          },
        ],
      },
      {
        id: 'protectProgram',
        labelKey: 'events.festivalSponsorDemand.protectProgram.label',
        consequenceKey: 'events.festivalSponsorDemand.protectProgram.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeLudusGlory', amount: 1 },
              { type: 'changeLudusReputation', amount: -1 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'exhibitionCrowdSurge',
    titleKey: 'events.exhibitionCrowdSurge.title',
    descriptionKey: 'events.exhibitionCrowdSurge.description',
    triggerActivities: ['events'],
    triggerBuildingActivities: [
      'exhibitionGrounds.localExhibitions',
      'exhibitionGrounds.grandSpectacle',
    ],
    gladiatorSelector: 'any',
    choices: [
      {
        id: 'expandProgram',
        labelKey: 'events.exhibitionCrowdSurge.expandProgram.label',
        consequenceKey: 'events.exhibitionCrowdSurge.expandProgram.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeTreasury', amount: 75 },
              { type: 'changeLudusGlory', amount: 2 },
              { type: 'changeSelectedGladiatorEnergy', amount: -8 },
            ],
          },
        ],
      },
      {
        id: 'closeStands',
        labelKey: 'events.exhibitionCrowdSurge.closeStands.label',
        consequenceKey: 'events.exhibitionCrowdSurge.closeStands.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeTreasury', amount: -25 },
              { type: 'changeLudusSecurity', amount: 4 },
              { type: 'changeLudusReputation', amount: 1 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'patronToastDemand',
    titleKey: 'events.patronToastDemand.title',
    descriptionKey: 'events.patronToastDemand.description',
    triggerActivities: ['events'],
    triggerBuildingActivities: ['banquetHall.nobleDinner', 'banquetHall.grandFeast'],
    choices: [
      {
        id: 'praisePatron',
        labelKey: 'events.patronToastDemand.praisePatron.label',
        consequenceKey: 'events.patronToastDemand.praisePatron.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeTreasury', amount: 45 },
              { type: 'changeLudusReputation', amount: 2 },
              { type: 'changeLudusHappiness', amount: -3 },
            ],
          },
        ],
      },
      {
        id: 'toastWholeHouse',
        labelKey: 'events.patronToastDemand.toastWholeHouse.label',
        consequenceKey: 'events.patronToastDemand.toastWholeHouse.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeTreasury', amount: -35 },
              { type: 'changeLudusHappiness', amount: 5 },
              { type: 'changeLudusReputation', amount: 1 },
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
    triggerBuildingActivities: ['farm.marketSurplus', 'farm.exportContracts'],
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
  {
    id: 'workshopBreakthrough',
    titleKey: 'events.workshopBreakthrough.title',
    descriptionKey: 'events.workshopBreakthrough.description',
    triggerActivities: ['production'],
    triggerBuildingActivities: ['forgeWorkshop.weaponContracts', 'forgeWorkshop.legionContract'],
    choices: [
      {
        id: 'sellTechnique',
        labelKey: 'events.workshopBreakthrough.sellTechnique.label',
        consequenceKey: 'events.workshopBreakthrough.sellTechnique.consequence',
        consequences: [{ kind: 'certain', effects: [{ type: 'changeTreasury', amount: 65 }] }],
      },
      {
        id: 'keepTechnique',
        labelKey: 'events.workshopBreakthrough.keepTechnique.label',
        consequenceKey: 'events.workshopBreakthrough.keepTechnique.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeTreasury', amount: 20 },
              { type: 'changeLudusReputation', amount: 1 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'toolTheft',
    titleKey: 'events.toolTheft.title',
    descriptionKey: 'events.toolTheft.description',
    triggerActivities: ['production', 'maintenance'],
    choices: [
      {
        id: 'investigate',
        labelKey: 'events.toolTheft.investigate.label',
        consequenceKey: 'events.toolTheft.investigate.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeTreasury', amount: -20 },
              { type: 'changeLudusReputation', amount: 1 },
            ],
          },
        ],
      },
      {
        id: 'replaceTools',
        labelKey: 'events.toolTheft.replaceTools.label',
        consequenceKey: 'events.toolTheft.replaceTools.consequence',
        consequences: [{ kind: 'certain', effects: [{ type: 'changeTreasury', amount: -45 }] }],
      },
    ],
  },
  {
    id: 'crackedBathhouse',
    titleKey: 'events.crackedBathhouse.title',
    descriptionKey: 'events.crackedBathhouse.description',
    triggerActivities: ['maintenance'],
    choices: [
      {
        id: 'repairNow',
        labelKey: 'events.crackedBathhouse.repairNow.label',
        consequenceKey: 'events.crackedBathhouse.repairNow.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeTreasury', amount: -55 },
              { type: 'changeLudusHappiness', amount: 4 },
            ],
          },
        ],
      },
      {
        id: 'patchLater',
        labelKey: 'events.crackedBathhouse.patchLater.label',
        consequenceKey: 'events.crackedBathhouse.patchLater.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeTreasury', amount: -15 },
              { type: 'changeLudusHappiness', amount: -4 },
              { type: 'changeLudusSecurity', amount: -2 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'guardCorruption',
    titleKey: 'events.guardCorruption.title',
    descriptionKey: 'events.guardCorruption.description',
    triggerActivities: ['security'],
    choices: [
      {
        id: 'punishGuard',
        labelKey: 'events.guardCorruption.punishGuard.label',
        consequenceKey: 'events.guardCorruption.punishGuard.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeTreasury', amount: -15 },
              { type: 'changeLudusReputation', amount: 2 },
            ],
          },
        ],
      },
      {
        id: 'hideScandal',
        labelKey: 'events.guardCorruption.hideScandal.label',
        consequenceKey: 'events.guardCorruption.hideScandal.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeTreasury', amount: -40 },
              { type: 'changeLudusReputation', amount: -1 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'nightWatchAlarm',
    titleKey: 'events.nightWatchAlarm.title',
    descriptionKey: 'events.nightWatchAlarm.description',
    triggerActivities: ['security'],
    choices: [
      {
        id: 'doublePatrol',
        labelKey: 'events.nightWatchAlarm.doublePatrol.label',
        consequenceKey: 'events.nightWatchAlarm.doublePatrol.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeTreasury', amount: -30 },
              { type: 'changeLudusSecurity', amount: 8 },
            ],
          },
        ],
      },
      {
        id: 'sealGates',
        labelKey: 'events.nightWatchAlarm.sealGates.label',
        consequenceKey: 'events.nightWatchAlarm.sealGates.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeLudusSecurity', amount: 4 },
              { type: 'changeLudusHappiness', amount: -3 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'taxInspection',
    titleKey: 'events.taxInspection.title',
    descriptionKey: 'events.taxInspection.description',
    triggerActivities: ['maintenance', 'contracts'],
    choices: [
      {
        id: 'presentLedger',
        labelKey: 'events.taxInspection.presentLedger.label',
        consequenceKey: 'events.taxInspection.presentLedger.consequence',
        consequences: [{ kind: 'certain', effects: [{ type: 'changeTreasury', amount: -25 }] }],
      },
      {
        id: 'offerGift',
        labelKey: 'events.taxInspection.offerGift.label',
        consequenceKey: 'events.taxInspection.offerGift.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeTreasury', amount: -60 },
              { type: 'changeLudusReputation', amount: 2 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'creditorPressure',
    titleKey: 'events.creditorPressure.title',
    descriptionKey: 'events.creditorPressure.description',
    triggerActivities: ['maintenance', 'contracts'],
    triggerBuildingActivities: ['domus.profitForecasting'],
    requiredLudus: {
      happinessAtMost: 60,
    },
    choices: [
      {
        id: 'settleAccounts',
        labelKey: 'events.creditorPressure.settleAccounts.label',
        consequenceKey: 'events.creditorPressure.settleAccounts.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeTreasury', amount: -85 },
              { type: 'changeLudusReputation', amount: 2 },
              { type: 'changeLudusHappiness', amount: 3 },
            ],
          },
        ],
      },
      {
        id: 'stretchDebt',
        labelKey: 'events.creditorPressure.stretchDebt.label',
        consequenceKey: 'events.creditorPressure.stretchDebt.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeTreasury', amount: -25 },
              { type: 'changeLudusReputation', amount: -2 },
              { type: 'changeLudusHappiness', amount: -4 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'rivalPatronPoach',
    titleKey: 'events.rivalPatronPoach.title',
    descriptionKey: 'events.rivalPatronPoach.description',
    triggerActivities: ['contracts'],
    triggerBuildingActivities: ['trainingGround.nobleTraining'],
    choices: [
      {
        id: 'counterOffer',
        labelKey: 'events.rivalPatronPoach.counterOffer.label',
        consequenceKey: 'events.rivalPatronPoach.counterOffer.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeTreasury', amount: -55 },
              { type: 'changeLudusReputation', amount: 3 },
              { type: 'changeLudusGlory', amount: 1 },
            ],
          },
        ],
      },
      {
        id: 'letPatronWalk',
        labelKey: 'events.rivalPatronPoach.letPatronWalk.label',
        consequenceKey: 'events.rivalPatronPoach.letPatronWalk.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeTreasury', amount: 30 },
              { type: 'changeLudusReputation', amount: -2 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'cellblockConspiracy',
    titleKey: 'events.cellblockConspiracy.title',
    descriptionKey: 'events.cellblockConspiracy.description',
    triggerActivities: ['security'],
    triggerBuildingActivities: ['guardBarracks.rebellionProtocol'],
    requiredLudus: {
      rebellionAtLeast: 40,
      securityAtMost: 70,
    },
    choices: [
      {
        id: 'plantInformants',
        labelKey: 'events.cellblockConspiracy.plantInformants.label',
        consequenceKey: 'events.cellblockConspiracy.plantInformants.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeTreasury', amount: -45 },
              { type: 'changeLudusSecurity', amount: 7 },
              { type: 'changeLudusRebellion', amount: -12 },
              { type: 'changeLudusHappiness', amount: -4 },
            ],
          },
        ],
      },
      {
        id: 'offerAmnesty',
        labelKey: 'events.cellblockConspiracy.offerAmnesty.label',
        consequenceKey: 'events.cellblockConspiracy.offerAmnesty.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeLudusHappiness', amount: 5 },
              { type: 'changeLudusRebellion', amount: -8 },
              { type: 'changeLudusSecurity', amount: -2 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'masterworkCommission',
    titleKey: 'events.masterworkCommission.title',
    descriptionKey: 'events.masterworkCommission.description',
    triggerActivities: ['production'],
    triggerBuildingActivities: ['forgeWorkshop.weaponContracts', 'forgeWorkshop.legionContract'],
    choices: [
      {
        id: 'rushShipment',
        labelKey: 'events.masterworkCommission.rushShipment.label',
        consequenceKey: 'events.masterworkCommission.rushShipment.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeTreasury', amount: 120 },
              { type: 'changeLudusReputation', amount: -1 },
              { type: 'changeLudusSecurity', amount: -2 },
            ],
          },
        ],
      },
      {
        id: 'perfectCraft',
        labelKey: 'events.masterworkCommission.perfectCraft.label',
        consequenceKey: 'events.masterworkCommission.perfectCraft.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeTreasury', amount: 45 },
              { type: 'changeLudusReputation', amount: 2 },
              { type: 'changeLudusGlory', amount: 1 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'arenaPatronFeud',
    titleKey: 'events.arenaPatronFeud.title',
    descriptionKey: 'events.arenaPatronFeud.description',
    triggerActivities: ['events', 'contracts'],
    triggerBuildingActivities: [
      'domus.championshipBooking',
      'bookmakerOffice.championshipBook',
      'exhibitionGrounds.grandSpectacle',
    ],
    choices: [
      {
        id: 'splitSeats',
        labelKey: 'events.arenaPatronFeud.splitSeats.label',
        consequenceKey: 'events.arenaPatronFeud.splitSeats.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeTreasury', amount: -50 },
              { type: 'changeLudusReputation', amount: 3 },
              { type: 'changeLudusSecurity', amount: 2 },
            ],
          },
        ],
      },
      {
        id: 'favorFaction',
        labelKey: 'events.arenaPatronFeud.favorFaction.label',
        consequenceKey: 'events.arenaPatronFeud.favorFaction.consequence',
        consequences: [
          {
            kind: 'certain',
            effects: [
              { type: 'changeTreasury', amount: 70 },
              { type: 'changeLudusReputation', amount: -2 },
              { type: 'changeLudusGlory', amount: 1 },
              { type: 'changeLudusHappiness', amount: -3 },
            ],
          },
        ],
      },
    ],
  },
];
