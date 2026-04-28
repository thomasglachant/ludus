import { BUILDING_IDS } from '../../game-data/buildings';
import { createGladiatorClassId, isGladiatorClassId } from '../../game-data/gladiator-classes';
import {
  createInitialLudusMapState,
  LUDUS_MAP_STATE_SCHEMA_VERSION,
} from '../../game-data/map-layout';
import { DAYS_OF_WEEK, SUPPORTED_GAME_SPEEDS } from '../../game-data/time';
import type { BuildingId } from '../buildings/types';
import type { CombatState } from '../combat/types';
import type { WeeklyContract } from '../contracts/types';
import type { GameEvent } from '../events/types';
import type { Gladiator, GladiatorLocationId } from '../gladiators/types';
import type { MarketGladiator } from '../market/types';
import type { GameAlert, GladiatorRoutine } from '../planning/types';
import type { LudusMapPlacement, LudusMapState, LudusMapTileOverride } from '../map/types';
import type { GameSave } from './types';
import { CURRENT_SCHEMA_VERSION } from './create-initial-save';

const requiredBuildingIds: BuildingId[] = [...BUILDING_IDS];
const dayOfWeeks = [...DAYS_OF_WEEK];
const gameSpeeds = [...SUPPORTED_GAME_SPEEDS];
const legacySupportedSchemaVersions = [1, 2, 3, CURRENT_SCHEMA_VERSION];
const locationIds = [...requiredBuildingIds, 'arena'];
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
const combatStrategies = [
  'balanced',
  'aggressive',
  'defensive',
  'evasive',
  'exhaustOpponent',
  'protectInjury',
];
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
const weeklyObjectives = [
  'balanced',
  'fightPreparation',
  'trainStrength',
  'trainAgility',
  'trainDefense',
  'recovery',
  'moraleBoost',
  'protectChampion',
  'prepareForSale',
];
const trainingIntensities = ['light', 'normal', 'hard', 'brutal'];
const alertSeverities = ['info', 'warning', 'critical'];
const contractStatuses = ['available', 'accepted', 'completed', 'failed', 'expired'];
const contractObjectiveTypes = [
  'winFightCount',
  'winWithRank',
  'winWithLowHealth',
  'earnTreasuryFromArena',
  'sellGladiatorForAtLeast',
];
const eventStatuses = ['pending', 'resolved', 'expired'];
const eventEffectTypes = [
  'changeTreasury',
  'changeLudusReputation',
  'changeGladiatorHealth',
  'changeGladiatorEnergy',
  'changeGladiatorMorale',
  'changeGladiatorSatiety',
  'changeGladiatorStat',
];
const eventStatFields = ['strength', 'agility', 'defense'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function hasString(value: Record<string, unknown>, key: string) {
  return typeof value[key] === 'string';
}

function hasNumber(value: Record<string, unknown>, key: string) {
  return typeof value[key] === 'number' && Number.isFinite(value[key]);
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

function hasStringFrom(value: Record<string, unknown>, key: string, allowedValues: string[]) {
  return typeof value[key] === 'string' && allowedValues.includes(value[key]);
}

function isStringFrom(value: unknown, allowedValues: string[]) {
  return typeof value === 'string' && allowedValues.includes(value);
}

function hasNumberFrom(value: Record<string, unknown>, key: string, allowedValues: number[]) {
  return typeof value[key] === 'number' && allowedValues.includes(value[key]);
}

function isLocationId(value: unknown): value is GladiatorLocationId {
  return typeof value === 'string' && locationIds.includes(value);
}

function isGridCoord(value: unknown) {
  return isRecord(value) && hasNumber(value, 'column') && hasNumber(value, 'row');
}

function isOptionalLocationId(value: unknown) {
  return value === undefined || isLocationId(value);
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
    hasOptionalString(value, 'selectedPolicyId') &&
    (value.configuration === undefined || isRecord(value.configuration))
  );
}

function isGladiatorMapMovement(value: unknown) {
  return (
    isRecord(value) &&
    isLocationId(value.currentLocation) &&
    isLocationId(value.targetLocation) &&
    hasString(value, 'activity') &&
    hasNumber(value, 'movementStartedAt') &&
    hasNumber(value, 'movementDuration') &&
    (value.minutesPerTile === undefined || typeof value.minutesPerTile === 'number') &&
    (value.route === undefined || (Array.isArray(value.route) && value.route.every(isGridCoord)))
  );
}

function isGladiatorTrainingPlan(value: unknown, gladiatorId: string) {
  return (
    isRecord(value) &&
    value.gladiatorId === gladiatorId &&
    hasNumber(value, 'strength') &&
    hasNumber(value, 'agility') &&
    hasNumber(value, 'defense')
  );
}

function isGladiator(value: unknown): value is Gladiator {
  if (!isRecord(value)) {
    return false;
  }

  return (
    hasString(value, 'id') &&
    hasString(value, 'name') &&
    (value.classId === undefined ||
      (typeof value.classId === 'string' && isGladiatorClassId(value.classId))) &&
    hasNumber(value, 'age') &&
    hasNumber(value, 'strength') &&
    hasNumber(value, 'agility') &&
    hasNumber(value, 'defense') &&
    hasNumber(value, 'energy') &&
    hasNumber(value, 'health') &&
    hasNumber(value, 'morale') &&
    hasNumber(value, 'satiety') &&
    hasNumber(value, 'reputation') &&
    hasNumber(value, 'wins') &&
    hasNumber(value, 'losses') &&
    Array.isArray(value.traits) &&
    value.traits.every((trait) => isStringFrom(trait, gladiatorTraits)) &&
    isOptionalLocationId(value.currentLocationId) &&
    (value.currentBuildingId === undefined ||
      isStringFrom(value.currentBuildingId, requiredBuildingIds)) &&
    (value.currentActivityId === undefined || typeof value.currentActivityId === 'string') &&
    (value.currentTaskStartedAt === undefined || typeof value.currentTaskStartedAt === 'number') &&
    (value.mapMovement === undefined || isGladiatorMapMovement(value.mapMovement)) &&
    (value.trainingPlan === undefined ||
      isGladiatorTrainingPlan(value.trainingPlan, value.id as string)) &&
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
    hasNumber(value, 'hour') &&
    hasNumber(value, 'minute') &&
    hasNumberFrom(value, 'speed', gameSpeeds) &&
    hasBoolean(value, 'isPaused')
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
    hasNumber(value, 'loserReward')
  );
}

function isCombatConsequence(value: unknown) {
  return (
    isRecord(value) &&
    hasBoolean(value, 'didPlayerWin') &&
    hasNumber(value, 'playerReward') &&
    hasNumber(value, 'healthChange') &&
    hasNumber(value, 'energyChange') &&
    hasNumber(value, 'moraleChange') &&
    hasNumber(value, 'reputationChange') &&
    hasNumber(value, 'finalHealth') &&
    hasNumber(value, 'finalEnergy') &&
    hasNumber(value, 'finalMorale') &&
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
    hasStringFrom(value, 'strategy', combatStrategies) &&
    Array.isArray(value.turns) &&
    value.turns.every(isCombatTurn) &&
    hasOptionalString(value, 'winnerId') &&
    hasOptionalString(value, 'loserId') &&
    isCombatReward(value.reward) &&
    isCombatConsequence(value.consequence)
  );
}

function isScoutingReport(value: unknown) {
  return (
    isRecord(value) &&
    hasString(value, 'id') &&
    hasString(value, 'gladiatorId') &&
    hasString(value, 'opponentId') &&
    hasNumber(value, 'opponentStrength') &&
    hasNumber(value, 'opponentAgility') &&
    hasNumber(value, 'opponentDefense') &&
    hasString(value, 'summaryKey') &&
    hasNumber(value, 'createdAtYear') &&
    hasNumber(value, 'createdAtWeek') &&
    hasStringFrom(value, 'createdAtDay', dayOfWeeks)
  );
}

function isBettingOdds(value: unknown) {
  return (
    isRecord(value) &&
    hasString(value, 'id') &&
    hasString(value, 'gladiatorId') &&
    isGladiator(value.opponent) &&
    hasStringFrom(value, 'rank', arenaRanks) &&
    hasNumber(value, 'playerWinChance') &&
    hasNumber(value, 'playerDecimalOdds') &&
    hasNumber(value, 'opponentDecimalOdds') &&
    hasBoolean(value, 'isScouted') &&
    hasStringFrom(value, 'createdAtDay', dayOfWeeks)
  );
}

function isBettingState(value: unknown) {
  return (
    isRecord(value) &&
    hasNumber(value, 'year') &&
    hasNumber(value, 'week') &&
    Array.isArray(value.odds) &&
    value.odds.every(isBettingOdds) &&
    Array.isArray(value.scoutingReports) &&
    value.scoutingReports.every(isScoutingReport) &&
    hasBoolean(value, 'areBetsLocked')
  );
}

function isArenaState(value: unknown) {
  return (
    isRecord(value) &&
    hasOptionalString(value, 'currentCombatId') &&
    (value.arenaDay === undefined || isRecord(value.arenaDay)) &&
    Array.isArray(value.pendingCombats) &&
    Array.isArray(value.resolvedCombats) &&
    value.pendingCombats.every(isCombatState) &&
    value.resolvedCombats.every(isCombatState) &&
    hasBoolean(value, 'isArenaDayActive') &&
    (value.betting === undefined || isBettingState(value.betting))
  );
}

function isPlanningRoutine(value: unknown): value is GladiatorRoutine {
  return (
    isRecord(value) &&
    hasString(value, 'gladiatorId') &&
    hasStringFrom(value, 'objective', weeklyObjectives) &&
    hasStringFrom(value, 'intensity', trainingIntensities) &&
    hasBoolean(value, 'allowAutomaticAssignment') &&
    (value.lockedBuildingId === undefined ||
      isStringFrom(value.lockedBuildingId, requiredBuildingIds)) &&
    (value.combatStrategy === undefined || isStringFrom(value.combatStrategy, combatStrategies))
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

function isPlanningState(value: unknown) {
  return (
    isRecord(value) &&
    hasNumber(value, 'week') &&
    hasNumber(value, 'year') &&
    Array.isArray(value.routines) &&
    Array.isArray(value.alerts) &&
    value.routines.every(isPlanningRoutine) &&
    value.alerts.every(isGameAlert)
  );
}

function isContractObjective(value: unknown) {
  if (!isRecord(value) || !hasStringFrom(value, 'type', contractObjectiveTypes)) {
    return false;
  }

  switch (value.type) {
    case 'winFightCount':
      return hasNumber(value, 'count');
    case 'winWithRank':
      return hasStringFrom(value, 'rank', arenaRanks);
    case 'winWithLowHealth':
      return hasNumber(value, 'maxHealth');
    case 'earnTreasuryFromArena':
    case 'sellGladiatorForAtLeast':
      return hasNumber(value, 'amount');
    default:
      return false;
  }
}

function isWeeklyContract(value: unknown): value is WeeklyContract {
  return (
    isRecord(value) &&
    hasString(value, 'id') &&
    hasString(value, 'titleKey') &&
    hasString(value, 'descriptionKey') &&
    hasStringFrom(value, 'status', contractStatuses) &&
    hasNumber(value, 'rewardTreasury') &&
    (value.rewardReputation === undefined || typeof value.rewardReputation === 'number') &&
    hasNumber(value, 'issuedAtYear') &&
    hasNumber(value, 'issuedAtWeek') &&
    hasNumber(value, 'expiresAtYear') &&
    hasNumber(value, 'expiresAtWeek') &&
    isContractObjective(value.objective)
  );
}

function isContractState(value: unknown) {
  return (
    isRecord(value) &&
    Array.isArray(value.availableContracts) &&
    Array.isArray(value.acceptedContracts) &&
    value.availableContracts.every(isWeeklyContract) &&
    value.acceptedContracts.every(isWeeklyContract)
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

  if (effectType.startsWith('changeGladiator')) {
    return hasString(value, 'gladiatorId') && hasNumber(value, 'amount');
  }

  return hasNumber(value, 'amount');
}

function isGameEventChoice(value: unknown) {
  return (
    isRecord(value) &&
    hasString(value, 'id') &&
    hasString(value, 'labelKey') &&
    hasString(value, 'consequenceKey') &&
    Array.isArray(value.effects) &&
    value.effects.every(isGameEventEffect)
  );
}

function isGameEvent(value: unknown): value is GameEvent {
  return (
    isRecord(value) &&
    hasString(value, 'id') &&
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
    hasOptionalString(value, 'selectedChoiceId')
  );
}

function isEventState(value: unknown) {
  return (
    isRecord(value) &&
    Array.isArray(value.pendingEvents) &&
    Array.isArray(value.resolvedEvents) &&
    value.pendingEvents.every(isGameEvent) &&
    value.resolvedEvents.every(isGameEvent)
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
    !hasString(value.player, 'ownerName') ||
    !hasString(value.player, 'ludusName') ||
    !hasBoolean(value.player, 'isCloudUser')
  ) {
    return false;
  }

  if (
    !isRecord(value.ludus) ||
    !hasNumber(value.ludus, 'treasury') ||
    !hasNumber(value.ludus, 'reputation')
  ) {
    return false;
  }

  if (!isTimeState(value.time)) {
    return false;
  }

  if (value.schemaVersion === CURRENT_SCHEMA_VERSION && !isMapState(value.map)) {
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
    isMarketState(value.market) &&
    isArenaState(value.arena) &&
    isPlanningState(value.planning) &&
    isContractState(value.contracts) &&
    isEventState(value.events)
  );
}

export function isGameSave(value: unknown): value is GameSave {
  return isSupportedGameSave(value) && value.schemaVersion === CURRENT_SCHEMA_VERSION;
}

function normalizeMapState(mapState: unknown): LudusMapState {
  return isMapState(mapState) ? mapState : createInitialLudusMapState();
}

function normalizeGladiator(gladiator: Gladiator): Gladiator {
  const movement = gladiator.mapMovement;

  if (movement) {
    return {
      ...gladiator,
      classId: gladiator.classId ?? createGladiatorClassId(gladiator.id),
      currentLocationId: undefined,
      currentBuildingId: undefined,
      mapMovement: {
        ...movement,
        currentLocation: isLocationId(movement.currentLocation)
          ? movement.currentLocation
          : (gladiator.currentBuildingId ?? 'domus'),
        targetLocation: isLocationId(movement.targetLocation)
          ? movement.targetLocation
          : (gladiator.currentBuildingId ?? 'domus'),
      },
    };
  }

  const currentLocationId = isLocationId(gladiator.currentLocationId)
    ? gladiator.currentLocationId
    : gladiator.currentBuildingId;

  return {
    ...gladiator,
    classId: gladiator.classId ?? createGladiatorClassId(gladiator.id),
    currentLocationId,
    currentBuildingId:
      currentLocationId && requiredBuildingIds.includes(currentLocationId as BuildingId)
        ? (currentLocationId as BuildingId)
        : undefined,
  };
}

function normalizeCombatState<TCombat extends GameSave['arena']['pendingCombats'][number]>(
  combat: TCombat,
): TCombat {
  return {
    ...combat,
    gladiator: normalizeGladiator(combat.gladiator),
    opponent: normalizeGladiator(combat.opponent),
  };
}

export function normalizeGameSave(save: GameSave): GameSave {
  const saveWithOptionalMap = save as GameSave & { gameId?: unknown; map?: unknown };
  const normalizedSave: GameSave & { settings?: unknown } = {
    ...save,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    gameId:
      typeof saveWithOptionalMap.gameId === 'string' ? saveWithOptionalMap.gameId : save.saveId,
    map: normalizeMapState(saveWithOptionalMap.map),
    gladiators: save.gladiators.map(normalizeGladiator),
    market: {
      ...save.market,
      availableGladiators: save.market.availableGladiators.map((gladiator) => ({
        ...normalizeGladiator(gladiator),
        price: gladiator.price,
      })),
    },
    arena: {
      ...save.arena,
      pendingCombats: save.arena.pendingCombats.map(normalizeCombatState),
      resolvedCombats: save.arena.resolvedCombats.map(normalizeCombatState),
      betting: save.arena.betting
        ? {
            ...save.arena.betting,
            odds: save.arena.betting.odds.map((odds) => ({
              ...odds,
              opponent: normalizeGladiator(odds.opponent),
            })),
          }
        : undefined,
    },
    events: {
      pendingEvents: [],
      resolvedEvents: [],
    },
  };

  delete normalizedSave.settings;

  return normalizedSave;
}

export function parseGameSave(value: string): GameSave | null {
  try {
    const parsed = JSON.parse(value) as unknown;

    return isSupportedGameSave(parsed) ? normalizeGameSave(parsed) : null;
  } catch {
    return null;
  }
}
