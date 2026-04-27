import type { BuildingId } from '../buildings/types';
import type { GameSave } from './types';
import { CURRENT_SCHEMA_VERSION } from './create-initial-save';

const requiredBuildingIds: BuildingId[] = [
  'domus',
  'canteen',
  'dormitory',
  'trainingGround',
  'pleasureHall',
  'infirmary',
];

const dayOfWeeks = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const gameSpeeds = [0, 1, 2, 4, 8, 16];

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

export function isGameSave(value: unknown): value is GameSave {
  if (!isRecord(value)) {
    return false;
  }

  if (value.schemaVersion !== CURRENT_SCHEMA_VERSION) {
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

export function normalizeGameSave(save: GameSave): GameSave {
  const normalizedSave: GameSave & { settings?: unknown } = { ...save };

  delete normalizedSave.settings;

  return normalizedSave;
}

export function parseGameSave(value: string): GameSave | null {
  try {
    const parsed = JSON.parse(value) as unknown;

    return isGameSave(parsed) ? normalizeGameSave(parsed) : null;
  } catch {
    return null;
  }
}
