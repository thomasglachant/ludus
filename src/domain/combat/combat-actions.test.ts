import { describe, expect, it } from 'vitest';
import {
  ARENA_PUBLIC_STAKE_MODIFIER_SPREAD,
  ARENA_REWARDS,
  ARENA_VICTORY_ODDS_REWARD_MULTIPLIER,
} from '../../game-data/combat';
import { GLADIATOR_CLASS_VISUAL_ASSET_IDS } from '../../game-data/visual-assets';
import { createInitialSave } from '../saves/create-initial-save';
import type { GameSave, Gladiator } from '../types';
import {
  calculateArenaCombatReward,
  calculateCombatExperienceChange,
  calculateDecimalOdds,
  calculateDamage,
  calculateHitChance,
  calculateProjectedWinChance,
  generateOpponent,
  getArenaRank,
  resolveArenaDay,
  resolveCombat,
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
    experience: 0,
    strength: 10,
    agility: 9,
    defense: 9,
    life: 10,
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

  it('generates Sunday opponents in the same league near the player level', () => {
    const save = createTestSave();
    const gladiator = createGladiator({
      experience: 390,
      strength: 5,
      agility: 4,
      defense: 3,
      life: 2,
      reputation: 100,
    });
    const weakerOpponent = generateOpponent(save, gladiator, () => 0);
    const strongerOpponent = generateOpponent(save, gladiator, () => 1);

    expect(getArenaRank(weakerOpponent.reputation)).toBe(getArenaRank(gladiator.reputation));
    expect(getArenaRank(strongerOpponent.reputation)).toBe(getArenaRank(gladiator.reputation));
    expect(weakerOpponent.experience).toBe(230);
    expect(strongerOpponent.experience).toBe(580);
    expect(
      weakerOpponent.strength +
        weakerOpponent.agility +
        weakerOpponent.defense +
        weakerOpponent.life,
    ).toBe(12);
    expect(
      strongerOpponent.strength +
        strongerOpponent.agility +
        strongerOpponent.defense +
        strongerOpponent.life,
    ).toBe(14);
  });

  it('calculates arena rewards from victory, odds and public stake', () => {
    const reward = calculateArenaCombatReward('gold1', 1.8, () => 0.5);
    const expectedVictoryReward = Math.round(
      ARENA_REWARDS.gold1 * ARENA_VICTORY_ODDS_REWARD_MULTIPLIER * 1.8,
    );

    expect(reward).toEqual({
      totalReward: expectedVictoryReward,
      winnerReward: expectedVictoryReward,
      loserReward: 0,
      participationReward: 0,
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
    const expectedVictoryReward = Math.max(
      0,
      Math.round(
        ARENA_REWARDS.bronze3 * ARENA_VICTORY_ODDS_REWARD_MULTIPLIER * playerDecimalOdds -
          ARENA_PUBLIC_STAKE_MODIFIER_SPREAD,
      ),
    );
    const expectedWinnerReward = expectedVictoryReward;

    expect(combat.turns.length).toBeGreaterThan(0);
    expect(combat.turns[0]).toMatchObject({
      turnNumber: 1,
      logKey: 'combat.log.hit',
    });
    expect(combat.reward).toEqual({
      totalReward: expectedWinnerReward,
      winnerReward: expectedWinnerReward,
      loserReward: 0,
      participationReward: 0,
      victoryReward: expectedVictoryReward,
      publicStakeModifier: -ARENA_PUBLIC_STAKE_MODIFIER_SPREAD,
      playerDecimalOdds,
      opponentDecimalOdds,
    });
    expect(Object.values(GLADIATOR_CLASS_VISUAL_ASSET_IDS)).toContain(
      combat.opponent.visualIdentity?.portraitAssetId,
    );
    expect(combat.consequence.didPlayerWin).toBe(true);
    expect(combat.consequence.playerReward).toBe(expectedWinnerReward);
    expect(combat.consequence.experienceChange).toBe(
      calculateCombatExperienceChange(combat.gladiator, combat.opponent, true),
    );
  });

  it('adds reputation from the current value when the player wins', () => {
    const save = withSundayArena(createTestSave(), [createGladiator({ reputation: 20 })]);
    const combat = resolveCombat(save, save.gladiators[0], () => 0);

    expect(combat.consequence.didPlayerWin).toBe(true);
    expect(combat.consequence.reputationChange).toBe(10);
    expect(combat.consequence.finalReputation).toBe(30);
  });

  it('uses floored skill values for combat calculations', () => {
    const attacker = createGladiator({ strength: 7.99, agility: 8.99 });
    const defender = createGladiator({ id: 'defender-test', defense: 6.99, agility: 7.99 });
    const flooredAttacker = createGladiator({ strength: 7, agility: 8 });
    const flooredDefender = createGladiator({
      id: 'floored-defender-test',
      defense: 6,
      agility: 7,
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
      reputation: 10,
    });
    expect(gladiator.experience).toBeGreaterThan(save.gladiators[0].experience);
    expect(gladiator.life).toBe(save.gladiators[0].life);
    expect(resolved.ludus.treasury).toBe(
      save.ludus.treasury + resolved.arena.resolvedCombats[0].reward.winnerReward,
    );
    expect(resolved.economy.ledgerEntries[0]).toMatchObject({
      amount: resolved.arena.resolvedCombats[0].reward.winnerReward,
      category: 'arena',
      kind: 'income',
      labelKey: 'finance.ledger.arenaReward',
    });
    expect(resolved.ludus.reputation).toBe(gladiator.reputation);
  });

  it('regenerates skill allocation alerts when Sunday combat grants a level', () => {
    const save = withSundayArena(createTestSave(), [
      createGladiator({
        experience: 90,
        strength: 3,
        agility: 3,
        defense: 2,
        life: 2,
      }),
    ]);
    const resolved = resolveArenaDay(save, () => 0);

    expect(resolved.gladiators[0].experience).toBeGreaterThanOrEqual(100);
    expect(resolved.planning.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionKind: 'allocateGladiatorSkillPoint',
          gladiatorId: 'gladiator-test',
        }),
      ]),
    );
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
  });

  it('activates an empty Sunday arena day without rewards when no gladiator is eligible', () => {
    const save = withSundayArena(createTestSave(), []);
    const resolved = resolveArenaDay(save, () => 0);

    expect(resolved.arena).toMatchObject({
      isArenaDayActive: true,
      resolvedCombats: [],
    });
    expect(resolved.ludus.treasury).toBe(save.ludus.treasury);
    expect(resolved.gladiators).toEqual([]);
  });

  it('excludes gladiators with an active weekly injury from Sunday combat', () => {
    const save = withSundayArena(createTestSave(), [
      createGladiator({ weeklyInjury: { reason: 'training', week: 1, year: 1 } }),
    ]);
    const resolved = resolveArenaDay(save, () => 1);

    expect(resolved.arena.resolvedCombats).toEqual([]);
    expect(resolved.gladiators[0]).toMatchObject({ wins: 0, losses: 0, reputation: 0 });
    expect(resolved.ludus.treasury).toBe(save.ludus.treasury);
  });

  it('applies loss consequences without a participation reward', () => {
    const save = withSundayArena(createTestSave(), [
      createGladiator({
        strength: 3,
        agility: 3,
        defense: 3,
        life: 3,
      }),
    ]);
    const resolved = resolveArenaDay(save, () => 1);
    const combat = resolved.arena.resolvedCombats[0];
    const gladiator = resolved.gladiators[0];

    expect(combat.consequence.didPlayerWin).toBe(false);
    expect(combat.consequence.playerReward).toBe(combat.reward.loserReward);
    expect(resolved.ludus.treasury).toBe(save.ludus.treasury + combat.reward.loserReward);
    expect(gladiator).toMatchObject({
      wins: 0,
      losses: 1,
      reputation: 0,
    });
    expect(gladiator.experience).toBeGreaterThan(save.gladiators[0].experience);
  });

  it('subtracts reputation from the current value when the player loses', () => {
    const save = withSundayArena(createTestSave(), [
      createGladiator({
        strength: 3,
        agility: 3,
        defense: 3,
        life: 1,
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
});
