import { describe, expect, it } from 'vitest';
import type { Gladiator } from './types';
import {
  assignGladiatorMapLocation,
  createGladiatorMapMovement,
  getGameMinuteStamp,
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
    expect(movement?.movementDuration).toBeGreaterThan(0);
  });

  it('does not create movement when the target is already current', () => {
    expect(
      createGladiatorMapMovement(baseGladiator, 'dormitory', time, 'recovery'),
    ).toBeUndefined();
  });

  it('assigns the target building and preserves movement as renderer-only state', () => {
    const gladiator = assignGladiatorMapLocation(
      baseGladiator,
      'trainingGround',
      time,
      'trainAgility',
    );

    expect(gladiator.currentBuildingId).toBe('trainingGround');
    expect(gladiator.currentActivityId).toBe('trainAgility');
    expect(gladiator.mapMovement).toMatchObject({
      currentLocation: 'dormitory',
      targetLocation: 'trainingGround',
    });
  });
});
