import { describe, expect, it } from 'vitest';
import type { Gladiator } from './types';
import { getMapLocationEntrance } from '../../game-data/map-layout';
import {
  assignGladiatorMapLocation,
  createGladiatorMapMovement,
  getGameMinuteStamp,
  resolveGladiatorMapMovement,
} from './map-movement';

const baseGladiator: Gladiator = {
  id: 'gladiator-test',
  name: 'Aulus',
  age: 19,
  strength: 7,
  agility: 6,
  defense: 5,
  energy: 80,
  health: 90,
  morale: 70,
  satiety: 75,
  reputation: 0,
  wins: 0,
  losses: 0,
  traits: [],
  currentBuildingId: 'dormitory',
};

const time = {
  year: 1,
  week: 1,
  dayOfWeek: 'monday' as const,
  hour: 8,
  minute: 15,
  speed: 0 as const,
  isPaused: true,
};

describe('gladiator map movement', () => {
  it('creates serializable movement intent when a gladiator changes location', () => {
    const movement = createGladiatorMapMovement(
      baseGladiator,
      'trainingGround',
      time,
      'trainAgility',
    );

    expect(movement).toMatchObject({
      currentLocation: 'dormitory',
      targetLocation: 'trainingGround',
      activity: 'trainAgility',
      movementStartedAt: getGameMinuteStamp(time),
    });
    const route = movement?.route ?? [];

    expect(route[0]).toEqual(getMapLocationEntrance('dormitory'));
    expect(route[route.length - 1]).toEqual(getMapLocationEntrance('trainingGround'));
    expect(movement?.movementDuration).toBeGreaterThan(0);
  });

  it('does not create movement when the target is already current', () => {
    expect(
      createGladiatorMapMovement(baseGladiator, 'dormitory', time, 'recovery'),
    ).toBeUndefined();
  });

  it('starts movement without assigning the target building yet', () => {
    const gladiator = assignGladiatorMapLocation(
      baseGladiator,
      'trainingGround',
      time,
      'trainAgility',
    );

    expect(gladiator.currentBuildingId).toBeUndefined();
    expect(gladiator.currentLocationId).toBeUndefined();
    expect(gladiator.currentActivityId).toBe('trainAgility');
    expect(gladiator.mapMovement).toMatchObject({
      currentLocation: 'dormitory',
      targetLocation: 'trainingGround',
    });
    expect(gladiator.currentTaskStartedAt).toBe(getGameMinuteStamp(time));
  });

  it('assigns the target building when movement is complete', () => {
    const movingGladiator = assignGladiatorMapLocation(
      baseGladiator,
      'trainingGround',
      time,
      'trainAgility',
    );
    const resolved = resolveGladiatorMapMovement(movingGladiator, {
      ...time,
      hour: 12,
    });

    expect(resolved.currentBuildingId).toBe('trainingGround');
    expect(resolved.currentLocationId).toBe('trainingGround');
    expect(resolved.mapMovement).toBeUndefined();
  });

  it('preserves the task start when the assignment does not change', () => {
    const gladiator = assignGladiatorMapLocation(
      {
        ...baseGladiator,
        currentActivityId: 'recovery',
        currentTaskStartedAt: 120,
      },
      'dormitory',
      time,
      'recovery',
    );

    expect(gladiator.currentTaskStartedAt).toBe(120);
    expect(gladiator.currentBuildingId).toBe('dormitory');
    expect(gladiator.currentLocationId).toBe('dormitory');
  });

  it('keeps an existing movement when reassigning the same target', () => {
    const movingGladiator = assignGladiatorMapLocation(
      baseGladiator,
      'trainingGround',
      time,
      'balanced',
    );
    const reassigned = assignGladiatorMapLocation(
      movingGladiator,
      'trainingGround',
      {
        ...time,
        minute: time.minute + 5,
      },
      'balanced',
    );

    expect(reassigned.currentBuildingId).toBeUndefined();
    expect(reassigned.currentLocationId).toBeUndefined();
    expect(reassigned.currentTaskStartedAt).toBe(movingGladiator.currentTaskStartedAt);
    expect(reassigned.mapMovement).toEqual(movingGladiator.mapMovement);
  });
});
