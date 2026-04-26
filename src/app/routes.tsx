export type ScreenName = 'mainMenu' | 'newGame' | 'ludus';

export const GAME_SESSION_PATH = '/play';

export function isGameSessionPath(pathname: string) {
  return pathname === GAME_SESSION_PATH || pathname === `${GAME_SESSION_PATH}/`;
}
