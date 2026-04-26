import { describe, expect, it } from 'vitest';
import type { BuildingId, GameSave, Gladiator } from '../types';
import { createInitialSave } from '../saves/create-initial-save';
import { updateGladiatorRoutine } from '../planning/planning-actions';
import { setGameSpeed, tickGame } from './time-actions';

function createTestSave() {
  return createInitialSave({
    ownerName: 'Marcus',
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

  it('advances one game day after two real minutes at x1 speed', () => {
    const save = createTestSave();
    const result = tickGame({
      currentSave: save,
      elapsedRealMilliseconds: 120_000,
      speed: save.time.speed,
    });

    expect(result.advancedGameMinutes).toBe(1_440);
    expect(result.save.time).toMatchObject({
      dayOfWeek: 'tuesday',
      hour: 8,
      minute: 0,
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

    expect(result.advancedGameMinutes).toBe(960);
    expect(result.save.time).toMatchObject({
      dayOfWeek: 'tuesday',
      hour: 0,
      minute: 0,
    });
  });

  it('triggers Sunday arena combats when the day starts', () => {
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
    expect(result.save.arena.isArenaDayActive).toBe(true);
    expect(result.save.arena.resolvedCombats).toHaveLength(1);
    expect(result.save.gladiators[0].wins + result.save.gladiators[0].losses).toBe(1);
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
    const sundayStart = tickGame({
      currentSave: save,
      elapsedRealMilliseconds: 5_000,
      speed: save.time.speed,
      random: () => 0,
    }).save;
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
      satiety: 56,
    });
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

    expect(result.save.gladiators[0].satiety).toBe(56);
  });

  it('applies automatic routine assignments before hourly building effects', () => {
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
      currentBuildingId: 'trainingGround',
      agility: 8,
      energy: 74,
    });
  });
});
