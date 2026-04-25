import { describe, expect, it } from 'vitest';
import { MARKET_CONFIG } from '../../game-data/market';
import { getAvailableDormitoryBeds, getDormitoryCapacity } from '../buildings/dormitory-capacity';
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
    ownerName: 'Marcus',
    ludusName: 'Ludus Magnus',
    language: 'en',
    saveId: 'save-test',
    createdAt: '2026-04-25T12:00:00.000Z',
  });
}

function withPurchasedDormitory(save: GameSave, purchasedBeds = 0): GameSave {
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
        level: 1,
        configuration: { purchasedBeds },
      },
    },
  };
}

describe('market actions', () => {
  it('generates five market gladiators that respect generation rules', () => {
    const gladiators = generateMarketGladiators(1, 1, () => 0);

    expect(gladiators).toHaveLength(MARKET_CONFIG.availableGladiatorCount);

    for (const gladiator of gladiators) {
      const totalStats = gladiator.strength + gladiator.agility + gladiator.defense;

      expect(gladiator.age).toBeGreaterThanOrEqual(MARKET_CONFIG.minAge);
      expect(gladiator.age).toBeLessThanOrEqual(MARKET_CONFIG.maxAge);
      expect(totalStats).toBe(MARKET_CONFIG.totalStatPoints);
      expect(gladiator.strength).toBeGreaterThanOrEqual(MARKET_CONFIG.minGeneratedStat);
      expect(gladiator.agility).toBeGreaterThanOrEqual(MARKET_CONFIG.minGeneratedStat);
      expect(gladiator.defense).toBeGreaterThanOrEqual(MARKET_CONFIG.minGeneratedStat);
      expect(gladiator.strength).toBeLessThanOrEqual(MARKET_CONFIG.maxGeneratedStat);
      expect(gladiator.agility).toBeLessThanOrEqual(MARKET_CONFIG.maxGeneratedStat);
      expect(gladiator.defense).toBeLessThanOrEqual(MARKET_CONFIG.maxGeneratedStat);
      expect(gladiator.price).toBe(calculateGladiatorMarketPrice(gladiator));
    }
  });

  it('prevents buying a market gladiator without a dormitory bed', () => {
    const save = createTestSave();
    const candidate = save.market.availableGladiators[0];
    const validation = validateMarketPurchase(save, candidate.id);

    expect(getDormitoryCapacity(save)).toBe(0);
    expect(validation).toMatchObject({
      isAllowed: false,
      reason: 'noAvailableBed',
      cost: candidate.price,
    });
  });

  it('buys a market gladiator when treasury and bed capacity are available', () => {
    const save = withPurchasedDormitory(createTestSave());
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
  });

  it('enforces dormitory capacity including purchased beds', () => {
    const save = withPurchasedDormitory(createTestSave(), 1);
    const firstCandidate = save.market.availableGladiators[0];
    const secondCandidate = save.market.availableGladiators[1];
    const thirdCandidate = save.market.availableGladiators[2];
    const firstPurchase = buyMarketGladiator(save, firstCandidate.id).save;
    const secondPurchase = buyMarketGladiator(firstPurchase, secondCandidate.id).save;
    const thirdValidation = validateMarketPurchase(secondPurchase, thirdCandidate.id);

    expect(getDormitoryCapacity(save)).toBe(2);
    expect(getAvailableDormitoryBeds(secondPurchase)).toBe(0);
    expect(secondPurchase.gladiators).toHaveLength(2);
    expect(thirdValidation).toMatchObject({
      isAllowed: false,
      reason: 'noAvailableBed',
    });
  });

  it('sells an owned gladiator and frees capacity', () => {
    const save = withPurchasedDormitory(createTestSave());
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
    expect(getAvailableDormitoryBeds(result.save)).toBe(1);
  });
});
