export type ScreenName = 'mainMenu' | 'newGame' | 'ludus' | 'arena';

export const GAME_SESSION_PATH = '/play';

export function getGameSessionPath(gameId: string) {
  return `${GAME_SESSION_PATH}/${encodeURIComponent(gameId)}`;
}

export function getArenaSessionPath(gameId: string) {
  return `${getGameSessionPath(gameId)}/arena`;
}

export function getGameSessionRoute(pathname: string) {
  const route = pathname.match(/^\/play\/([^/]+)(?:\/(arena))?\/?$/);

  if (!route) {
    return null;
  }

  try {
    return {
      gameId: decodeURIComponent(route[1]),
      screen: route[2] === 'arena' ? ('arena' as const) : ('ludus' as const),
    };
  } catch {
    return null;
  }
}

export function getGameIdFromGameSessionPath(pathname: string) {
  return getGameSessionRoute(pathname)?.gameId ?? null;
}

export function isGameSessionPath(pathname: string) {
  return getGameIdFromGameSessionPath(pathname) !== null;
}
