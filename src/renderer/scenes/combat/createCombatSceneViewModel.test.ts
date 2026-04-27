import { describe, expect, it } from 'vitest';
import { resolveArenaDay } from '../../../domain/combat/combat-actions';
import { createInitialSave } from '../../../domain/saves/create-initial-save';
import type { CombatState, GameSave, Gladiator } from '../../../domain/types';
import {
  getCombatScreenCombat,
  getCombatScreenViewModel,
} from '../../../ui/combat/combat-screen-view-model';
import { createCombatSceneViewModel } from './createCombatSceneViewModel';

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
    age: 24,
    strength: 20,
    agility: 18,
    defense: 18,
    energy: 90,
    health: 100,
    morale: 70,
    satiety: 80,
    reputation: 0,
    wins: 0,
    losses: 0,
    traits: [],
    ...overrides,
  };
}

function withSundayArena(save: GameSave, gladiators: Gladiator[]) {
  return {
    ...save,
    time: {
      ...save.time,
      dayOfWeek: 'sunday' as const,
    },
    gladiators,
  };
}

describe('createCombatSceneViewModel', () => {
  it('creates serializable Pixi combat scene props from the React combat view model', () => {
    const save = resolveArenaDay(withSundayArena(createTestSave(), [createGladiator()]), () => 0);
    const combat = getCombatScreenCombat(save) as CombatState;
    const screenViewModel = getCombatScreenViewModel(combat, 1);
    const sceneViewModel = createCombatSceneViewModel(screenViewModel, { reducedMotion: true });

    expect(sceneViewModel).toEqual(JSON.parse(JSON.stringify(sceneViewModel)));
    expect(sceneViewModel.reducedMotion).toBe(true);
    expect(sceneViewModel.backgroundPath).toContain('/assets/pixel-art/');
    expect(sceneViewModel.latestAttackerId).toBe(combat.turns[0].attackerId);
    expect(sceneViewModel.left).toMatchObject({
      id: combat.gladiator.id,
      side: 'left',
    });
    expect(sceneViewModel.right).toMatchObject({
      id: combat.opponent.id,
      side: 'right',
    });
    expect(sceneViewModel.left.idleFrames.length).toBeGreaterThan(0);
    expect(sceneViewModel.right.attackFrames.length).toBeGreaterThan(0);
  });
});
