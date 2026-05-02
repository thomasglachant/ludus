import { GLADIATOR_NAMES } from '../../game-data/gladiator-names';
import { createGladiatorVisualIdentity } from '../../game-data/gladiator-visuals';
import { GAME_BALANCE } from '../../game-data/balance';
import { MARKET_CONFIG } from '../../game-data/market';
import { getAvailableLudusGladiatorPlaces } from '../ludus/capacity';
import {
  addLedgerEntry,
  createLedgerEntry,
  updateCurrentWeekSummary,
} from '../economy/economy-actions';
import { getGladiatorEffectiveSkill } from '../gladiators/skills';
import type { Gladiator } from '../gladiators/types';
import { synchronizePlanning } from '../planning/planning-actions';
import type { GameSave } from '../saves/types';
import type { MarketGladiator, MarketState } from './types';

type RandomSource = () => number;

export type MarketActionFailureReason =
  | 'candidateNotFound'
  | 'gladiatorNotFound'
  | 'insufficientTreasury'
  | 'noAvailablePlace';

export interface MarketActionValidation {
  isAllowed: boolean;
  cost: number;
  saleValue: number;
  reason?: MarketActionFailureReason;
}

export interface MarketActionResult {
  save: GameSave;
  validation: MarketActionValidation;
}

function pickIndex(length: number, random: RandomSource) {
  return Math.min(length - 1, Math.floor(random() * length));
}

function createGeneratedStats(random: RandomSource) {
  const statCount = GAME_BALANCE.gladiators.skills.names.length;
  const stats = Array.from({ length: statCount }, () => MARKET_CONFIG.minGeneratedStat);
  let remainingPoints = MARKET_CONFIG.totalStatPoints - MARKET_CONFIG.minGeneratedStat * statCount;

  while (remainingPoints > 0) {
    const eligibleStatIndexes = stats
      .map((stat, index) => ({ stat, index }))
      .filter(({ stat }) => stat < MARKET_CONFIG.maxGeneratedStat)
      .map(({ index }) => index);

    const selectedIndex = eligibleStatIndexes[pickIndex(eligibleStatIndexes.length, random)];

    stats[selectedIndex] += 1;
    remainingPoints -= 1;
  }

  return {
    strength: stats[0],
    agility: stats[1],
    defense: stats[2],
    life: stats[3],
  };
}

function createGeneratedAge(random: RandomSource) {
  const ageRange = MARKET_CONFIG.maxAge - MARKET_CONFIG.minAge + 1;

  return MARKET_CONFIG.minAge + pickIndex(ageRange, random);
}

export function calculateGladiatorMarketPrice(gladiator: Gladiator) {
  const totalStats =
    getGladiatorEffectiveSkill(gladiator, 'strength') +
    getGladiatorEffectiveSkill(gladiator, 'agility') +
    getGladiatorEffectiveSkill(gladiator, 'defense') +
    getGladiatorEffectiveSkill(gladiator, 'life');

  return (
    MARKET_CONFIG.basePrice +
    gladiator.reputation * MARKET_CONFIG.reputationPriceMultiplier +
    totalStats * MARKET_CONFIG.statPriceMultiplier
  );
}

export function calculateGladiatorSaleValue(gladiator: Gladiator) {
  return Math.round(calculateGladiatorMarketPrice(gladiator) * MARKET_CONFIG.saleValueMultiplier);
}

export function generateMarketGladiators(
  year: number,
  week: number,
  random: RandomSource = Math.random,
): MarketGladiator[] {
  const nameOffset = pickIndex(GLADIATOR_NAMES.length, random);

  return Array.from({ length: MARKET_CONFIG.availableGladiatorCount }, (_, index) => {
    const id = `market-${year}-${week}-${index + 1}`;
    const stats = createGeneratedStats(random);
    const reputation = GAME_BALANCE.gladiators.marketDefaults.reputation;
    const gladiator: Gladiator = {
      id,
      name: GLADIATOR_NAMES[(nameOffset + index) % GLADIATOR_NAMES.length],
      age: createGeneratedAge(random),
      strength: stats.strength,
      agility: stats.agility,
      defense: stats.defense,
      life: stats.life,
      reputation,
      wins: GAME_BALANCE.gladiators.marketDefaults.wins,
      losses: GAME_BALANCE.gladiators.marketDefaults.losses,
      traits: [
        GAME_BALANCE.market.generatedTraitPool[
          pickIndex(GAME_BALANCE.market.generatedTraitPool.length, random)
        ],
      ],
      visualIdentity: createGladiatorVisualIdentity(id, { skillProfile: stats }),
    };

    return {
      ...gladiator,
      price: calculateGladiatorMarketPrice(gladiator),
    };
  });
}

export function createMarketState(
  year: number,
  week: number,
  random: RandomSource = Math.random,
): MarketState {
  return {
    year,
    week,
    availableGladiators: generateMarketGladiators(year, week, random),
  };
}

export function validateMarketPurchase(
  save: GameSave,
  candidateId: string,
): MarketActionValidation {
  const candidate = save.market.availableGladiators.find(
    (gladiator) => gladiator.id === candidateId,
  );

  if (!candidate) {
    return {
      isAllowed: false,
      cost: 0,
      saleValue: 0,
      reason: 'candidateNotFound',
    };
  }

  if (getAvailableLudusGladiatorPlaces(save) <= 0) {
    return {
      isAllowed: false,
      cost: candidate.price,
      saleValue: 0,
      reason: 'noAvailablePlace',
    };
  }

  if (save.ludus.treasury < candidate.price) {
    return {
      isAllowed: false,
      cost: candidate.price,
      saleValue: 0,
      reason: 'insufficientTreasury',
    };
  }

  return {
    isAllowed: true,
    cost: candidate.price,
    saleValue: 0,
  };
}

export function buyMarketGladiator(save: GameSave, candidateId: string): MarketActionResult {
  const validation = validateMarketPurchase(save, candidateId);

  if (!validation.isAllowed) {
    return { save, validation };
  }

  const candidate = save.market.availableGladiators.find(
    (gladiator) => gladiator.id === candidateId,
  );

  if (!candidate) {
    return {
      save,
      validation: {
        isAllowed: false,
        cost: 0,
        saleValue: 0,
        reason: 'candidateNotFound',
      },
    };
  }

  const gladiator: Gladiator = {
    id: candidate.id,
    name: candidate.name,
    age: candidate.age,
    strength: candidate.strength,
    agility: candidate.agility,
    defense: candidate.defense,
    life: candidate.life,
    reputation: candidate.reputation,
    wins: candidate.wins,
    losses: candidate.losses,
    traits: candidate.traits,
    trainingPlan: candidate.trainingPlan,
    visualIdentity: candidate.visualIdentity,
  };

  const nextSave = addLedgerEntry(
    {
      ...save,
      gladiators: [...save.gladiators, gladiator],
      market: {
        ...save.market,
        availableGladiators: save.market.availableGladiators.filter(
          (marketGladiator) => marketGladiator.id !== candidateId,
        ),
      },
    },
    createLedgerEntry(save, {
      kind: 'expense',
      category: 'market',
      amount: candidate.price,
      labelKey: 'finance.ledger.gladiatorPurchase',
      relatedId: candidate.id,
    }),
  );

  return {
    validation,
    save: synchronizePlanning(updateCurrentWeekSummary(nextSave)),
  };
}

export function validateGladiatorSale(save: GameSave, gladiatorId: string): MarketActionValidation {
  const gladiator = save.gladiators.find((ownedGladiator) => ownedGladiator.id === gladiatorId);

  if (!gladiator) {
    return {
      isAllowed: false,
      cost: 0,
      saleValue: 0,
      reason: 'gladiatorNotFound',
    };
  }

  return {
    isAllowed: true,
    cost: 0,
    saleValue: calculateGladiatorSaleValue(gladiator),
  };
}

export function sellGladiator(save: GameSave, gladiatorId: string): MarketActionResult {
  const validation = validateGladiatorSale(save, gladiatorId);

  if (!validation.isAllowed) {
    return { save, validation };
  }

  const nextSave = addLedgerEntry(
    {
      ...save,
      gladiators: save.gladiators.filter((gladiator) => gladiator.id !== gladiatorId),
      planning: {
        ...save.planning,
        alerts: save.planning.alerts.filter((alert) => alert.gladiatorId !== gladiatorId),
      },
    },
    createLedgerEntry(save, {
      kind: 'income',
      category: 'market',
      amount: validation.saleValue,
      labelKey: 'finance.ledger.gladiatorSale',
      relatedId: gladiatorId,
    }),
  );

  return {
    validation,
    save: synchronizePlanning(updateCurrentWeekSummary(nextSave)),
  };
}
