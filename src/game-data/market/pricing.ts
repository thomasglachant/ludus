export const MARKET_PRICING_CONFIG = {
  // Base denarii value before stats, record, reputation and traits are applied.
  basePrice: 100,
  // Technical lower clamp for generated prices.
  minimumPrice: 50,
  // Denarii added for each effective skill point.
  pricePerSkillPoint: 20,
  // Cumulative XP step used by the market price scale.
  priceExperienceStep: 100,
  // Denarii added to purchase price for each XP step.
  pricePerExperienceStep: 25,
  // Denarii added for each gladiator reputation point.
  pricePerReputation: 4,
  // Denarii added for each recorded victory.
  pricePerWin: 35,
  // Denarii removed for each recorded defeat.
  pricePenaltyPerLoss: 20,
  // Smallest denarii increment used for market prices.
  priceRoundingStep: 5,
  // Lower clamp for the combined permanent-trait price multiplier.
  minimumTraitPriceMultiplier: 0.6,
  // Upper clamp for the combined permanent-trait price multiplier.
  maximumTraitPriceMultiplier: 1.6,
  // Fraction of market price returned when selling a gladiator.
  saleValueMultiplier: 0.75,
} as const;
