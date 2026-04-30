import { describe, expect, it } from 'vitest';
import {
  ARENA_PARTICIPATION_REWARDS,
  ARENA_PUBLIC_STAKE_MODIFIER_SPREAD,
  ARENA_REWARDS,
  ARENA_VICTORY_ODDS_REWARD_MULTIPLIER,
} from '../../game-data/combat';
import { createInitialSave } from '../saves/create-initial-save';
import type { GameSave, Gladiator } from '../types';
import {
  calculateArenaCombatReward,
  calculateDecimalOdds,
  calculateDamage,
  calculateHitChance,
  calculateProjectedWinChance,
  generateOpponent,
  getArenaRank,
  resolveArenaDay,
  resolveCombat,
  synchronizeArena,
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

  it('generates Sunday opponents within 20 percent of player skills in the same league', () => {
    const save = createTestSave();
    const gladiator = createGladiator({
      strength: 50,
      agility: 40,
      defense: 30,
      reputation: 100,
    });
    const weakerOpponent = generateOpponent(save, gladiator, () => 0);
    const strongerOpponent = generateOpponent(save, gladiator, () => 1);

    expect(getArenaRank(weakerOpponent.reputation)).toBe(getArenaRank(gladiator.reputation));
    expect(getArenaRank(strongerOpponent.reputation)).toBe(getArenaRank(gladiator.reputation));
    expect(weakerOpponent).toMatchObject({
      strength: 40,
      agility: 32,
      defense: 24,
    });
    expect(strongerOpponent).toMatchObject({
      strength: 60,
      agility: 48,
      defense: 36,
    });
  });

  it('calculates arena rewards from participation, odds and public stake', () => {
    const reward = calculateArenaCombatReward('gold1', 1.8, () => 0.5);
    const expectedParticipationReward = ARENA_PARTICIPATION_REWARDS.gold1;
    const expectedVictoryReward = Math.round(
      ARENA_REWARDS.gold1 * ARENA_VICTORY_ODDS_REWARD_MULTIPLIER * 1.8,
    );

    expect(reward).toEqual({
      totalReward: expectedParticipationReward + expectedVictoryReward,
      winnerReward: expectedParticipationReward + expectedVictoryReward,
      loserReward: expectedParticipationReward,
      participationReward: expectedParticipationReward,
      victoryReward: expectedVictoryReward,
      publicStakeModifier: 0,
      playerDecimalOdds: 1.8,
    });
  });

  it('resolves a turn-based combat with odds-based arena rewards', () => {
    const save = withSundayArena(createTestSave(), [createGladiator()]);
    const combat = resolveCombat(save, save.gladiators[0], () => 0);
    const playerChance = calculateProjectedWinChance(combat.gladiator, combat.opponent);
    const playerDecimalOdds = calculateDecimalOdds(playerChance);
    const opponentDecimalOdds = calculateDecimalOdds(1 - playerChance);
    const expectedParticipationReward = ARENA_PARTICIPATION_REWARDS.bronze3;
    const expectedVictoryReward = Math.max(
      0,
      Math.round(
        ARENA_REWARDS.bronze3 * ARENA_VICTORY_ODDS_REWARD_MULTIPLIER * playerDecimalOdds -
          ARENA_PUBLIC_STAKE_MODIFIER_SPREAD,
      ),
    );
    const expectedWinnerReward = expectedParticipationReward + expectedVictoryReward;

    expect(combat.turns.length).toBeGreaterThan(0);
    expect(combat.turns[0]).toMatchObject({
      turnNumber: 1,
      logKey: 'combat.log.hit',
    });
    expect(combat.reward).toEqual({
      totalReward: expectedWinnerReward,
      winnerReward: expectedWinnerReward,
      loserReward: expectedParticipationReward,
      participationReward: expectedParticipationReward,
      victoryReward: expectedVictoryReward,
      publicStakeModifier: -ARENA_PUBLIC_STAKE_MODIFIER_SPREAD,
      playerDecimalOdds,
      opponentDecimalOdds,
    });
    expect(combat.opponent.visualIdentity?.portraitAssetId).toMatch(/^gladiator-/);
    expect(combat.consequence.didPlayerWin).toBe(true);
    expect(combat.consequence.playerReward).toBe(expectedWinnerReward);
  });

  it('adds reputation from the current value when the player wins', () => {
    const save = withSundayArena(createTestSave(), [createGladiator({ reputation: 20 })]);
    const combat = resolveCombat(save, save.gladiators[0], () => 0);

    expect(combat.consequence.didPlayerWin).toBe(true);
    expect(combat.consequence.reputationChange).toBe(10);
    expect(combat.consequence.finalReputation).toBe(30);
  });

  it('uses floored skill values for combat calculations', () => {
    const attacker = createGladiator({ strength: 20.99, agility: 18.99 });
    const defender = createGladiator({ id: 'defender-test', defense: 18.99, agility: 17.99 });
    const flooredAttacker = createGladiator({ strength: 20, agility: 18 });
    const flooredDefender = createGladiator({
      id: 'floored-defender-test',
      defense: 18,
      agility: 17,
    });

    expect(calculateHitChance(attacker, defender)).toBe(
      calculateHitChance(flooredAttacker, flooredDefender),
    );
    expect(calculateDamage(attacker, defender)).toBe(
      calculateDamage(flooredAttacker, flooredDefender),
    );
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

  it('orders arena day combats from the lowest league to the highest league before presentation', () => {
    const save = withSundayArena(createTestSave(), [
      createGladiator({ id: 'gold-test', name: 'Goldius', reputation: 600 }),
      createGladiator({ id: 'bronze-test', name: 'Brutus', reputation: 0 }),
      createGladiator({ id: 'silver-test', name: 'Silvanus', reputation: 100 }),
      createGladiator({ id: 'bronze-two-test', name: 'Cassius', reputation: 25 }),
    ]);
    const resolved = resolveArenaDay(save, () => 0);

    expect(resolved.arena.resolvedCombats.map((combat) => combat.rank)).toEqual([
      'bronze3',
      'bronze2',
      'silver3',
      'gold1',
    ]);
    expect(resolved.arena.currentCombatId).toBe(resolved.arena.resolvedCombats[0].id);
  });

  it('activates an empty Sunday arena day without rewards when no gladiator is eligible', () => {
    const save = withSundayArena(createTestSave(), [createGladiator({ health: 0 })]);
    const resolved = resolveArenaDay(save, () => 0);

    expect(resolved.arena).toMatchObject({
      currentCombatId: undefined,
      isArenaDayActive: true,
      resolvedCombats: [],
    });
    expect(resolved.ludus.treasury).toBe(save.ludus.treasury);
    expect(resolved.gladiators[0].wins + resolved.gladiators[0].losses).toBe(0);
  });

  it('grants the participation reward and applies loss consequences when the player loses', () => {
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

  it('subtracts reputation from the current value when the player loses', () => {
    const save = withSundayArena(createTestSave(), [
      createGladiator({
        strength: 3,
        agility: 3,
        defense: 3,
        health: 30,
        reputation: 20,
      }),
    ]);
    const resolved = resolveArenaDay(save, () => 0);
    const combat = resolved.arena.resolvedCombats[0];
    const gladiator = resolved.gladiators[0];

    expect(combat.consequence.didPlayerWin).toBe(false);
    expect(combat.consequence.reputationChange).toBe(-3);
    expect(gladiator.reputation).toBe(17);
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
