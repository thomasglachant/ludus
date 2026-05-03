import { BUILDING_ACTIVITY_DEFINITIONS } from '../../game-data/building-activities';
import { BUILDING_IDS } from '../../game-data/buildings';
import { isStaffVisualIdForType } from '../../game-data/staff-visuals';
import { updateBuildingEfficiencies } from '../buildings/building-staffing';
import { createInitialEconomyState, updateCurrentWeekSummary } from '../economy/economy-actions';
import { createInitialStaffState, synchronizeStaffAssignments } from '../staff/staff-actions';
import { createDefaultWeeklyPlan } from '../weekly-simulation/weekly-simulation-actions';
import {
  createInitialLudusMapState,
  LUDUS_MAP_STATE_SCHEMA_VERSION,
} from '../../game-data/map-layout';
import { DAYS_OF_WEEK } from '../../game-data/time';
import type { BuildingId } from '../buildings/types';
import type { ArenaDayState, CombatState } from '../combat/types';
import type {
  ActiveLoan,
  EconomyLedgerEntry,
  EconomyState,
  WeeklyProjection,
} from '../economy/types';
import type { GameEvent, LaunchedGameEventRecord } from '../events/types';
import type { Gladiator } from '../gladiators/types';
import type { MarketGladiator } from '../market/types';
import type {
  DailyPlan,
  DailyPlanActivity,
  DailyPlanBuildingActivitySelections,
  DailyPlanPoints,
  DailySimulationSummary,
  GameAlert,
  WeeklyReport,
} from '../planning/types';
import type {
  StaffAssignment,
  StaffMarketCandidate,
  StaffMember,
  StaffState,
  StaffType,
} from '../staff/types';
import type { DayOfWeek } from '../time/types';
import type { LudusMapPlacement, LudusMapState, LudusMapTileOverride } from '../map/types';
import type { GameSave } from './types';
import { CURRENT_SCHEMA_VERSION } from './create-initial-save';

const requiredBuildingIds: BuildingId[] = [...BUILDING_IDS];
const legacyRemovedBuildingIds = ['office', 'nobleTraining'] as const;
const supportedBuildingIds = [...requiredBuildingIds, ...legacyRemovedBuildingIds];
const dayOfWeeks = [...DAYS_OF_WEEK];
const legacySupportedSchemaVersions = [CURRENT_SCHEMA_VERSION];
const gamePhases = ['planning', 'simulation', 'event', 'arena', 'report', 'gameOver'];
const gameStatuses = ['active', 'lost'];
const mapPlacementKinds = ['building', 'prop', 'road', 'wall'];
const arenaRanks = [
  'bronze3',
  'bronze2',
  'bronze1',
  'silver3',
  'silver2',
  'silver1',
  'gold3',
  'gold2',
  'gold1',
];
const arenaDayPhases = ['intro', 'summary'];
const gladiatorTraits = [
  'disciplined',
  'lazy',
  'brave',
  'cowardly',
  'ambitious',
  'fragile',
  'crowdFavorite',
  'rivalrous',
  'stoic',
];
const alertSeverities = ['info', 'warning', 'critical'];
const eventStatuses = ['pending', 'resolved', 'expired'];
const dailyPlanActivities: DailyPlanActivity[] = [
  'strengthTraining',
  'agilityTraining',
  'defenseTraining',
  'lifeTraining',
  'meals',
  'sleep',
  'leisure',
  'care',
  'production',
  'security',
];
const legacyDailyPlanActivities = ['training', 'contracts', 'maintenance', 'events'];
const supportedDailyPlanPointKeys = [...dailyPlanActivities, ...legacyDailyPlanActivities];
const requiredDailyPlanPointKeys = dailyPlanActivities.filter(
  (activity) =>
    activity !== 'strengthTraining' &&
    activity !== 'agilityTraining' &&
    activity !== 'defenseTraining' &&
    activity !== 'lifeTraining',
);
const economyEntryKinds = ['income', 'expense'];
const economyCategories = [
  'arena',
  'contracts',
  'production',
  'market',
  'staff',
  'maintenance',
  'food',
  'medicine',
  'loan',
  'event',
  'building',
  'other',
];
const loanIds = ['smallLoan', 'businessLoan', 'patronLoan'];
const staffTypes = ['slave', 'guard', 'trainer'];
const legacyRemovedBuildingActivities = [
  {
    activity: 'maintenance',
    id: 'office.profitForecasting',
    replacementId: 'domus.profitForecasting',
  },
  {
    activity: 'contracts',
    id: 'office.championshipBooking',
    replacementId: 'domus.championshipBooking',
  },
  {
    activity: 'contracts',
    id: 'nobleTraining.patronSessions',
    replacementId: 'trainingGround.nobleTraining',
  },
] as const;
const eventConsequenceKinds = ['certain', 'chance', 'oneOf'];
const eventEffectTypes = [
  'changeTreasury',
  'changeLudusReputation',
  'changeLudusSecurity',
  'changeLudusHappiness',
  'changeLudusRebellion',
  'removeGladiator',
  'releaseAllGladiators',
  'changeGladiatorStat',
];
const eventStatFields = ['strength', 'agility', 'defense', 'life'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function hasString(value: Record<string, unknown>, key: string) {
  return typeof value[key] === 'string';
}

function hasNumber(value: Record<string, unknown>, key: string) {
  return typeof value[key] === 'number' && Number.isFinite(value[key]);
}

function hasNonNegativeNumber(value: Record<string, unknown>, key: string) {
  return hasNumber(value, key) && (value[key] as number) >= 0;
}

function hasBoolean(value: Record<string, unknown>, key: string) {
  return typeof value[key] === 'boolean';
}

function hasArray(value: Record<string, unknown>, key: string) {
  return Array.isArray(value[key]);
}

function hasOptionalString(value: Record<string, unknown>, key: string) {
  return value[key] === undefined || typeof value[key] === 'string';
}

function hasStringFrom(
  value: Record<string, unknown>,
  key: string,
  allowedValues: readonly string[],
) {
  return typeof value[key] === 'string' && allowedValues.includes(value[key]);
}

function isStringFrom(value: unknown, allowedValues: readonly string[]) {
  return typeof value === 'string' && allowedValues.includes(value);
}

function hasNumberFrom(
  value: Record<string, unknown>,
  key: string,
  allowedValues: readonly number[],
) {
  return typeof value[key] === 'number' && allowedValues.includes(value[key]);
}

function isBuildingId(value: unknown): value is BuildingId {
  return isStringFrom(value, requiredBuildingIds);
}

function isOptionalBuildingId(value: unknown): value is BuildingId | undefined {
  return value === undefined || isBuildingId(value);
}

function isSupportedBuildingId(value: unknown) {
  return isStringFrom(value, supportedBuildingIds);
}

function isStringArray(value: unknown) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isGridCoord(value: unknown) {
  return isRecord(value) && hasNumber(value, 'column') && hasNumber(value, 'row');
}

function isStringNumberRecord(value: unknown) {
  return (
    isRecord(value) &&
    Object.values(value).every(
      (recordValue) => typeof recordValue === 'string' || typeof recordValue === 'number',
    )
  );
}

function isMapTileOverride(value: unknown): value is LudusMapTileOverride {
  return (
    isRecord(value) &&
    isGridCoord(value.coord) &&
    (value.terrainId === undefined || typeof value.terrainId === 'string') &&
    (value.groundId === undefined || typeof value.groundId === 'string')
  );
}

function isMapPlacement(value: unknown): value is LudusMapPlacement {
  return (
    isRecord(value) &&
    hasString(value, 'id') &&
    hasStringFrom(value, 'kind', mapPlacementKinds) &&
    hasString(value, 'definitionId') &&
    isGridCoord(value.origin) &&
    (value.rotation === undefined ||
      value.rotation === 0 ||
      value.rotation === 90 ||
      value.rotation === 180 ||
      value.rotation === 270)
  );
}

function isMapState(value: unknown): value is LudusMapState {
  return (
    isRecord(value) &&
    value.schemaVersion === LUDUS_MAP_STATE_SCHEMA_VERSION &&
    hasString(value, 'gridId') &&
    Array.isArray(value.placements) &&
    Array.isArray(value.editedTiles) &&
    value.placements.every(isMapPlacement) &&
    value.editedTiles.every(isMapTileOverride)
  );
}

function isBuildingState(value: unknown, buildingId: BuildingId) {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.id === buildingId &&
    hasBoolean(value, 'isPurchased') &&
    hasNumber(value, 'level') &&
    hasArray(value, 'purchasedImprovementIds') &&
    hasArray(value, 'purchasedSkillIds') &&
    hasArray(value, 'staffAssignmentIds') &&
    hasNumber(value, 'efficiency') &&
    hasOptionalString(value, 'selectedPolicyId') &&
    (value.configuration === undefined || isRecord(value.configuration))
  );
}

function isGladiatorTrainingPlan(value: unknown, gladiatorId: string) {
  return (
    isRecord(value) &&
    value.gladiatorId === gladiatorId &&
    hasNumber(value, 'strength') &&
    hasNumber(value, 'agility') &&
    hasNumber(value, 'defense') &&
    (value.life === undefined || hasNumber(value, 'life'))
  );
}

function isGladiatorWeeklyInjury(value: unknown) {
  return (
    isRecord(value) &&
    hasStringFrom(value, 'reason', ['training', 'combat', 'event']) &&
    hasNumber(value, 'year') &&
    hasNumber(value, 'week')
  );
}

function isGladiator(value: unknown): value is Gladiator {
  if (!isRecord(value)) {
    return false;
  }

  return (
    hasString(value, 'id') &&
    hasString(value, 'name') &&
    hasNumber(value, 'age') &&
    hasNumber(value, 'strength') &&
    hasNumber(value, 'agility') &&
    hasNumber(value, 'defense') &&
    (hasNumber(value, 'life') || hasNumber(value, 'health')) &&
    hasNumber(value, 'reputation') &&
    hasNumber(value, 'wins') &&
    hasNumber(value, 'losses') &&
    Array.isArray(value.traits) &&
    value.traits.every((trait) => isStringFrom(trait, gladiatorTraits)) &&
    (value.trainingPlan === undefined ||
      isGladiatorTrainingPlan(value.trainingPlan, value.id as string)) &&
    (value.weeklyInjury === undefined || isGladiatorWeeklyInjury(value.weeklyInjury)) &&
    (value.visualIdentity === undefined || isRecord(value.visualIdentity))
  );
}

function isTimeState(value: unknown) {
  if (!isRecord(value)) {
    return false;
  }

  return (
    hasNumber(value, 'year') &&
    hasNumber(value, 'week') &&
    hasStringFrom(value, 'dayOfWeek', dayOfWeeks) &&
    hasStringFrom(value, 'phase', gamePhases)
  );
}

function isMarketState(value: unknown) {
  return (
    isRecord(value) &&
    hasNumber(value, 'week') &&
    hasNumber(value, 'year') &&
    Array.isArray(value.availableGladiators) &&
    value.availableGladiators.every(isMarketGladiator)
  );
}

function isMarketGladiator(value: unknown): value is MarketGladiator {
  return isRecord(value) && isGladiator(value) && hasNumber(value, 'price');
}

function isCombatTurn(value: unknown) {
  return (
    isRecord(value) &&
    hasNumber(value, 'turnNumber') &&
    hasString(value, 'attackerId') &&
    hasString(value, 'defenderId') &&
    hasBoolean(value, 'didHit') &&
    hasNumber(value, 'damage') &&
    hasNumber(value, 'attackerHealthAfterTurn') &&
    hasNumber(value, 'defenderHealthAfterTurn') &&
    hasString(value, 'logKey') &&
    isStringNumberRecord(value.logParams)
  );
}

function isCombatReward(value: unknown) {
  return (
    isRecord(value) &&
    hasNumber(value, 'totalReward') &&
    hasNumber(value, 'winnerReward') &&
    hasNumber(value, 'loserReward') &&
    (value.participationReward === undefined || typeof value.participationReward === 'number') &&
    (value.victoryReward === undefined || typeof value.victoryReward === 'number') &&
    (value.publicStakeModifier === undefined || typeof value.publicStakeModifier === 'number') &&
    (value.playerDecimalOdds === undefined || typeof value.playerDecimalOdds === 'number') &&
    (value.opponentDecimalOdds === undefined || typeof value.opponentDecimalOdds === 'number')
  );
}

function isCombatConsequence(value: unknown) {
  return (
    isRecord(value) &&
    hasBoolean(value, 'didPlayerWin') &&
    hasNumber(value, 'playerReward') &&
    hasNumber(value, 'reputationChange') &&
    hasNumber(value, 'finalReputation')
  );
}

function isCombatState(value: unknown): value is CombatState {
  return (
    isRecord(value) &&
    hasString(value, 'id') &&
    isGladiator(value.gladiator) &&
    isGladiator(value.opponent) &&
    hasStringFrom(value, 'rank', arenaRanks) &&
    Array.isArray(value.turns) &&
    value.turns.every(isCombatTurn) &&
    hasOptionalString(value, 'winnerId') &&
    hasOptionalString(value, 'loserId') &&
    isCombatReward(value.reward) &&
    isCombatConsequence(value.consequence)
  );
}

function isArenaDayState(value: unknown): value is ArenaDayState {
  return (
    isRecord(value) &&
    hasNumber(value, 'year') &&
    hasNumber(value, 'week') &&
    hasStringFrom(value, 'phase', arenaDayPhases) &&
    Array.isArray(value.presentedCombatIds) &&
    value.presentedCombatIds.every((combatId) => typeof combatId === 'string')
  );
}

function isArenaState(value: unknown) {
  return (
    isRecord(value) &&
    hasOptionalString(value, 'currentCombatId') &&
    (value.arenaDay === undefined || isArenaDayState(value.arenaDay)) &&
    Array.isArray(value.resolvedCombats) &&
    value.resolvedCombats.every(isCombatState) &&
    hasBoolean(value, 'isArenaDayActive')
  );
}

function isGameAlert(value: unknown): value is GameAlert {
  return (
    isRecord(value) &&
    hasString(value, 'id') &&
    hasStringFrom(value, 'severity', alertSeverities) &&
    hasString(value, 'titleKey') &&
    hasString(value, 'descriptionKey') &&
    (value.gladiatorId === undefined || typeof value.gladiatorId === 'string') &&
    (value.buildingId === undefined || isStringFrom(value.buildingId, requiredBuildingIds)) &&
    hasString(value, 'createdAt')
  );
}

function isDailyPlanPoints(value: unknown): value is DailyPlanPoints {
  return (
    isRecord(value) &&
    requiredDailyPlanPointKeys.every((activity) => hasNonNegativeNumber(value, activity)) &&
    Object.keys(value).every(
      (key) => isStringFrom(key, supportedDailyPlanPointKeys) && hasNonNegativeNumber(value, key),
    )
  );
}

function normalizeDailyPlanPoints(
  value: unknown,
  fallbackPoints: DailyPlanPoints,
): DailyPlanPoints {
  if (!isRecord(value)) {
    return fallbackPoints;
  }

  return Object.fromEntries(
    dailyPlanActivities.map((activity) => [
      activity,
      hasNonNegativeNumber(value, activity) ? value[activity] : fallbackPoints[activity],
    ]),
  ) as DailyPlanPoints;
}

function isBuildingActivitySelections(
  value: unknown,
): value is DailyPlanBuildingActivitySelections {
  if (!isRecord(value)) {
    return false;
  }

  return Object.entries(value).every(([activity, activityId]) => {
    if (!isStringFrom(activity, supportedDailyPlanPointKeys) || typeof activityId !== 'string') {
      return false;
    }

    const isCurrentActivitySelection = BUILDING_ACTIVITY_DEFINITIONS.some(
      (definition) => definition.id === activityId && definition.activity === activity,
    );
    const isLegacyActivitySelection = legacyRemovedBuildingActivities.some(
      (definition) => definition.id === activityId && definition.activity === activity,
    );

    return isCurrentActivitySelection || isLegacyActivitySelection;
  });
}

function isDailyPlan(value: unknown, dayOfWeek: DayOfWeek): value is DailyPlan {
  return (
    isRecord(value) &&
    value.dayOfWeek === dayOfWeek &&
    isDailyPlanPoints(value.gladiatorTimePoints) &&
    isDailyPlanPoints(value.laborPoints) &&
    isDailyPlanPoints(value.adminPoints) &&
    (value.buildingActivitySelections === undefined ||
      isBuildingActivitySelections(value.buildingActivitySelections))
  );
}

function isDailyPlansRecord(value: unknown) {
  return (
    isRecord(value) &&
    dayOfWeeks.every((dayOfWeek) => isDailyPlan(value[dayOfWeek], dayOfWeek)) &&
    Object.keys(value).every((key) => isStringFrom(key, dayOfWeeks))
  );
}

function isDailySimulationSummary(value: unknown): value is DailySimulationSummary {
  return (
    isRecord(value) &&
    hasStringFrom(value, 'dayOfWeek', dayOfWeeks) &&
    hasNumber(value, 'treasuryDelta') &&
    hasNumber(value, 'reputationDelta') &&
    hasNumber(value, 'happinessDelta') &&
    hasNumber(value, 'securityDelta') &&
    hasNumber(value, 'rebellionDelta') &&
    isStringArray(value.injuredGladiatorIds) &&
    isStringArray(value.eventIds)
  );
}

function isWeeklyReport(value: unknown): value is WeeklyReport {
  return (
    isRecord(value) &&
    hasString(value, 'id') &&
    hasNumber(value, 'year') &&
    hasNumber(value, 'week') &&
    Array.isArray(value.days) &&
    value.days.every(isDailySimulationSummary) &&
    hasNumber(value, 'treasuryDelta') &&
    hasNumber(value, 'reputationDelta') &&
    hasNumber(value, 'happinessDelta') &&
    hasNumber(value, 'securityDelta') &&
    hasNumber(value, 'rebellionDelta') &&
    hasNonNegativeNumber(value, 'injuries')
  );
}

function isPlanningState(value: unknown) {
  return (
    isRecord(value) &&
    hasNumber(value, 'week') &&
    hasNumber(value, 'year') &&
    isDailyPlansRecord(value.days) &&
    Array.isArray(value.reports) &&
    value.reports.every(isWeeklyReport) &&
    Array.isArray(value.alerts) &&
    value.alerts.every(isGameAlert)
  );
}

function isEconomyCategoryTotals(value: unknown) {
  return (
    isRecord(value) &&
    Object.entries(value).every(
      ([category, amount]) =>
        isStringFrom(category, economyCategories) &&
        typeof amount === 'number' &&
        Number.isFinite(amount) &&
        amount >= 0,
    )
  );
}

function isWeeklyProjection(value: unknown): value is WeeklyProjection {
  return (
    isRecord(value) &&
    isEconomyCategoryTotals(value.incomeByCategory) &&
    isEconomyCategoryTotals(value.expenseByCategory) &&
    hasNumber(value, 'net')
  );
}

function isEconomyLedgerEntry(value: unknown): value is EconomyLedgerEntry {
  return (
    isRecord(value) &&
    hasString(value, 'id') &&
    hasNumber(value, 'year') &&
    hasNumber(value, 'week') &&
    hasStringFrom(value, 'dayOfWeek', dayOfWeeks) &&
    hasStringFrom(value, 'kind', economyEntryKinds) &&
    hasStringFrom(value, 'category', economyCategories) &&
    hasNonNegativeNumber(value, 'amount') &&
    hasString(value, 'labelKey') &&
    isOptionalBuildingId(value.buildingId) &&
    hasOptionalString(value, 'relatedId')
  );
}

function isActiveLoan(value: unknown): value is ActiveLoan {
  return (
    isRecord(value) &&
    hasString(value, 'id') &&
    hasStringFrom(value, 'definitionId', loanIds) &&
    hasNonNegativeNumber(value, 'principal') &&
    hasNonNegativeNumber(value, 'remainingBalance') &&
    hasNonNegativeNumber(value, 'weeklyPayment') &&
    hasNonNegativeNumber(value, 'remainingWeeks') &&
    hasNumber(value, 'startedYear') &&
    hasNumber(value, 'startedWeek')
  );
}

function isEconomyState(value: unknown): value is EconomyState {
  return (
    isRecord(value) &&
    Array.isArray(value.ledgerEntries) &&
    value.ledgerEntries.every(isEconomyLedgerEntry) &&
    Array.isArray(value.activeLoans) &&
    value.activeLoans.every(isActiveLoan) &&
    (value.currentWeekSummary === undefined || isWeeklyProjection(value.currentWeekSummary)) &&
    isWeeklyProjection(value.weeklyProjection)
  );
}

function normalizeEconomyState(economyState?: EconomyState): EconomyState {
  const initialEconomyState = createInitialEconomyState();

  if (!economyState) {
    return initialEconomyState;
  }

  return {
    ...economyState,
    currentWeekSummary: economyState.currentWeekSummary ?? initialEconomyState.currentWeekSummary,
    weeklyProjection: economyState.weeklyProjection ?? initialEconomyState.weeklyProjection,
  };
}

function isStaffBuildingExperience(value: unknown) {
  return (
    isRecord(value) &&
    Object.entries(value).every(
      ([buildingId, experience]) =>
        isStringFrom(buildingId, supportedBuildingIds) &&
        typeof experience === 'number' &&
        Number.isFinite(experience) &&
        experience >= 0,
    )
  );
}

function isStaffMember(value: unknown): value is StaffMember {
  return (
    isRecord(value) &&
    hasString(value, 'id') &&
    hasString(value, 'name') &&
    hasStringFrom(value, 'type', staffTypes) &&
    hasString(value, 'visualId') &&
    typeof value.visualId === 'string' &&
    isStaffVisualIdForType(value.type as StaffType, value.visualId) &&
    hasNonNegativeNumber(value, 'weeklyWage') &&
    isStaffBuildingExperience(value.buildingExperience) &&
    (value.assignedBuildingId === undefined || isSupportedBuildingId(value.assignedBuildingId))
  );
}

function isStaffMarketCandidate(value: unknown): value is StaffMarketCandidate {
  return isRecord(value) && isStaffMember(value) && hasNonNegativeNumber(value, 'price');
}

function isStaffAssignment(value: unknown): value is StaffAssignment {
  return (
    isRecord(value) && isSupportedBuildingId(value.buildingId) && isStringArray(value.staffIds)
  );
}

function isStaffState(value: unknown): value is StaffState {
  return (
    isRecord(value) &&
    Array.isArray(value.members) &&
    value.members.every(isStaffMember) &&
    Array.isArray(value.assignments) &&
    value.assignments.every(isStaffAssignment) &&
    Array.isArray(value.marketCandidates) &&
    value.marketCandidates.every(isStaffMarketCandidate)
  );
}

function isGameEventEffect(value: unknown) {
  if (!isRecord(value) || !hasStringFrom(value, 'type', eventEffectTypes)) {
    return false;
  }

  const effectType = value.type as string;

  if (effectType === 'changeGladiatorStat') {
    return (
      hasString(value, 'gladiatorId') &&
      hasStringFrom(value, 'stat', eventStatFields) &&
      hasNumber(value, 'amount')
    );
  }

  if (effectType === 'removeGladiator') {
    return hasString(value, 'gladiatorId');
  }

  if (effectType === 'releaseAllGladiators') {
    return true;
  }

  if (effectType.startsWith('changeGladiator')) {
    return hasString(value, 'gladiatorId') && hasNumber(value, 'amount');
  }

  return hasNumber(value, 'amount');
}

function isGameEventOutcome(value: unknown) {
  if (!isRecord(value) || !hasString(value, 'id') || !hasNumber(value, 'chancePercent')) {
    return false;
  }

  const chancePercent = value.chancePercent as number;

  return (
    chancePercent >= 0 &&
    chancePercent <= 100 &&
    (value.textKey === undefined || typeof value.textKey === 'string') &&
    (value.effects === undefined ||
      (Array.isArray(value.effects) && value.effects.every(isGameEventEffect)))
  );
}

function hasCompleteOutcomeChance(outcomes: Array<Record<string, unknown>>) {
  const totalChance = outcomes.reduce(
    (total, outcome) => total + (outcome.chancePercent as number),
    0,
  );

  return Math.abs(totalChance - 100) < 0.0001;
}

function hasUniqueOutcomeIds(outcomes: Array<Record<string, unknown>>) {
  const outcomeIds = outcomes.map((outcome) => outcome.id);

  return new Set(outcomeIds).size === outcomeIds.length;
}

function isGameEventConsequence(value: unknown) {
  if (!isRecord(value) || !hasStringFrom(value, 'kind', eventConsequenceKinds)) {
    return false;
  }

  if (value.kind === 'certain') {
    return Array.isArray(value.effects) && value.effects.every(isGameEventEffect);
  }

  if (value.kind === 'chance') {
    return isGameEventOutcome(value);
  }

  if (!Array.isArray(value.outcomes) || !value.outcomes.every(isGameEventOutcome)) {
    return false;
  }

  return hasCompleteOutcomeChance(value.outcomes) && hasUniqueOutcomeIds(value.outcomes);
}

function isGameEventChoice(value: unknown) {
  return (
    isRecord(value) &&
    hasString(value, 'id') &&
    hasString(value, 'labelKey') &&
    hasString(value, 'consequenceKey') &&
    Array.isArray(value.consequences) &&
    value.consequences.every(isGameEventConsequence)
  );
}

function isGameEvent(value: unknown): value is GameEvent {
  return (
    isRecord(value) &&
    hasString(value, 'id') &&
    hasString(value, 'definitionId') &&
    hasString(value, 'titleKey') &&
    hasString(value, 'descriptionKey') &&
    hasStringFrom(value, 'status', eventStatuses) &&
    hasNumber(value, 'createdAtYear') &&
    hasNumber(value, 'createdAtWeek') &&
    hasStringFrom(value, 'createdAtDay', dayOfWeeks) &&
    (value.gladiatorId === undefined || typeof value.gladiatorId === 'string') &&
    (value.buildingId === undefined || isStringFrom(value.buildingId, requiredBuildingIds)) &&
    Array.isArray(value.choices) &&
    value.choices.every(isGameEventChoice) &&
    hasOptionalString(value, 'selectedChoiceId') &&
    (value.resolvedOutcomeIds === undefined ||
      (Array.isArray(value.resolvedOutcomeIds) &&
        value.resolvedOutcomeIds.every((outcomeId) => typeof outcomeId === 'string')))
  );
}

function isLaunchedGameEventRecord(value: unknown): value is LaunchedGameEventRecord {
  return (
    isRecord(value) &&
    hasString(value, 'eventId') &&
    hasString(value, 'definitionId') &&
    hasNumber(value, 'launchedAtYear') &&
    hasNumber(value, 'launchedAtWeek') &&
    hasStringFrom(value, 'launchedAtDay', dayOfWeeks)
  );
}

function isEventState(value: unknown) {
  return (
    isRecord(value) &&
    Array.isArray(value.pendingEvents) &&
    Array.isArray(value.resolvedEvents) &&
    value.pendingEvents.every(isGameEvent) &&
    value.resolvedEvents.every(isGameEvent) &&
    Array.isArray(value.launchedEvents) &&
    value.launchedEvents.every(isLaunchedGameEventRecord)
  );
}

function isSupportedGameSave(value: unknown): value is GameSave {
  if (!isRecord(value)) {
    return false;
  }

  if (!hasNumberFrom(value, 'schemaVersion', legacySupportedSchemaVersions)) {
    return false;
  }

  if (value.schemaVersion === CURRENT_SCHEMA_VERSION && !hasString(value, 'gameId')) {
    return false;
  }

  if (
    !hasString(value, 'saveId') ||
    !hasString(value, 'createdAt') ||
    !hasString(value, 'updatedAt')
  ) {
    return false;
  }

  if (
    !isRecord(value.player) ||
    !hasString(value.player, 'ludusName') ||
    !hasBoolean(value.player, 'isCloudUser')
  ) {
    return false;
  }

  if (
    !isRecord(value.ludus) ||
    !hasNumber(value.ludus, 'treasury') ||
    !hasNumber(value.ludus, 'reputation') ||
    !hasNumber(value.ludus, 'security') ||
    !hasNumber(value.ludus, 'happiness') ||
    !hasNumber(value.ludus, 'rebellion') ||
    !hasStringFrom(value.ludus, 'gameStatus', gameStatuses)
  ) {
    return false;
  }

  if (!isTimeState(value.time)) {
    return false;
  }

  if (
    value.schemaVersion === CURRENT_SCHEMA_VERSION &&
    value.map !== undefined &&
    !isRecord(value.map)
  ) {
    return false;
  }

  const buildings = value.buildings;

  if (!isRecord(buildings)) {
    return false;
  }

  return (
    requiredBuildingIds.every((buildingId) => isBuildingState(buildings[buildingId], buildingId)) &&
    Array.isArray(value.gladiators) &&
    value.gladiators.every(isGladiator) &&
    isEconomyState(value.economy) &&
    isStaffState(value.staff) &&
    isMarketState(value.market) &&
    isArenaState(value.arena) &&
    isPlanningState(value.planning) &&
    isEventState(value.events)
  );
}

export function isGameSave(value: unknown): value is GameSave {
  return isSupportedGameSave(value) && value.schemaVersion === CURRENT_SCHEMA_VERSION;
}

function normalizeMapState(mapState: unknown): LudusMapState {
  return isMapState(mapState) ? mapState : createInitialLudusMapState();
}

const legacyCanteenImprovementIds = new Set(['betterKitchen', 'proteinRations', 'grainStorage']);

function normalizePurchasedImprovementIds(
  buildingId: BuildingId,
  purchasedImprovementIds: string[],
) {
  return purchasedImprovementIds.filter(
    (improvementId) =>
      improvementId !== 'woodenWeapons' &&
      (buildingId !== 'canteen' || !legacyCanteenImprovementIds.has(improvementId)),
  );
}

function normalizeBuilding(
  building: GameSave['buildings'][BuildingId],
): GameSave['buildings'][BuildingId] {
  const normalizedBuilding = {
    ...building,
    efficiency: building.efficiency ?? (building.isPurchased ? 100 : 0),
    purchasedSkillIds: building.purchasedSkillIds ?? [],
    staffAssignmentIds: building.staffAssignmentIds ?? [],
    purchasedImprovementIds: normalizePurchasedImprovementIds(
      building.id,
      building.purchasedImprovementIds,
    ),
  };

  if (normalizedBuilding.id !== 'canteen') {
    return normalizedBuilding;
  }

  const neutralCanteen = { ...normalizedBuilding };
  delete neutralCanteen.configuration;
  delete neutralCanteen.selectedPolicyId;

  return neutralCanteen;
}

function normalizeBuildings(buildings: GameSave['buildings']): GameSave['buildings'] {
  return Object.fromEntries(
    requiredBuildingIds.map((buildingId) => [buildingId, normalizeBuilding(buildings[buildingId])]),
  ) as GameSave['buildings'];
}

function normalizeVisualIdentity(visualIdentity: Gladiator['visualIdentity']) {
  if (!visualIdentity) {
    return undefined;
  }

  const normalizedVisualIdentity = { ...visualIdentity } as Gladiator['visualIdentity'] & {
    accessoryStyle?: unknown;
  };
  delete normalizedVisualIdentity.accessoryStyle;

  return normalizedVisualIdentity;
}

function stripLegacyGladiatorFields(gladiator: Gladiator): Gladiator {
  const gladiatorWithoutClass = { ...gladiator } as Gladiator & {
    classId?: unknown;
    health?: unknown;
    energy?: unknown;
    morale?: unknown;
    satiety?: unknown;
    currentLocationId?: unknown;
    currentBuildingId?: unknown;
    currentActivityId?: unknown;
    currentTaskStartedAt?: unknown;
    mapMovement?: unknown;
  };
  delete gladiatorWithoutClass.classId;
  delete gladiatorWithoutClass.health;
  delete gladiatorWithoutClass.energy;
  delete gladiatorWithoutClass.morale;
  delete gladiatorWithoutClass.satiety;
  delete gladiatorWithoutClass.currentLocationId;
  delete gladiatorWithoutClass.currentBuildingId;
  delete gladiatorWithoutClass.currentActivityId;
  delete gladiatorWithoutClass.currentTaskStartedAt;
  delete gladiatorWithoutClass.mapMovement;

  return {
    ...gladiatorWithoutClass,
    life:
      typeof gladiator.life === 'number'
        ? gladiator.life
        : typeof (gladiator as Gladiator & { health?: unknown }).health === 'number'
          ? (gladiator as Gladiator & { health: number }).health
          : 10,
    trainingPlan: gladiator.trainingPlan
      ? {
          ...gladiator.trainingPlan,
          life: gladiator.trainingPlan.life ?? gladiatorWithoutClass.life ?? 10,
        }
      : undefined,
    weeklyInjury: gladiator.weeklyInjury,
    visualIdentity: normalizeVisualIdentity(gladiatorWithoutClass.visualIdentity),
  };
}

function normalizeGladiator(gladiator: Gladiator): Gladiator {
  return stripLegacyGladiatorFields(gladiator);
}

function normalizeCombatState<TCombat extends GameSave['arena']['resolvedCombats'][number]>(
  combat: TCombat,
): TCombat {
  const combatWithoutStrategy = { ...combat } as TCombat & {
    strategy?: unknown;
    gauges?: unknown;
  };
  delete combatWithoutStrategy.strategy;
  const gladiator = normalizeGladiator(combat.gladiator);
  const opponent = normalizeGladiator(combat.opponent);
  const createFallbackGauges = (fighter: Gladiator) => {
    const maxHealth = Math.min(100, Math.max(1, Math.round(40 + fighter.life * 4)));
    const maxEnergy = Math.min(
      100,
      Math.max(
        0,
        Math.round(35 + fighter.strength * 1.2 + fighter.agility * 1.6 + fighter.life * 0.8),
      ),
    );

    return {
      maxHealth,
      health: maxHealth,
      maxEnergy,
      energy: maxEnergy,
      morale: 70,
    };
  };

  return {
    ...combatWithoutStrategy,
    gladiator,
    opponent,
    gauges:
      combat.gauges ??
      ({
        player: createFallbackGauges(gladiator),
        opponent: createFallbackGauges(opponent),
      } as TCombat['gauges']),
  } as TCombat;
}

function normalizeBuildingActivitySelections(
  buildingActivitySelections: unknown,
): DailyPlanBuildingActivitySelections {
  if (!isBuildingActivitySelections(buildingActivitySelections)) {
    return {};
  }

  const supportedSelections = buildingActivitySelections as Record<string, string>;

  return Object.fromEntries(
    Object.entries(supportedSelections).flatMap(([activity, activityId]) => {
      const currentDefinition = BUILDING_ACTIVITY_DEFINITIONS.find(
        (definition) => definition.id === activityId && definition.activity === activity,
      );

      if (currentDefinition) {
        return [[activity, activityId]];
      }

      const legacyDefinition = legacyRemovedBuildingActivities.find(
        (definition) => definition.id === activityId && definition.activity === activity,
      );
      const replacementDefinition = legacyDefinition
        ? BUILDING_ACTIVITY_DEFINITIONS.find(
            (definition) =>
              definition.id === legacyDefinition.replacementId && definition.activity === activity,
          )
        : undefined;

      return replacementDefinition ? [[activity, replacementDefinition.id]] : [];
    }),
  ) as DailyPlanBuildingActivitySelections;
}

function normalizeDailyPlan(dayPlan: unknown, fallbackPlan: DailyPlan): DailyPlan {
  if (!isRecord(dayPlan)) {
    return fallbackPlan;
  }

  return {
    dayOfWeek: fallbackPlan.dayOfWeek,
    gladiatorTimePoints: normalizeDailyPlanPoints(
      dayPlan.gladiatorTimePoints,
      fallbackPlan.gladiatorTimePoints,
    ),
    laborPoints: normalizeDailyPlanPoints(dayPlan.laborPoints, fallbackPlan.laborPoints),
    adminPoints: fallbackPlan.adminPoints,
    buildingActivitySelections: normalizeBuildingActivitySelections(
      dayPlan.buildingActivitySelections,
    ),
  };
}

function normalizeDailyPlans(
  dailyPlans: unknown,
  fallbackPlans: Record<DayOfWeek, DailyPlan>,
): Record<DayOfWeek, DailyPlan> {
  if (!isRecord(dailyPlans)) {
    return fallbackPlans;
  }

  return Object.fromEntries(
    dayOfWeeks.map((dayOfWeek) => [
      dayOfWeek,
      normalizeDailyPlan(dailyPlans[dayOfWeek], fallbackPlans[dayOfWeek]),
    ]),
  ) as Record<DayOfWeek, DailyPlan>;
}

function normalizeBuildingExperience(buildingExperience: StaffMember['buildingExperience']) {
  return Object.fromEntries(
    Object.entries(buildingExperience).filter(([buildingId]) => isBuildingId(buildingId)),
  ) as StaffMember['buildingExperience'];
}

function normalizeStaffMember<TStaffMember extends StaffMember>(
  staffMember: TStaffMember,
): TStaffMember {
  const normalizedStaffMember = {
    ...staffMember,
    buildingExperience: normalizeBuildingExperience(staffMember.buildingExperience),
  } as TStaffMember & { assignedBuildingId?: unknown };

  if (!isOptionalBuildingId(normalizedStaffMember.assignedBuildingId)) {
    delete normalizedStaffMember.assignedBuildingId;
  }

  return normalizedStaffMember as TStaffMember;
}

function normalizeStaffAssignments(assignments: StaffAssignment[]) {
  return assignments.filter((assignment) => isBuildingId(assignment.buildingId));
}

function normalizeStaffState(staffState?: StaffState): StaffState {
  const initialStaffState = createInitialStaffState();

  if (!staffState) {
    return initialStaffState;
  }

  return {
    ...staffState,
    assignments: normalizeStaffAssignments(staffState.assignments ?? []),
    marketCandidates: (staffState.marketCandidates ?? initialStaffState.marketCandidates).map(
      normalizeStaffMember,
    ),
    members: (staffState.members ?? initialStaffState.members).map(normalizeStaffMember),
  };
}

export function normalizeGameSave(save: GameSave): GameSave {
  const saveWithOptionalMap = save as GameSave & { gameId?: unknown; map?: unknown };
  const defaultWeeklyPlan = createDefaultWeeklyPlan(save.time.year, save.time.week);
  const normalizedSave: GameSave & { contracts?: unknown; settings?: unknown } = {
    ...save,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    gameId:
      typeof saveWithOptionalMap.gameId === 'string' ? saveWithOptionalMap.gameId : save.saveId,
    player: {
      ludusName: save.player.ludusName,
      isCloudUser: save.player.isCloudUser,
    },
    ludus: {
      treasury: save.ludus.treasury,
      reputation: save.ludus.reputation,
      security: save.ludus.security ?? 50,
      happiness: save.ludus.happiness ?? 65,
      rebellion: save.ludus.rebellion ?? 0,
      gameStatus: save.ludus.gameStatus ?? 'active',
    },
    time: {
      year: save.time.year,
      week: save.time.week,
      dayOfWeek: save.time.dayOfWeek,
      phase: save.time.phase ?? 'planning',
    },
    map: normalizeMapState(saveWithOptionalMap.map),
    buildings: normalizeBuildings(save.buildings),
    gladiators: save.gladiators.map(normalizeGladiator),
    economy: normalizeEconomyState(save.economy),
    staff: normalizeStaffState(save.staff),
    market: {
      ...save.market,
      availableGladiators: save.market.availableGladiators.map((gladiator) => ({
        ...normalizeGladiator(gladiator),
        price: gladiator.price,
      })),
    },
    arena: {
      ...save.arena,
      resolvedCombats: save.arena.resolvedCombats.map(normalizeCombatState),
    },
    planning: {
      year: save.planning.year,
      week: save.planning.week,
      days: normalizeDailyPlans(save.planning.days, defaultWeeklyPlan.days),
      reports: save.planning.reports ?? [],
      alerts: save.planning.alerts ?? [],
    },
    events: {
      pendingEvents: [],
      resolvedEvents: [],
      launchedEvents: save.events.launchedEvents.filter(isLaunchedGameEventRecord),
    },
  };

  delete normalizedSave.settings;
  delete normalizedSave.contracts;
  delete (normalizedSave.arena as GameSave['arena'] & { betting?: unknown }).betting;
  delete (normalizedSave.arena as GameSave['arena'] & { pendingCombats?: unknown }).pendingCombats;

  return updateBuildingEfficiencies(
    synchronizeStaffAssignments(updateCurrentWeekSummary(normalizedSave)),
  );
}

export function parseGameSave(value: string): GameSave | null {
  try {
    const parsed = JSON.parse(value) as unknown;

    return isSupportedGameSave(parsed) ? normalizeGameSave(parsed) : null;
  } catch {
    return null;
  }
}
