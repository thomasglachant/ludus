import { describe, expect, it } from 'vitest';
import type { BuildingId, GameSave, Gladiator } from '../types';
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
    ownerName: 'Marcus',
    ludusName: 'Ludus Magnus',
    language: 'en',
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

  it('generates alerts and planning statuses with readiness', () => {
    const save = synchronizePlanning(
      withGladiators(createTestSave(), [
        createGladiator({
          health: 30,
          energy: 45,
        }),
      ]),
    );
    const statuses = getGladiatorPlanningStatuses(save);

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
    expect(statuses[0].readiness).toBeGreaterThanOrEqual(0);
    expect(statuses[0].readiness).toBeLessThanOrEqual(100);
  });

  it('applies automatic recommendations when the target building is purchased', () => {
    const save = synchronizePlanning(
      withPurchasedBuildings(
        withGladiators(createTestSave(), [
          createGladiator({
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
    expect(result.gladiators[0].currentBuildingId).toBe('infirmary');
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
    expect(result.gladiators[0].currentBuildingId).toBe('dormitory');
  });
});
