export type GameStatus = 'active' | 'lost';

export interface LudusState {
  treasury: number;
  reputation: number;
  glory: number;
  security: number;
  happiness: number;
  rebellion: number;
  gameStatus: GameStatus;
}
