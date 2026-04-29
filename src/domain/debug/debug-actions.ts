import { GAME_BALANCE } from '../../game-data/balance';
import type { GameSave } from '../types';

export function adjustDebugTreasury(save: GameSave, amount: number): GameSave {
  return {
    ...save,
    ludus: {
      ...save.ludus,
      treasury: Math.max(GAME_BALANCE.economy.minimumTreasury, save.ludus.treasury + amount),
    },
  };
}
