import { getAvailableSkillPoints } from '../gladiators/progression';
import { GAME_BALANCE } from '../../game-data/balance';
import type { Gladiator } from '../gladiators/types';
import { getAvailableLudusGladiatorPlaces } from '../ludus/capacity';
import {
  validateWeeklyPlanning,
  type WeeklyPlanningValidation,
} from '../planning/planning-actions';
import type { GameAlert } from '../planning/types';
import type { GameSave } from '../saves/types';
import {
  getActiveTemporaryGladiatorTraits,
  getGladiatorTraitDefinition,
  getRemainingGladiatorTraitDuration,
} from '../gladiator-traits/gladiator-trait-actions';
import type { GladiatorTrait } from '../gladiators/types';

export type AlertRuleScope = 'ludus' | 'building' | 'gladiator';

export interface AlertRuleContext {
  createdAt: string;
  gladiator?: Gladiator;
  trait?: GladiatorTrait;
}

export interface AlertRule {
  id: string;
  scope: AlertRuleScope;
  evaluate(save: GameSave, context: AlertRuleContext): GameAlert | null;
}

function createSkillPointAlert(gladiatorId: string, createdAt: string): GameAlert {
  return {
    id: `alert-${gladiatorId}-skill-point`,
    severity: 'info',
    titleKey: 'alerts.unassignedSkillPoints.title',
    descriptionKey: 'alerts.unassignedSkillPoints.description',
    actionKind: 'allocateGladiatorSkillPoint',
    gladiatorId,
    createdAt,
  };
}

function createTraitAlert(
  gladiatorId: string,
  trait: GladiatorTrait,
  createdAt: string,
): GameAlert | null {
  const definition = getGladiatorTraitDefinition(trait.traitId);

  if (!trait.expiresAt || !definition?.showAlert) {
    return null;
  }

  return {
    id: `alert-${gladiatorId}-trait-${trait.traitId}`,
    severity: 'warning',
    titleKey: definition.nameKey,
    descriptionKey: definition.descriptionKey,
    gladiatorId,
    traitId: trait.traitId,
    createdAt,
  };
}

function createEmptyPlanningAlert(createdAt: string): GameAlert {
  return {
    id: 'alert-weekly-planning-empty',
    severity: 'critical',
    titleKey: 'alerts.emptyPlanning.title',
    descriptionKey: 'alerts.emptyPlanning.description',
    actionKind: 'openWeeklyPlanning',
    createdAt,
  };
}

function createIncompletePlanningAlert(createdAt: string): GameAlert {
  return {
    id: 'alert-weekly-planning-incomplete',
    severity: 'warning',
    titleKey: 'alerts.incompletePlanning.title',
    descriptionKey: 'alerts.incompletePlanning.description',
    actionKind: 'openWeeklyPlanning',
    createdAt,
  };
}

function createOpenRegisterAlert(save: GameSave, createdAt: string): GameAlert {
  return {
    id: 'alert-dormitory-open-register',
    severity: save.gladiators.length === 0 ? 'warning' : 'info',
    titleKey: 'alerts.openRegister.title',
    descriptionKey: 'alerts.openRegister.description',
    actionKind: 'openMarket',
    buildingId: 'dormitory',
    createdAt,
  };
}

function createLowTreasuryAlert(save: GameSave, createdAt: string): GameAlert {
  const isNegative = save.ludus.treasury < 0;

  return {
    id: 'alert-ludus-low-treasury',
    severity: isNegative ? 'critical' : 'warning',
    titleKey: isNegative ? 'alerts.negativeTreasury.title' : 'alerts.lowTreasury.title',
    descriptionKey: isNegative
      ? 'alerts.negativeTreasury.description'
      : 'alerts.lowTreasury.description',
    actionKind: 'openFinance',
    createdAt,
  };
}

function getAssignedPlanningPoints(validation: WeeklyPlanningValidation) {
  return validation.days.reduce(
    (total, day) => total + day.buckets.reduce((dayTotal, bucket) => dayTotal + bucket.used, 0),
    0,
  );
}

export const ludusAlertRules: AlertRule[] = [
  {
    id: 'low-treasury',
    scope: 'ludus',
    evaluate(save, context) {
      return save.ludus.treasury < GAME_BALANCE.economy.lowTreasuryWarningThreshold
        ? createLowTreasuryAlert(save, context.createdAt)
        : null;
    },
  },
  {
    id: 'weekly-planning',
    scope: 'ludus',
    evaluate(save, context) {
      if (save.gladiators.length === 0) {
        return null;
      }

      const validation = validateWeeklyPlanning(save);

      if (validation.remainingDays.length === 0 || validation.isComplete) {
        return null;
      }

      return getAssignedPlanningPoints(validation) === 0
        ? createEmptyPlanningAlert(context.createdAt)
        : createIncompletePlanningAlert(context.createdAt);
    },
  },
];

export const buildingAlertRules: AlertRule[] = [
  {
    id: 'dormitory-open-register',
    scope: 'building',
    evaluate(save, context) {
      const hasAvailablePlace = getAvailableLudusGladiatorPlaces(save) > 0;
      const hasAffordableMarketCandidate = save.market.availableGladiators.some(
        (gladiator) => gladiator.price <= save.ludus.treasury,
      );

      return hasAvailablePlace && hasAffordableMarketCandidate
        ? createOpenRegisterAlert(save, context.createdAt)
        : null;
    },
  },
];

const gladiatorProfileAlertRules: AlertRule[] = [
  {
    id: 'gladiator-skill-points',
    scope: 'gladiator',
    evaluate(_save, context) {
      if (!context.gladiator || getAvailableSkillPoints(context.gladiator) <= 0) {
        return null;
      }

      return createSkillPointAlert(context.gladiator.id, context.createdAt);
    },
  },
];

const gladiatorTraitAlertRules: AlertRule[] = [
  {
    id: 'gladiator-traits',
    scope: 'gladiator',
    evaluate(save, context) {
      const trait = context.trait;
      const gladiator = context.gladiator;

      if (!trait || !gladiator) {
        return null;
      }

      const remainingDuration = getRemainingGladiatorTraitDuration(trait, {
        year: save.time.year,
        week: save.time.week,
        dayOfWeek: save.time.dayOfWeek,
      });
      const alert = createTraitAlert(gladiator.id, trait, context.createdAt);

      return alert && remainingDuration && remainingDuration.days > 0 ? alert : null;
    },
  },
];

export const gladiatorAlertRules: AlertRule[] = [
  ...gladiatorProfileAlertRules,
  ...gladiatorTraitAlertRules,
];

function preserveCreatedAt(alert: GameAlert, existingAlertsById: Map<string, GameAlert>) {
  const existingAlert = existingAlertsById.get(alert.id);

  return existingAlert ? { ...alert, createdAt: existingAlert.createdAt } : alert;
}

function evaluateRules(save: GameSave, rules: AlertRule[], context: AlertRuleContext) {
  return rules.flatMap((rule) => {
    const alert = rule.evaluate(save, context);

    return alert ? [alert] : [];
  });
}

function evaluateGladiatorRules(save: GameSave, context: AlertRuleContext) {
  const skillAlerts = save.gladiators.flatMap((gladiator) =>
    evaluateRules(save, gladiatorProfileAlertRules, { ...context, gladiator }),
  );
  const traitAlerts = getActiveTemporaryGladiatorTraits(save).flatMap(({ gladiator, trait }) =>
    evaluateRules(save, gladiatorTraitAlertRules, { ...context, gladiator, trait }),
  );

  return [...skillAlerts, ...traitAlerts];
}

export function generateGameAlerts(
  save: GameSave,
  existingAlerts: GameAlert[] = save.planning.alerts ?? [],
): GameAlert[] {
  const existingAlertsById = new Map(existingAlerts.map((alert) => [alert.id, alert]));
  const context = { createdAt: save.updatedAt };

  return [
    ...evaluateRules(save, ludusAlertRules, context),
    ...evaluateRules(save, buildingAlertRules, context),
    ...evaluateGladiatorRules(save, context),
  ].map((alert) => preserveCreatedAt(alert, existingAlertsById));
}

function areGameAlertsEqual(left: GameAlert[], right: GameAlert[]) {
  return (
    left.length === right.length &&
    left.every((alert, index) => {
      const otherAlert = right[index];

      return (
        alert.id === otherAlert.id &&
        alert.severity === otherAlert.severity &&
        alert.titleKey === otherAlert.titleKey &&
        alert.descriptionKey === otherAlert.descriptionKey &&
        alert.actionKind === otherAlert.actionKind &&
        alert.gladiatorId === otherAlert.gladiatorId &&
        alert.buildingId === otherAlert.buildingId &&
        alert.traitId === otherAlert.traitId &&
        alert.createdAt === otherAlert.createdAt
      );
    })
  );
}

export function refreshGameAlerts(save: GameSave): GameSave {
  const currentAlerts = save.planning.alerts ?? [];
  const nextAlerts = generateGameAlerts(save, currentAlerts);

  if (areGameAlertsEqual(nextAlerts, currentAlerts)) {
    return save;
  }

  return {
    ...save,
    planning: {
      ...save.planning,
      alerts: nextAlerts,
    },
  };
}
