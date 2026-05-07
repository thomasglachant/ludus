export const GAME_STATUSES = ['active', 'lost'] as const;

export type GameStatus = (typeof GAME_STATUSES)[number];

export interface LudusState {
  treasury: number;
  reputation: number;
  happiness: number;
  rebellion: number;
  gameStatus: GameStatus;
}
