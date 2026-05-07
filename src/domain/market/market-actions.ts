import { GLADIATOR_NAMES } from '../../game-data/gladiators/names';
import { createGladiatorVisualIdentity } from '../../game-data/gladiators/visuals';
import { GLADIATOR_MARKET_DEFAULTS } from '../../game-data/gladiators/combat';
import { GLADIATOR_PROGRESSION_CONFIG } from '../../game-data/gladiators/progression';
import { MARKET_GENERATION_CONFIG } from '../../game-data/market/generation';
import { MARKET_PRICING_CONFIG } from '../../game-data/market/pricing';
import { refreshGameAlerts } from '../alerts/alert-actions';
import { getAvailableLudusGladiatorPlaces } from '../ludus/capacity';
import {
  addLedgerEntry,
  createLedgerEntry,
  updateCurrentWeekSummary,
} from '../economy/economy-actions';
import {
  getGladiatorMarketPriceModifierPercent,
  getMarketPermanentGladiatorTraitDefinitions,
} from '../gladiators/trait-actions';
import { createInitialSkillProfile } from '../gladiators/progression';
import { GLADIATOR_SKILL_NAMES, getGladiatorEffectiveSkill } from '../gladiators/skills';
import type { Gladiator } from '../gladiators/types';
import { synchronizePlanning } from '../planning/planning-actions';
import type { GameSave } from '../saves/types';
import type { MarketGladiator, MarketState } from './types';
import type { GladiatorTraitDefinition } from '../gladiators/traits';

type RandomSource = () => number;

export const MARKET_ACTION_FAILURE_REASONS = [
  'candidateNotFound',
  'gladiatorNotFound',
  'insufficientTreasury',
  'noAvailablePlace',
] as const;

export type MarketActionFailureReason = (typeof MARKET_ACTION_FAILURE_REASONS)[number];

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
  return createInitialSkillProfile(random);
}

function createGeneratedAge(random: RandomSource) {
  const ageRange = MARKET_GENERATION_CONFIG.maxAge - MARKET_GENERATION_CONFIG.minAge + 1;

  return MARKET_GENERATION_CONFIG.minAge + pickIndex(ageRange, random);
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function roundToNearest(value: number, step: number) {
  return Math.round(value / step) * step;
}

function isTraitAllowed(
  definition: GladiatorTraitDefinition,
  selectedTraits: GladiatorTraitDefinition[],
) {
  return (
    !selectedTraits.some((trait) => trait.id === definition.id) &&
    (!definition.exclusiveGroup ||
      !selectedTraits.some((trait) => trait.exclusiveGroup === definition.exclusiveGroup))
  );
}

function pickWeightedTrait(
  definitions: GladiatorTraitDefinition[],
  random: RandomSource,
): GladiatorTraitDefinition | null {
  const totalWeight = definitions.reduce((total, definition) => total + definition.marketWeight, 0);

  if (totalWeight <= 0) {
    return null;
  }

  let roll = random() * totalWeight;

  for (const definition of definitions) {
    roll -= definition.marketWeight;

    if (roll <= 0) {
      return definition;
    }
  }

  return definitions[definitions.length - 1] ?? null;
}

function pickMarketTrait(
  definitions: GladiatorTraitDefinition[],
  selectedTraits: GladiatorTraitDefinition[],
  random: RandomSource,
) {
  const candidates = definitions.filter((definition) => isTraitAllowed(definition, selectedTraits));

  return pickWeightedTrait(candidates, random);
}

function createGeneratedPermanentTraits(random: RandomSource) {
  const definitions = getMarketPermanentGladiatorTraitDefinitions();
  const selectedTraits: GladiatorTraitDefinition[] = [];
  const preferredPools = [
    definitions.filter((definition) => definition.marketPolarity === 'positive'),
    definitions.filter(
      (definition) =>
        definition.marketPolarity === 'negative' || definition.marketPolarity === 'mixed',
    ),
  ];

  for (const pool of preferredPools) {
    const trait = pickMarketTrait(pool, selectedTraits, random);

    if (trait) {
      selectedTraits.push(trait);
    }
  }

  while (selectedTraits.length < MARKET_GENERATION_CONFIG.generatedTraitCount) {
    const trait = pickMarketTrait(definitions, selectedTraits, random);

    if (!trait) {
      break;
    }

    selectedTraits.push(trait);
  }

  return selectedTraits
    .slice(0, MARKET_GENERATION_CONFIG.generatedTraitCount)
    .map((definition) => ({
      traitId: definition.id,
    }));
}

export function calculateGladiatorMarketPrice(gladiator: Gladiator) {
  const experienceSteps = Math.floor(
    gladiator.experience / MARKET_PRICING_CONFIG.priceExperienceStep,
  );
  const skillValue =
    GLADIATOR_SKILL_NAMES.reduce(
      (total, skill) => total + getGladiatorEffectiveSkill(gladiator, skill),
      0,
    ) * MARKET_PRICING_CONFIG.pricePerSkillPoint;
  const experienceValue = experienceSteps * MARKET_PRICING_CONFIG.pricePerExperienceStep;
  const reputationValue =
    Math.max(0, gladiator.reputation) * MARKET_PRICING_CONFIG.pricePerReputation;
  const recordValue =
    gladiator.wins * MARKET_PRICING_CONFIG.pricePerWin -
    gladiator.losses * MARKET_PRICING_CONFIG.pricePenaltyPerLoss;
  const traitMultiplier = clamp(
    1 + getGladiatorMarketPriceModifierPercent(gladiator) / 100,
    MARKET_PRICING_CONFIG.minimumTraitPriceMultiplier,
    MARKET_PRICING_CONFIG.maximumTraitPriceMultiplier,
  );
  const rawPrice =
    (MARKET_PRICING_CONFIG.basePrice +
      skillValue +
      experienceValue +
      reputationValue +
      recordValue) *
    traitMultiplier;

  return roundToNearest(
    Math.max(MARKET_PRICING_CONFIG.minimumPrice, rawPrice),
    MARKET_PRICING_CONFIG.priceRoundingStep,
  );
}

export function calculateGladiatorSaleValue(gladiator: Gladiator) {
  return Math.round(
    calculateGladiatorMarketPrice(gladiator) * MARKET_PRICING_CONFIG.saleValueMultiplier,
  );
}

export function generateMarketGladiators(
  year: number,
  week: number,
  random: RandomSource = Math.random,
): MarketGladiator[] {
  const nameOffset = pickIndex(GLADIATOR_NAMES.length, random);

  return Array.from({ length: MARKET_GENERATION_CONFIG.availableGladiatorCount }, (_, index) => {
    const id = `market-${year}-${week}-${index + 1}`;
    const stats = createGeneratedStats(random);
    const reputation = GLADIATOR_MARKET_DEFAULTS.reputation;
    const gladiator: Gladiator = {
      id,
      name: GLADIATOR_NAMES[(nameOffset + index) % GLADIATOR_NAMES.length],
      age: createGeneratedAge(random),
      strength: stats.strength,
      agility: stats.agility,
      defense: stats.defense,
      life: stats.life,
      experience: GLADIATOR_PROGRESSION_CONFIG.experienceByLevel[0],
      reputation,
      wins: GLADIATOR_MARKET_DEFAULTS.wins,
      losses: GLADIATOR_MARKET_DEFAULTS.losses,
      traits: createGeneratedPermanentTraits(random),
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
    experience: candidate.experience,
    reputation: candidate.reputation,
    wins: candidate.wins,
    losses: candidate.losses,
    traits: candidate.traits,
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
    save: refreshGameAlerts(synchronizePlanning(updateCurrentWeekSummary(nextSave))),
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
    save: refreshGameAlerts(synchronizePlanning(updateCurrentWeekSummary(nextSave))),
  };
}
