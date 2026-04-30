import { describe, expect, it } from 'vitest';
import { TIME_CONFIG } from '../../game-data/time';
import type { BuildingId, GameSave, Gladiator } from '../types';
import { getGameMinuteStamp } from '../gladiators/map-movement';
import { createInitialSave } from '../saves/create-initial-save';
import {
  applyPlanningRecommendations,
  getGladiatorPlanningStatuses,
  getPlanningRecommendation,
  setManualBuildingOverride,
  synchronizePlanning,
  updateGladiatorRoutine,
} from './planning-actions';

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

function withGladiators(save: GameSave, gladiators: Gladiator[]): GameSave {
  return {
    ...save,
    gladiators,
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

describe('planning actions', () => {
  it('synchronizes default routines for owned gladiators', () => {
    const save = synchronizePlanning(withGladiators(createTestSave(), [createGladiator()]));

    expect(save.planning.routines).toEqual([
      {
        gladiatorId: 'gladiator-test',
        objective: 'balanced',
        intensity: 'normal',
        allowAutomaticAssignment: true,
      },
    ]);
  });

  it('generates alerts and planning statuses for owned gladiators', () => {
    const save = synchronizePlanning(
      withGladiators(createTestSave(), [
        createGladiator({
          health: 30,
          energy: 45,
        }),
      ]),
    );
    const statuses = getGladiatorPlanningStatuses(save);

    expect(statuses).toHaveLength(1);
    expect(statuses[0]).toMatchObject({
      gladiator: expect.objectContaining({ id: 'gladiator-test' }),
      routine: expect.objectContaining({ objective: 'balanced' }),
    });
    expect(save.planning.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: 'critical',
          titleKey: 'alerts.criticalHealth.title',
          buildingId: 'infirmary',
        }),
        expect.objectContaining({
          severity: 'warning',
          titleKey: 'alerts.lowEnergy.title',
          buildingId: 'dormitory',
        }),
      ]),
    );
  });

  it('applies automatic recommendations when the target building is purchased', () => {
    const save = synchronizePlanning(
      withPurchasedBuildings(
        withGladiators(createTestSave(), [
          createGladiator({
            currentBuildingId: 'domus',
            health: 40,
          }),
        ]),
        ['infirmary'],
      ),
    );
    const result = applyPlanningRecommendations(save);

    expect(getPlanningRecommendation(save, save.gladiators[0])).toMatchObject({
      buildingId: 'infirmary',
      isAvailable: true,
    });
    expect(result.gladiators[0].currentBuildingId).toBeUndefined();
    expect(result.gladiators[0].mapMovement).toMatchObject({
      currentLocation: 'domus',
      targetLocation: 'infirmary',
      activity: 'balanced',
    });
    expect(result.gladiators[0].currentTaskStartedAt).toBe(getGameMinuteStamp(save.time));
  });

  it('schedules simultaneous automatic departures without sharing the exit tile', () => {
    const save = synchronizePlanning(
      withPurchasedBuildings(
        withGladiators(createTestSave(), [
          createGladiator({
            id: 'gladiator-first',
            currentBuildingId: 'domus',
            health: 40,
          }),
          createGladiator({
            id: 'gladiator-second',
            currentBuildingId: 'domus',
            health: 40,
          }),
        ]),
        ['infirmary'],
      ),
    );
    const result = applyPlanningRecommendations(save);
    const firstSchedule = result.gladiators[0].mapMovement?.tileSchedule;
    const secondSchedule = result.gladiators[1].mapMovement?.tileSchedule;

    expect(firstSchedule?.[0].arrivalStamp).toBe(getGameMinuteStamp(save.time));
    expect(secondSchedule?.[0].arrivalStamp).toBe(firstSchedule?.[1].arrivalStamp);
  });

  it('sends gladiators to sleep during the night', () => {
    const save = synchronizePlanning({
      ...withGladiators(createTestSave(), [
        createGladiator({
          currentBuildingId: 'trainingGround',
          currentActivityId: 'balanced',
        }),
      ]),
      time: {
        ...createTestSave().time,
        hour: TIME_CONFIG.sleepStartHour,
      },
    });
    const result = applyPlanningRecommendations(save);

    expect(result.gladiators[0]).toMatchObject({
      currentActivityId: 'sleep',
    });
    expect(result.gladiators[0].currentBuildingId).toBeUndefined();
    expect(result.gladiators[0].mapMovement).toMatchObject({
      targetLocation: 'dormitory',
    });
  });

  it('keeps sleeping gladiators in the dormitory before wake up', () => {
    const save = synchronizePlanning({
      ...withGladiators(createTestSave(), [
        createGladiator({
          currentBuildingId: 'dormitory',
          currentActivityId: 'sleep',
          energy: 100,
        }),
      ]),
      time: {
        ...createTestSave().time,
        hour: 5,
      },
    });
    const result = applyPlanningRecommendations(save);

    expect(result.gladiators[0]).toMatchObject({
      currentBuildingId: 'dormitory',
      currentActivityId: 'sleep',
    });
  });

  it('lets rested gladiators resume daytime activities after wake up', () => {
    const save = synchronizePlanning({
      ...withGladiators(createTestSave(), [
        createGladiator({
          currentBuildingId: 'dormitory',
          currentActivityId: 'sleep',
          energy: 100,
        }),
      ]),
      time: {
        ...createTestSave().time,
        hour: TIME_CONFIG.wakeUpHour,
        minute: TIME_CONFIG.wakeUpMinute,
      },
    });
    const result = applyPlanningRecommendations(save);

    expect(result.gladiators[0]).toMatchObject({
      currentActivityId: 'balanced',
    });
    expect(result.gladiators[0].currentBuildingId).toBeUndefined();
    expect(result.gladiators[0].mapMovement).toMatchObject({
      targetLocation: 'trainingGround',
    });
  });

  it('sends critically tired gladiators to the dormitory during daytime', () => {
    const save = synchronizePlanning(
      withGladiators(createTestSave(), [
        createGladiator({
          currentBuildingId: 'domus',
          energy: 10,
        }),
      ]),
    );
    const result = applyPlanningRecommendations(save);

    expect(result.gladiators[0].currentBuildingId).toBeUndefined();
    expect(result.gladiators[0].mapMovement).toMatchObject({
      targetLocation: 'dormitory',
    });
  });

  it('keeps automatic gladiators on their current activity above critical needs', () => {
    const save = synchronizePlanning(
      withPurchasedBuildings(
        withGladiators(createTestSave(), [
          createGladiator({
            currentBuildingId: 'trainingGround',
            energy: 11,
            morale: 11,
            satiety: 11,
          }),
        ]),
        ['canteen', 'dormitory', 'pleasureHall', 'trainingGround'],
      ),
    );
    const result = applyPlanningRecommendations(save);

    expect(getPlanningRecommendation(save, save.gladiators[0])).toMatchObject({
      buildingId: 'trainingGround',
      isAvailable: true,
    });
    expect(result.gladiators[0].currentBuildingId).toBe('trainingGround');
  });

  it('sends critically hungry gladiators to the canteen', () => {
    const save = synchronizePlanning(
      withPurchasedBuildings(
        withGladiators(createTestSave(), [
          createGladiator({
            currentBuildingId: 'trainingGround',
            satiety: 10,
          }),
        ]),
        ['canteen', 'trainingGround'],
      ),
    );
    const result = applyPlanningRecommendations(save);

    expect(result.gladiators[0].currentBuildingId).toBeUndefined();
    expect(result.gladiators[0].mapMovement).toMatchObject({
      targetLocation: 'canteen',
    });
  });

  it('keeps automatic tasks locked for a minimum duration', () => {
    const baseSave = createTestSave();
    const taskStartedAt = getGameMinuteStamp(baseSave.time);
    const save = synchronizePlanning({
      ...withPurchasedBuildings(
        withGladiators(baseSave, [
          createGladiator({
            currentBuildingId: 'canteen',
            currentActivityId: 'balanced',
            currentTaskStartedAt: taskStartedAt,
            health: 35,
          }),
        ]),
        ['infirmary'],
      ),
      time: {
        ...baseSave.time,
        hour: baseSave.time.hour + 1,
      },
    });
    const result = applyPlanningRecommendations(save);

    expect(result.gladiators[0].currentBuildingId).toBe('canteen');
  });

  it('lets night sleep interrupt a locked task', () => {
    const baseSave = createTestSave();
    const save = synchronizePlanning({
      ...withGladiators(baseSave, [
        createGladiator({
          currentBuildingId: 'trainingGround',
          currentActivityId: 'balanced',
          currentTaskStartedAt: getGameMinuteStamp({
            ...baseSave.time,
            hour: TIME_CONFIG.sleepStartHour,
          }),
        }),
      ]),
      time: {
        ...baseSave.time,
        hour: TIME_CONFIG.sleepStartHour,
      },
    });
    const result = applyPlanningRecommendations(save);

    expect(result.gladiators[0]).toMatchObject({
      currentActivityId: 'sleep',
    });
    expect(result.gladiators[0].currentBuildingId).toBeUndefined();
    expect(result.gladiators[0].mapMovement).toMatchObject({
      targetLocation: 'dormitory',
    });
  });

  it('allows objective and intensity updates', () => {
    const save = synchronizePlanning(withGladiators(createTestSave(), [createGladiator()]));
    const result = updateGladiatorRoutine(save, 'gladiator-test', {
      objective: 'trainStrength',
      intensity: 'hard',
    });

    expect(result.planning.routines[0]).toMatchObject({
      objective: 'trainStrength',
      intensity: 'hard',
    });
  });

  it('keeps manual overrides when recommendations are applied', () => {
    const save = synchronizePlanning(
      withPurchasedBuildings(
        withGladiators(createTestSave(), [
          createGladiator({
            currentBuildingId: 'domus',
            health: 40,
          }),
        ]),
        ['dormitory', 'infirmary'],
      ),
    );
    const manualSave = setManualBuildingOverride(save, 'gladiator-test', 'dormitory');
    const result = applyPlanningRecommendations(manualSave);

    expect(result.planning.routines[0]).toMatchObject({
      allowAutomaticAssignment: false,
      lockedBuildingId: 'dormitory',
    });
    expect(result.gladiators[0].currentBuildingId).toBeUndefined();
    expect(result.gladiators[0].mapMovement).toMatchObject({
      targetLocation: 'dormitory',
      activity: 'manualOverride',
    });
  });
});
