import { describe, expect, it } from 'vitest';
import { ARENA_REWARDS, ARENA_REWARD_SPLIT } from '../../game-data/combat';
import { createInitialSave } from '../saves/create-initial-save';
import type { GameSave, Gladiator } from '../types';
import { getArenaRank, resolveArenaDay, resolveCombat, synchronizeArena } from './combat-actions';

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

describe('combat actions', () => {
  it('selects arena rank from reputation thresholds', () => {
    expect(getArenaRank(0)).toBe('bronze3');
    expect(getArenaRank(50)).toBe('bronze1');
    expect(getArenaRank(600)).toBe('gold1');
  });

  it('resolves a turn-based combat with a visible reward split', () => {
    const save = withSundayArena(createTestSave(), [createGladiator()]);
    const combat = resolveCombat(save, save.gladiators[0], () => 0);
    const expectedWinnerReward = Math.round(ARENA_REWARDS.bronze3 * ARENA_REWARD_SPLIT.winner);

    expect(combat.turns.length).toBeGreaterThan(0);
    expect(combat.turns[0]).toMatchObject({
      turnNumber: 1,
      logKey: 'combat.log.hit',
    });
    expect(combat.reward).toEqual({
      totalReward: ARENA_REWARDS.bronze3,
      winnerReward: expectedWinnerReward,
      loserReward: ARENA_REWARDS.bronze3 - expectedWinnerReward,
    });
    expect(combat.opponent.visualIdentity?.portraitAssetId).toMatch(/^gladiator-/);
    expect(combat.consequence.didPlayerWin).toBe(true);
    expect(combat.consequence.playerReward).toBe(expectedWinnerReward);
  });

  it('applies Sunday arena consequences and treasury rewards once', () => {
    const save = withSundayArena(createTestSave(), [createGladiator()]);
    const resolved = resolveArenaDay(save, () => 0);
    const resolvedAgain = resolveArenaDay(resolved, () => 0);
    const gladiator = resolved.gladiators[0];

    expect(resolved.arena.isArenaDayActive).toBe(true);
    expect(resolved.arena.resolvedCombats).toHaveLength(1);
    expect(resolvedAgain.arena.resolvedCombats).toHaveLength(1);
    expect(resolvedAgain.ludus.treasury).toBe(resolved.ludus.treasury);
    expect(gladiator).toMatchObject({
      wins: 1,
      losses: 0,
      morale: 85,
      reputation: 10,
    });
    expect(gladiator.energy).toBeLessThan(90);
    expect(resolved.ludus.treasury).toBe(
      save.ludus.treasury + resolved.arena.resolvedCombats[0].reward.winnerReward,
    );
    expect(resolved.ludus.reputation).toBe(gladiator.reputation);
  });

  it('activates an empty Sunday arena day without rewards when no gladiator is eligible', () => {
    const save = withSundayArena(createTestSave(), [createGladiator({ health: 0 })]);
    const resolved = resolveArenaDay(save, () => 0);

    expect(resolved.arena).toMatchObject({
      currentCombatId: undefined,
      isArenaDayActive: true,
      pendingCombats: [],
      resolvedCombats: [],
    });
    expect(resolved.ludus.treasury).toBe(save.ludus.treasury);
    expect(resolved.gladiators[0].wins + resolved.gladiators[0].losses).toBe(0);
  });

  it('grants the loser share and applies loss consequences when the player loses', () => {
    const save = withSundayArena(createTestSave(), [
      createGladiator({
        strength: 3,
        agility: 3,
        defense: 3,
        health: 30,
      }),
    ]);
    const resolved = resolveArenaDay(save, () => 0);
    const combat = resolved.arena.resolvedCombats[0];
    const gladiator = resolved.gladiators[0];

    expect(combat.consequence.didPlayerWin).toBe(false);
    expect(combat.consequence.playerReward).toBe(combat.reward.loserReward);
    expect(resolved.ludus.treasury).toBe(save.ludus.treasury + combat.reward.loserReward);
    expect(gladiator).toMatchObject({
      wins: 0,
      losses: 1,
      morale: 62,
      reputation: 0,
    });
  });

  it('keeps arena inactive outside Sunday', () => {
    const save = {
      ...createTestSave(),
      gladiators: [createGladiator()],
    };
    const synchronized = synchronizeArena(save, () => 0);

    expect(synchronized.arena.isArenaDayActive).toBe(false);
    expect(synchronized.arena.resolvedCombats).toEqual([]);
  });
});
