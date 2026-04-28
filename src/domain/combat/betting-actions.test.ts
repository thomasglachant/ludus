import { describe, expect, it } from 'vitest';
import { BETTING_CONFIG } from '../../game-data/combat';
import { createInitialSave } from '../saves/create-initial-save';
import type { GameSave, Gladiator } from '../types';
import {
  resolveArenaDay,
  scoutOpponent,
  synchronizeBetting,
  validateScouting,
} from './combat-actions';

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
    age: 24,
    strength: 25,
    agility: 22,
    defense: 21,
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

function withDay(save: GameSave, dayOfWeek: GameSave['time']['dayOfWeek']): GameSave {
  return {
    ...save,
    time: {
      ...save.time,
      dayOfWeek,
    },
  };
}

describe('betting actions', () => {
  it('shows first odds on Thursday and allows scouting before the lock', () => {
    const save: GameSave = {
      ...createTestSave(),
      gladiators: [createGladiator()],
    };
    const wednesday = synchronizeBetting(withDay(save, 'wednesday'), () => 0);
    const thursday = synchronizeBetting(withDay(save, 'thursday'), () => 0);
    const scouting = scoutOpponent(thursday, 'gladiator-test');

    expect(wednesday.arena.betting?.odds).toEqual([]);
    expect(thursday.arena.betting?.odds).toHaveLength(1);
    expect(scouting.validation.isAllowed).toBe(true);
    expect(scouting.save.ludus.treasury).toBe(save.ludus.treasury - BETTING_CONFIG.scoutingCost);
    expect(scouting.save.arena.betting?.scoutingReports).toHaveLength(1);
    expect(scouting.save.arena.betting?.odds[0].isScouted).toBe(true);
  });

  it('locks scouting on Saturday', () => {
    const save: GameSave = {
      ...createTestSave(),
      gladiators: [createGladiator()],
    };
    const saturday = synchronizeBetting(withDay(save, 'saturday'), () => 0);
    const validation = validateScouting(saturday, 'gladiator-test');

    expect(saturday.arena.betting?.areBetsLocked).toBe(true);
    expect(validation).toMatchObject({
      isAllowed: false,
      reason: 'betsLocked',
    });
  });

  it('uses the prepared odds opponent for Sunday combat', () => {
    const save: GameSave = {
      ...createTestSave(),
      gladiators: [createGladiator()],
    };
    const thursday = synchronizeBetting(withDay(save, 'thursday'), () => 0);
    const expectedOpponentId = thursday.arena.betting?.odds[0].opponent.id;
    const sunday = resolveArenaDay(withDay(thursday, 'sunday'), () => 0);

    expect(sunday.arena.resolvedCombats[0].opponent.id).toBe(expectedOpponentId);
  });
});
