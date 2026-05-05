import { getAvailableSkillPoints } from '../gladiators/progression';
import type { Gladiator } from '../gladiators/types';
import { getAvailableLudusGladiatorPlaces } from '../ludus/capacity';
import {
  validateWeeklyPlanning,
  type WeeklyPlanningValidation,
} from '../planning/planning-actions';
import type { GameAlert } from '../planning/types';
import type { GameSave } from '../saves/types';
import {
  getActiveStatusEffects,
  getRemainingStatusEffectDuration,
  getStatusEffectDefinition,
} from '../status-effects/status-effect-actions';
import type { ActiveStatusEffect } from '../status-effects/types';

export type AlertRuleScope = 'ludus' | 'building' | 'gladiator';

export interface AlertRuleContext {
  createdAt: string;
  gladiator?: Gladiator;
  statusEffect?: ActiveStatusEffect;
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

function createStatusEffectAlert(
  gladiatorId: string,
  statusEffectId: string,
  statusEffectInstanceId: string,
  createdAt: string,
): GameAlert | null {
  const definition = getStatusEffectDefinition(statusEffectId);

  if (!definition?.showAlert) {
    return null;
  }

  return {
    id: `alert-${gladiatorId}-status-effect-${statusEffectInstanceId}`,
    severity: 'warning',
    titleKey: definition.nameKey,
    descriptionKey: definition.descriptionKey,
    gladiatorId,
    statusEffectId,
    statusEffectInstanceId,
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
    id: 'alert-domus-open-register',
    severity: save.gladiators.length === 0 ? 'warning' : 'info',
    titleKey: 'alerts.openRegister.title',
    descriptionKey: 'alerts.openRegister.description',
    actionKind: 'openMarket',
    buildingId: 'domus',
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
    id: 'domus-open-register',
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

export const gladiatorAlertRules: AlertRule[] = [
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
  {
    id: 'gladiator-status-effects',
    scope: 'gladiator',
    evaluate(save, context) {
      const effect = context.statusEffect;

      if (!effect || effect.target.type !== 'gladiator') {
        return null;
      }

      const remainingDuration = getRemainingStatusEffectDuration(effect, {
        year: save.time.year,
        week: save.time.week,
        dayOfWeek: save.time.dayOfWeek,
      });
      const alert = createStatusEffectAlert(
        effect.target.id,
        effect.effectId,
        effect.id,
        context.createdAt,
      );

      return alert && remainingDuration.days > 0 ? alert : null;
    },
  },
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
    evaluateRules(save, gladiatorAlertRules, { ...context, gladiator }),
  );
  const statusEffectAlerts = getActiveStatusEffects(save).flatMap((statusEffect) =>
    evaluateRules(save, gladiatorAlertRules, { ...context, statusEffect }),
  );

  return [...skillAlerts, ...statusEffectAlerts];
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
        alert.statusEffectId === otherAlert.statusEffectId &&
        alert.statusEffectInstanceId === otherAlert.statusEffectInstanceId &&
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
