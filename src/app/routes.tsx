export type ScreenName = 'mainMenu' | 'newGame' | 'ludus';

export const GAME_SESSION_PATH = '/play';

export function getGameSessionPath(gameId: string) {
  return `${GAME_SESSION_PATH}/${encodeURIComponent(gameId)}`;
}

export function getGameIdFromGameSessionPath(pathname: string) {
  const gameId = pathname.match(/^\/play\/([^/]+)\/?$/)?.[1];

  if (!gameId) {
    return null;
  }

  try {
    return decodeURIComponent(gameId);
  } catch {
    return null;
  }
}

export function isGameSessionPath(pathname: string) {
  return getGameIdFromGameSessionPath(pathname) !== null;
}
