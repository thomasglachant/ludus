import { describe, expect, it } from 'vitest';
import { resolveArenaDay } from '../../domain/combat/combat-actions';
import { createInitialSave } from '../../domain/saves/create-initial-save';
import type { CombatState, GameSave, Gladiator } from '../../domain/types';
import { getCombatScreenCombat, getCombatScreenViewModel } from './combat-screen-view-model';

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

function getHealthAfterTurn(combat: CombatState, visibleTurnCount: number) {
  return getCombatScreenViewModel(combat, visibleTurnCount);
}

describe('combat screen view model', () => {
  it('derives replay health, result state and generated assets from combat state', () => {
    const save = resolveArenaDay(withSundayArena(createTestSave(), [createGladiator()]), () => 0);
    const combat = getCombatScreenCombat(save);

    expect(combat).toBeDefined();

    const initialViewModel = getHealthAfterTurn(combat as CombatState, 0);
    const firstTurnViewModel = getHealthAfterTurn(combat as CombatState, 1);
    const completeViewModel = getHealthAfterTurn(
      combat as CombatState,
      (combat as CombatState).turns.length,
    );
    const firstTurn = (combat as CombatState).turns[0];
    const expectedPlayerHealth =
      firstTurn.attackerId === (combat as CombatState).gladiator.id
        ? firstTurn.attackerHealthAfterTurn
        : firstTurn.defenderHealthAfterTurn;
    const expectedOpponentHealth =
      firstTurn.attackerId === (combat as CombatState).opponent.id
        ? firstTurn.attackerHealthAfterTurn
        : firstTurn.defenderHealthAfterTurn;

    expect(initialViewModel.visibleTurns).toHaveLength(0);
    expect(initialViewModel.player.health).toBe((combat as CombatState).gladiator.health);
    expect(initialViewModel.opponent.health).toBe((combat as CombatState).opponent.health);
    expect(initialViewModel.player.idleFrames).toHaveLength(2);
    expect(initialViewModel.opponent.idleFrames).toHaveLength(2);
    expect(firstTurnViewModel.visibleTurns).toHaveLength(1);
    expect(firstTurnViewModel.player.health).toBe(expectedPlayerHealth);
    expect(firstTurnViewModel.opponent.health).toBe(expectedOpponentHealth);
    expect(completeViewModel.isComplete).toBe(true);
    expect(completeViewModel.consequence.playerReward).toBe(
      (combat as CombatState).consequence.playerReward,
    );
  });
});
