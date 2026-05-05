import { GAME_BALANCE } from './balance';

export const MARKET_CONFIG = {
  availableGladiatorCount: GAME_BALANCE.market.availableGladiatorCount,
  minAge: GAME_BALANCE.market.minAge,
  maxAge: GAME_BALANCE.market.maxAge,
  minimumPrice: GAME_BALANCE.market.minimumPrice,
  priceExperienceStep: GAME_BALANCE.market.priceExperienceStep,
  pricePerExperienceStep: GAME_BALANCE.market.pricePerExperienceStep,
  saleValueMultiplier: GAME_BALANCE.market.saleValueMultiplier,
} as const;
