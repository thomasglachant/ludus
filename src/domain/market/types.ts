import type { Gladiator } from '../gladiators/types';

export interface MarketState {
  week: number;
  year: number;
  availableGladiators: MarketGladiator[];
}

export interface MarketGladiator extends Gladiator {
  price: number;
}
