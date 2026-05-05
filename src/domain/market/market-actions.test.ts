import { describe, expect, it } from 'vitest';
import { GAME_BALANCE } from '../../game-data/balance';
import { MARKET_CONFIG } from '../../game-data/market';
import { purchaseBuildingImprovement } from '../buildings/building-actions';
import { getAvailableLudusGladiatorPlaces, getLudusGladiatorCapacity } from '../ludus/capacity';
import type { Gladiator } from '../gladiators/types';
import { createInitialSave } from '../saves/create-initial-save';
import type { GameSave } from '../saves/types';
import {
  buyMarketGladiator,
  calculateGladiatorMarketPrice,
  calculateGladiatorSaleValue,
  generateMarketGladiators,
  sellGladiator,
  validateMarketPurchase,
} from './market-actions';

function createTestSave() {
  return createInitialSave({
    ludusName: 'Ludus Magnus',
    saveId: 'save-test',
    createdAt: '2026-04-25T12:00:00.000Z',
  });
}

const capacityImprovementIds = [
  'dormitoryExtraBunk1',
  'dormitoryExtraBunk2',
  'dormitoryExtraBunk3',
  'dormitoryExtraBunk4',
  'dormitoryExtraBunk5',
];

function withDormitoryCapacity(save: GameSave, capacity = 1): GameSave {
  return {
    ...save,
    ludus: {
      ...save.ludus,
      treasury: 1_000,
    },
    buildings: {
      ...save.buildings,
      dormitory: {
        ...save.buildings.dormitory,
        isPurchased: true,
        level: Math.max(1, capacity - 1),
        purchasedImprovementIds: capacityImprovementIds.slice(0, Math.max(0, capacity - 1)),
      },
    },
  };
}

function createOwnedGladiator(overrides: Partial<Gladiator> = {}): Gladiator {
  return {
    id: 'owned-gladiator-test',
    name: 'Aulus',
    age: 18,
    experience: 0,
    strength: 3,
    agility: 3,
    defense: 2,
    life: 2,
    reputation: 0,
    wins: 0,
    losses: 0,
    traits: [],
    ...overrides,
  };
}

describe('market actions', () => {
  it('generates twenty market gladiators that respect generation rules', () => {
    const gladiators = generateMarketGladiators(1, 1, () => 0);

    expect(gladiators).toHaveLength(MARKET_CONFIG.availableGladiatorCount);

    for (const gladiator of gladiators) {
      const totalSkills =
        gladiator.strength + gladiator.agility + gladiator.defense + gladiator.life;

      expect(gladiator.age).toBeGreaterThanOrEqual(MARKET_CONFIG.minAge);
      expect(gladiator.age).toBeLessThanOrEqual(MARKET_CONFIG.maxAge);
      expect(totalSkills).toBe(GAME_BALANCE.gladiators.skills.initialTotalPoints);
      expect(gladiator.strength).toBeGreaterThanOrEqual(GAME_BALANCE.gladiators.skills.minimum);
      expect(gladiator.agility).toBeGreaterThanOrEqual(GAME_BALANCE.gladiators.skills.minimum);
      expect(gladiator.defense).toBeGreaterThanOrEqual(GAME_BALANCE.gladiators.skills.minimum);
      expect(gladiator.life).toBeGreaterThanOrEqual(GAME_BALANCE.gladiators.skills.minimum);
      expect(gladiator.strength).toBeLessThanOrEqual(GAME_BALANCE.gladiators.skills.initialMaximum);
      expect(gladiator.agility).toBeLessThanOrEqual(GAME_BALANCE.gladiators.skills.initialMaximum);
      expect(gladiator.defense).toBeLessThanOrEqual(GAME_BALANCE.gladiators.skills.initialMaximum);
      expect(gladiator.life).toBeLessThanOrEqual(GAME_BALANCE.gladiators.skills.initialMaximum);
      expect(gladiator.experience).toBe(GAME_BALANCE.gladiators.progression.experienceByLevel[0]);
      expect(gladiator.price).toBe(calculateGladiatorMarketPrice(gladiator));
    }
  });

  it('prices gladiators from their experience', () => {
    const rookieGladiator = createOwnedGladiator({ experience: 0 });
    const veteranGladiator = createOwnedGladiator({
      experience: MARKET_CONFIG.priceExperienceStep * 3,
    });

    expect(calculateGladiatorMarketPrice(rookieGladiator)).toBe(MARKET_CONFIG.minimumPrice);
    expect(calculateGladiatorMarketPrice(veteranGladiator)).toBe(
      MARKET_CONFIG.minimumPrice + MARKET_CONFIG.pricePerExperienceStep * 3,
    );
  });

  it('floors experience steps for market pricing', () => {
    const gladiator = createOwnedGladiator({
      experience: MARKET_CONFIG.priceExperienceStep * 2 + MARKET_CONFIG.priceExperienceStep - 1,
    });

    expect(calculateGladiatorMarketPrice(gladiator)).toBe(
      MARKET_CONFIG.minimumPrice + MARKET_CONFIG.pricePerExperienceStep * 2,
    );
  });

  it('prevents buying a market gladiator when no ludus place is available', () => {
    const save = {
      ...createTestSave(),
      gladiators: [createOwnedGladiator()],
    };
    const candidate = save.market.availableGladiators[0];
    const validation = validateMarketPurchase(save, candidate.id);

    expect(getLudusGladiatorCapacity(save)).toBe(1);
    expect(validation).toMatchObject({
      isAllowed: false,
      reason: 'noAvailablePlace',
      cost: candidate.price,
    });
  });

  it('buys a market gladiator when treasury and ludus capacity are available', () => {
    const save = withDormitoryCapacity(createTestSave());
    const candidate = save.market.availableGladiators[0];
    const result = buyMarketGladiator(save, candidate.id);

    expect(result.validation).toMatchObject({
      isAllowed: true,
      cost: candidate.price,
    });
    expect(result.save.ludus.treasury).toBe(save.ludus.treasury - candidate.price);
    expect(result.save.gladiators).toHaveLength(1);
    expect(result.save.gladiators[0]).toMatchObject({
      id: candidate.id,
      name: candidate.name,
    });
    expect(result.save.gladiators[0]).not.toHaveProperty('price');
    expect(result.save.market.availableGladiators).toHaveLength(
      MARKET_CONFIG.availableGladiatorCount - 1,
    );
    expect(result.save.economy.ledgerEntries[0]).toMatchObject({
      amount: candidate.price,
      category: 'market',
      kind: 'expense',
      labelKey: 'finance.ledger.gladiatorPurchase',
      relatedId: candidate.id,
    });
  });

  it('enforces Dormitory improvement-governed ludus capacity', () => {
    const save = withDormitoryCapacity(createTestSave(), 2);
    const firstCandidate = save.market.availableGladiators[0];
    const secondCandidate = save.market.availableGladiators[1];
    const thirdCandidate = save.market.availableGladiators[2];
    const firstPurchase = buyMarketGladiator(save, firstCandidate.id).save;
    const secondPurchase = buyMarketGladiator(firstPurchase, secondCandidate.id).save;
    const thirdValidation = validateMarketPurchase(secondPurchase, thirdCandidate.id);

    expect(getLudusGladiatorCapacity(save)).toBe(2);
    expect(getAvailableLudusGladiatorPlaces(secondPurchase)).toBe(0);
    expect(secondPurchase.gladiators).toHaveLength(2);
    expect(thirdValidation).toMatchObject({
      isAllowed: false,
      reason: 'noAvailablePlace',
    });
  });

  it('allows buying a market gladiator after buying a Dormitory place', () => {
    const save = {
      ...withDormitoryCapacity(createTestSave()),
      gladiators: [createOwnedGladiator()],
    };
    const candidate = save.market.availableGladiators[0];
    const blockedValidation = validateMarketPurchase(save, candidate.id);
    const expandedSave = purchaseBuildingImprovement(save, 'dormitory', 'dormitoryExtraBunk1').save;
    const result = buyMarketGladiator(expandedSave, candidate.id);

    expect(blockedValidation).toMatchObject({
      isAllowed: false,
      reason: 'noAvailablePlace',
    });
    expect(getAvailableLudusGladiatorPlaces(expandedSave)).toBe(1);
    expect(result.validation.isAllowed).toBe(true);
    expect(result.save.gladiators).toHaveLength(2);
  });

  it('sells an owned gladiator and frees capacity', () => {
    const save = withDormitoryCapacity(createTestSave());
    const candidate = save.market.availableGladiators[0];
    const purchased = buyMarketGladiator(save, candidate.id).save;
    const saleValue = calculateGladiatorSaleValue(purchased.gladiators[0]);
    const result = sellGladiator(purchased, candidate.id);

    expect(result.validation).toMatchObject({
      isAllowed: true,
      saleValue,
    });
    expect(result.save.gladiators).toEqual([]);
    expect(result.save.ludus.treasury).toBe(purchased.ludus.treasury + saleValue);
    expect(getAvailableLudusGladiatorPlaces(result.save)).toBe(1);
    expect(result.save.economy.ledgerEntries[0]).toMatchObject({
      amount: saleValue,
      category: 'market',
      kind: 'income',
      labelKey: 'finance.ledger.gladiatorSale',
      relatedId: candidate.id,
    });
  });
});
