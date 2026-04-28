import { BUILDING_IDS } from '../../game-data/buildings';
import { createGladiatorClassId } from '../../game-data/gladiator-classes';
import {
  createInitialLudusMapState,
  LUDUS_MAP_STATE_SCHEMA_VERSION,
} from '../../game-data/map-layout';
import { DAYS_OF_WEEK, SUPPORTED_GAME_SPEEDS } from '../../game-data/time';
import type { BuildingId } from '../buildings/types';
import type { Gladiator, GladiatorLocationId } from '../gladiators/types';
import type { LudusMapPlacement, LudusMapState, LudusMapTileOverride } from '../map/types';
import type { GameSave } from './types';
import { CURRENT_SCHEMA_VERSION } from './create-initial-save';

const requiredBuildingIds: BuildingId[] = [...BUILDING_IDS];
const dayOfWeeks = [...DAYS_OF_WEEK];
const gameSpeeds = [...SUPPORTED_GAME_SPEEDS];
const legacySupportedSchemaVersions = [1, 2, 3, CURRENT_SCHEMA_VERSION];
const locationIds = [...requiredBuildingIds, 'arena'];
const mapPlacementKinds = ['building', 'prop', 'road', 'wall'];

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

function hasNumberFrom(value: Record<string, unknown>, key: string, allowedValues: number[]) {
  return typeof value[key] === 'number' && allowedValues.includes(value[key]);
}

function isLocationId(value: unknown): value is GladiatorLocationId {
  return typeof value === 'string' && locationIds.includes(value);
}

function isGridCoord(value: unknown) {
  return isRecord(value) && hasNumber(value, 'column') && hasNumber(value, 'row');
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
    hasArray(value, 'availableGladiators')
  );
}

function isArenaState(value: unknown) {
  return (
    isRecord(value) &&
    hasOptionalString(value, 'currentCombatId') &&
    (value.arenaDay === undefined || isRecord(value.arenaDay)) &&
    hasArray(value, 'pendingCombats') &&
    hasArray(value, 'resolvedCombats') &&
    hasBoolean(value, 'isArenaDayActive')
  );
}

function isPlanningState(value: unknown) {
  return (
    isRecord(value) &&
    hasNumber(value, 'week') &&
    hasNumber(value, 'year') &&
    hasArray(value, 'routines') &&
    hasArray(value, 'alerts')
  );
}

function isContractState(value: unknown) {
  return (
    isRecord(value) && hasArray(value, 'availableContracts') && hasArray(value, 'acceptedContracts')
  );
}

function isEventState(value: unknown) {
  return isRecord(value) && hasArray(value, 'pendingEvents') && hasArray(value, 'resolvedEvents');
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
