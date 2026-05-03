import { GAME_BALANCE } from './balance';

export const MARKET_CONFIG = {
  availableGladiatorCount: GAME_BALANCE.market.availableGladiatorCount,
  minAge: GAME_BALANCE.market.minAge,
  maxAge: GAME_BALANCE.market.maxAge,
  minGeneratedTotalStatPoints: GAME_BALANCE.market.minGeneratedTotalStatPoints,
  maxGeneratedTotalStatPoints: GAME_BALANCE.market.maxGeneratedTotalStatPoints,
  totalStatPoints: GAME_BALANCE.market.totalStatPoints,
  minGeneratedStat: GAME_BALANCE.market.minGeneratedStat,
  maxGeneratedStat: GAME_BALANCE.market.maxGeneratedStat,
  basePrice: GAME_BALANCE.market.basePrice,
  reputationPriceMultiplier: GAME_BALANCE.market.reputationPriceMultiplier,
  statPriceMultiplier: GAME_BALANCE.market.statPriceMultiplier,
  saleValueMultiplier: GAME_BALANCE.market.saleValueMultiplier,
} as const;
