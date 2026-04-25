import { describe, expect, it } from 'vitest';
import { resolveArenaDay } from '../../domain/combat/combat-actions';
import { createInitialSave } from '../../domain/saves/create-initial-save';
import type { GameSave, Gladiator } from '../../domain/types';
import { getArenaPanelViewModel } from './arena-panel-view-model';

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

describe('arena panel view model', () => {
  it('exposes resolved combat logs, rewards and consequences for the arena UI', () => {
    const save = resolveArenaDay(withSundayArena(createTestSave(), [createGladiator()]), () => 0);
    const viewModel = getArenaPanelViewModel(save);

    expect(viewModel.currentCombat?.turns.length).toBeGreaterThan(0);
    expect(viewModel.currentCombat?.turns[0]).toMatchObject({
      logKey: 'combat.log.hit',
      logParams: {
        attacker: expect.any(String),
        defender: expect.any(String),
        damage: expect.any(Number),
      },
    });
    expect(viewModel.summary).toMatchObject({
      totalReward: viewModel.currentCombat?.consequence.playerReward,
      wins: 1,
      losses: 0,
      reputationChange: 10,
    });
    expect(viewModel.emptyMessageKey).toBeUndefined();
  });

  it('exposes a clean empty state for an arena day without eligible combats', () => {
    const save = resolveArenaDay(
      withSundayArena(createTestSave(), [createGladiator({ health: 0 })]),
      () => 0,
    );
    const viewModel = getArenaPanelViewModel(save);

    expect(viewModel.currentCombat).toBeUndefined();
    expect(viewModel.emptyMessageKey).toBe('arena.noEligible');
    expect(viewModel.summary).toMatchObject({
      totalReward: 0,
      wins: 0,
      losses: 0,
    });
  });
});
