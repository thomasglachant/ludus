import { describe, expect, it } from 'vitest';
import { TIME_CONFIG } from '../../game-data/time';
import type { BuildingId, GameSave, Gladiator } from '../types';
import { createInitialSave } from '../saves/create-initial-save';
import { updateGladiatorRoutine } from '../planning/planning-actions';
import { advanceToNextDay, completeSundayArenaDay, setGameSpeed, tickGame } from './time-actions';

const REAL_MILLISECONDS_PER_GAME_MINUTE =
  TIME_CONFIG.realMillisecondsPerGameHour / TIME_CONFIG.minutesPerHour;

function createTestSave() {
  return createInitialSave({
    ludusName: 'Ludus Magnus',
    saveId: 'save-test',
    createdAt: '2026-04-25T12:00:00.000Z',
  });
}

function createGladiator(overrides: Partial<Gladiator> = {}): Gladiator {
  return {
    id: 'gladiator-test',
    name: 'Aulus',
    age: 18,
    strength: 7,
    agility: 6,
    defense: 7,
    energy: 80,
    health: 85,
    morale: 75,
    satiety: 80,
    reputation: 0,
    wins: 0,
    losses: 0,
    traits: [],
    ...overrides,
  };
}

function withPurchasedBuildings(save: GameSave, buildingIds: BuildingId[]): GameSave {
  return {
    ...save,
    buildings: {
      ...save.buildings,
      ...Object.fromEntries(
        buildingIds.map((buildingId) => [
          buildingId,
          {
            ...save.buildings[buildingId],
            isPurchased: true,
            level: Math.max(1, save.buildings[buildingId].level),
          },
        ]),
      ),
    },
  };
}

function advanceUntilArenaDay(save: GameSave) {
  let currentSave = save;

  for (let tickIndex = 0; tickIndex < 8 && !currentSave.arena.arenaDay; tickIndex += 1) {
    currentSave = tickGame({
      currentSave,
      elapsedRealMilliseconds: 5_000,
      speed: currentSave.time.speed,
      random: () => 0,
    }).save;
  }

  return currentSave;
}

describe('time actions', () => {
  it('advances one game hour after five real seconds at x1 speed', () => {
    const save = createTestSave();
    const result = tickGame({
      currentSave: save,
      elapsedRealMilliseconds: 5_000,
      speed: save.time.speed,
    });

    expect(result.advancedGameMinutes).toBe(60);
    expect(result.save.time).toMatchObject({
      dayOfWeek: 'monday',
      hour: 9,
      minute: 0,
    });
  });

  it('stops long ticks at the night sleep boundary', () => {
    const save = createTestSave();
    const result = tickGame({
      currentSave: save,
      elapsedRealMilliseconds: 120_000,
      speed: save.time.speed,
    });

    expect(result.advancedGameMinutes).toBe(840);
    expect(result.save.time).toMatchObject({
      dayOfWeek: 'monday',
      hour: 22,
      minute: 0,
    });
  });

  it('advances directly to the next day and restores the selected speed', () => {
    const save = setGameSpeed(createTestSave(), 4);
    const result = advanceToNextDay(save);

    expect(result.advancedGameMinutes).toBe(1_320);
    expect(result.save.time).toMatchObject({
      dayOfWeek: 'tuesday',
      hour: 6,
      minute: 0,
      speed: 4,
      isPaused: false,
    });
  });

  it('does not advance while paused', () => {
    const save = setGameSpeed(createTestSave(), 0);
    const result = tickGame({
      currentSave: save,
      elapsedRealMilliseconds: 5_000,
      speed: save.time.speed,
    });

    expect(result.advancedGameMinutes).toBe(0);
    expect(result.save.time).toMatchObject({
      dayOfWeek: 'monday',
      hour: 8,
      minute: 0,
      speed: 0,
      isPaused: true,
    });
  });

  it('rolls Sunday into the next week and wraps the year after week eight', () => {
    const save: GameSave = {
      ...createTestSave(),
      time: {
        year: 1,
        week: 8,
        dayOfWeek: 'sunday',
        hour: 23,
        minute: 30,
        speed: 1,
        isPaused: false,
      },
    };
    const result = tickGame({
      currentSave: save,
      elapsedRealMilliseconds: 5_000,
      speed: save.time.speed,
    });

    expect(result.save.time).toMatchObject({
      year: 2,
      week: 1,
      dayOfWeek: 'monday',
      hour: 0,
      minute: 30,
    });
    expect(result.save.arena.isArenaDayActive).toBe(false);
  });

  it('uses the selected speed multiplier', () => {
    const save = setGameSpeed(createTestSave(), 16);
    const result = tickGame({
      currentSave: save,
      elapsedRealMilliseconds: 5_000,
      speed: save.time.speed,
    });

    expect(result.advancedGameMinutes).toBe(840);
    expect(result.save.time).toMatchObject({
      dayOfWeek: 'monday',
      hour: 22,
      minute: 0,
    });
  });

  it('does not trigger Sunday arena combats before 8:00', () => {
    const save: GameSave = {
      ...createTestSave(),
      time: {
        year: 1,
        week: 1,
        dayOfWeek: 'saturday',
        hour: 23,
        minute: 30,
        speed: 1,
        isPaused: false,
      },
      gladiators: [createGladiator()],
    };
    const result = tickGame({
      currentSave: save,
      elapsedRealMilliseconds: 5_000,
      speed: save.time.speed,
      random: () => 0,
    });

    expect(result.save.time).toMatchObject({
      dayOfWeek: 'sunday',
      hour: 0,
      minute: 30,
    });
    expect(result.save.arena.isArenaDayActive).toBe(false);
    expect(result.save.arena.resolvedCombats).toHaveLength(0);
  });

  it('treats Sunday like a regular day without gladiators', () => {
    const save: GameSave = {
      ...createTestSave(),
      time: {
        year: 1,
        week: 1,
        dayOfWeek: 'sunday',
        hour: 7,
        minute: 59,
        speed: 1,
        isPaused: false,
      },
    };
    const result = tickGame({
      currentSave: save,
      elapsedRealMilliseconds: 5_000,
      speed: save.time.speed,
      random: () => 0,
    });

    expect(result.save.time).toMatchObject({
      dayOfWeek: 'sunday',
      hour: 8,
      minute: 59,
    });
    expect(result.save.arena.isArenaDayActive).toBe(false);
    expect(result.save.arena.arenaDay).toBeUndefined();
    expect(result.save.arena.resolvedCombats).toHaveLength(0);
  });

  it('sends gladiators to the arena at 8:00 and starts combats after arrival', () => {
    const save: GameSave = {
      ...createTestSave(),
      time: {
        year: 1,
        week: 1,
        dayOfWeek: 'sunday',
        hour: 7,
        minute: 59,
        speed: 1,
        isPaused: false,
      },
      gladiators: [createGladiator()],
    };
    const result = tickGame({
      currentSave: save,
      elapsedRealMilliseconds: REAL_MILLISECONDS_PER_GAME_MINUTE,
      speed: save.time.speed,
      random: () => 0,
    });
    const arenaStart = advanceUntilArenaDay(result.save);
    const blockedTick = tickGame({
      currentSave: arenaStart,
      elapsedRealMilliseconds: 5_000,
      speed: arenaStart.time.speed,
      random: () => 0,
    });

    expect(result.save.time).toMatchObject({
      dayOfWeek: 'sunday',
      hour: 8,
      minute: 0,
    });
    expect(result.save.arena.isArenaDayActive).toBe(false);
    expect(result.save.arena.arenaDay).toBeUndefined();
    expect(result.save.gladiators[0].mapMovement).toMatchObject({ targetLocation: 'arena' });
    expect(arenaStart.gladiators[0].currentLocationId).toBe('arena');
    expect(arenaStart.arena.isArenaDayActive).toBe(true);
    expect(arenaStart.arena.arenaDay).toMatchObject({ phase: 'intro' });
    expect(arenaStart.arena.resolvedCombats).toHaveLength(1);
    expect(blockedTick.advancedGameMinutes).toBe(0);
    expect(blockedTick.save.time).toEqual(arenaStart.time);
  });

  it('does not double-apply Sunday arena consequences on later Sunday ticks', () => {
    const save: GameSave = {
      ...createTestSave(),
      time: {
        year: 1,
        week: 1,
        dayOfWeek: 'saturday',
        hour: 23,
        minute: 30,
        speed: 1,
        isPaused: false,
      },
      gladiators: [createGladiator()],
    };
    const sundayMorning = tickGame({
      currentSave: save,
      elapsedRealMilliseconds: 43_000,
      speed: save.time.speed,
      random: () => 0,
    }).save;
    const sundayBeforeArena = tickGame({
      currentSave: sundayMorning,
      elapsedRealMilliseconds: 5_000,
      speed: sundayMorning.time.speed,
      random: () => 0,
    }).save;
    const arenaTravel = tickGame({
      currentSave: sundayBeforeArena,
      elapsedRealMilliseconds: 5_000,
      speed: sundayBeforeArena.time.speed,
      random: () => 0,
    }).save;
    const sundayStart = advanceUntilArenaDay(arenaTravel);
    const laterSunday = tickGame({
      currentSave: sundayStart,
      elapsedRealMilliseconds: 5_000,
      speed: sundayStart.time.speed,
      random: () => 0,
    }).save;

    expect(laterSunday.arena.resolvedCombats).toHaveLength(1);
    expect(laterSunday.ludus.treasury).toBe(sundayStart.ludus.treasury);
    expect(laterSunday.gladiators[0].wins + laterSunday.gladiators[0].losses).toBe(1);
  });

  it('completes Sunday arena day into Sunday evening without retriggering arena', () => {
    const save: GameSave = {
      ...createTestSave(),
      time: {
        year: 1,
        week: 8,
        dayOfWeek: 'sunday',
        hour: 7,
        minute: 59,
        speed: 1,
        isPaused: false,
      },
      gladiators: [createGladiator()],
    };
    const arenaTravel = tickGame({
      currentSave: save,
      elapsedRealMilliseconds: 5_000,
      speed: save.time.speed,
      random: () => 0,
    }).save;
    const arenaDay = advanceUntilArenaDay(arenaTravel);
    const completed = completeSundayArenaDay(arenaDay);

    expect(completed.time).toMatchObject({
      year: 1,
      week: 8,
      dayOfWeek: 'sunday',
      hour: 20,
      minute: 0,
    });
    expect(completed.arena.arenaDay).toBeUndefined();
    expect(completed.arena.isArenaDayActive).toBe(true);

    const laterSunday = tickGame({
      currentSave: completed,
      elapsedRealMilliseconds: 5_000,
      speed: completed.time.speed,
      random: () => 0,
    }).save;

    expect(laterSunday.arena.arenaDay).toBeUndefined();
    expect(laterSunday.arena.resolvedCombats).toHaveLength(1);
  });

  it('applies purchased building effects to assigned gladiators once per game hour', () => {
    const save: GameSave = {
      ...withPurchasedBuildings(createTestSave(), ['canteen']),
      gladiators: [
        createGladiator({
          currentBuildingId: 'canteen',
          satiety: 50,
        }),
      ],
    };
    const result = tickGame({
      currentSave: save,
      elapsedRealMilliseconds: 5_000,
      speed: save.time.speed,
    });

    expect(result.appliedEffectHours).toBe(1);
    expect(result.save.gladiators[0]).toMatchObject({
      currentBuildingId: 'canteen',
      morale: 76,
      satiety: 100,
    });
  });

  it('fully restores satiety after one game hour at the canteen', () => {
    const save: GameSave = {
      ...withPurchasedBuildings(createTestSave(), ['canteen']),
      gladiators: [
        createGladiator({
          currentBuildingId: 'canteen',
          satiety: 0,
        }),
      ],
    };

    const result = tickGame({
      currentSave: save,
      elapsedRealMilliseconds: 5_000,
      speed: save.time.speed,
    });

    expect(result.save.gladiators[0].satiety).toBe(100);
  });

  it('ignores permanent building effects during hourly ticks', () => {
    const save: GameSave = {
      ...withPurchasedBuildings(createTestSave(), ['canteen']),
      buildings: {
        ...createTestSave().buildings,
        canteen: {
          ...createTestSave().buildings.canteen,
          purchasedImprovementIds: ['betterKitchen'],
          selectedPolicyId: 'richMeals',
        },
      },
      gladiators: [
        createGladiator({
          currentBuildingId: 'canteen',
          satiety: 50,
        }),
      ],
    };
    const result = tickGame({
      currentSave: save,
      elapsedRealMilliseconds: 5_000,
      speed: save.time.speed,
    });

    expect(result.save.gladiators[0].satiety).toBe(100);
  });

  it('drains satiety and morale faster while training', () => {
    const save: GameSave = {
      ...withPurchasedBuildings(createTestSave(), ['trainingGround']),
      gladiators: [
        createGladiator({
          currentBuildingId: 'trainingGround',
          morale: 70,
          satiety: 80,
        }),
      ],
    };
    const result = tickGame({
      currentSave: save,
      elapsedRealMilliseconds: 5_000,
      speed: save.time.speed,
    });

    expect(result.save.gladiators[0]).toMatchObject({
      currentBuildingId: 'trainingGround',
      morale: 66,
      satiety: 74,
    });
  });

  it('adds training progress as skill decimals instead of full levels', () => {
    const save: GameSave = {
      ...withPurchasedBuildings(createTestSave(), ['trainingGround']),
      gladiators: [
        createGladiator({
          currentBuildingId: 'trainingGround',
          strength: 7.99,
        }),
      ],
    };
    const result = tickGame({
      currentSave: save,
      elapsedRealMilliseconds: 5_000,
      speed: save.time.speed,
    });

    expect(result.save.gladiators[0].strength).toBeCloseTo(8);
  });

  it('starts automatic movement before new building effects apply', () => {
    const saveWithGladiator: GameSave = {
      ...withPurchasedBuildings(createTestSave(), ['trainingGround']),
      gladiators: [createGladiator()],
    };
    const save = updateGladiatorRoutine(saveWithGladiator, 'gladiator-test', {
      objective: 'trainAgility',
      intensity: 'hard',
    });
    const result = tickGame({
      currentSave: save,
      elapsedRealMilliseconds: 5_000,
      speed: save.time.speed,
    });

    expect(result.save.gladiators[0]).toMatchObject({
      agility: 6,
      energy: 80,
      satiety: 79,
    });
    expect(result.save.gladiators[0].currentBuildingId).toBeUndefined();
    expect(result.save.gladiators[0].mapMovement).toMatchObject({
      currentLocation: 'domus',
      targetLocation: 'trainingGround',
    });
  });

  it('restores full energy when gladiators wake after sleeping overnight', () => {
    const saveWithGladiator: GameSave = {
      ...withPurchasedBuildings(createTestSave(), ['dormitory', 'trainingGround']),
      time: {
        ...createTestSave().time,
        hour: 22,
        minute: 0,
      },
      gladiators: [
        createGladiator({
          currentBuildingId: 'trainingGround',
          currentActivityId: 'balanced',
          energy: 12,
        }),
      ],
    };
    const result = tickGame({
      currentSave: saveWithGladiator,
      elapsedRealMilliseconds: 40_000,
      speed: saveWithGladiator.time.speed,
    });

    expect(result.save.time).toMatchObject({
      dayOfWeek: 'tuesday',
      hour: 6,
      minute: 0,
    });
    expect(result.save.gladiators[0]).toMatchObject({
      currentActivityId: 'balanced',
      energy: 100,
    });
    expect(result.save.gladiators[0].currentBuildingId).toBeUndefined();
    expect(result.save.gladiators[0].mapMovement).toMatchObject({
      targetLocation: 'trainingGround',
    });
  });
});
