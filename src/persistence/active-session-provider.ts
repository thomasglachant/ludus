import type { ScreenName } from '../app/routes';
import { normalizeGameSave, parseGameSave } from '../domain/saves/save-validation';
import type { GameSave } from '../domain/types';

const ACTIVE_SESSION_KEY = 'ludus:active-session';

const resumableScreens: ScreenName[] = ['ludus', 'market'];

export interface ActiveSessionSnapshot {
  hasUnsavedChanges: boolean;
  save: GameSave;
  screen: ScreenName;
}

function isResumableScreen(value: unknown): value is ScreenName {
  return typeof value === 'string' && resumableScreens.includes(value as ScreenName);
}

export class ActiveSessionProvider {
  loadSession(): ActiveSessionSnapshot | null {
    const rawSession = localStorage.getItem(ACTIVE_SESSION_KEY);

    if (!rawSession) {
      return null;
    }

    try {
      const parsed = JSON.parse(rawSession) as {
        hasUnsavedChanges?: unknown;
        save?: unknown;
        screen?: unknown;
      };
      const rawSave = parsed.save ? JSON.stringify(parsed.save) : '';
      const save = parseGameSave(rawSave);

      if (!save) {
        this.clearSession();
        return null;
      }

      return {
        hasUnsavedChanges: parsed.hasUnsavedChanges === true,
        save,
        screen: isResumableScreen(parsed.screen) ? parsed.screen : 'ludus',
      };
    } catch {
      this.clearSession();
      return null;
    }
  }

  writeSession(snapshot: ActiveSessionSnapshot): void {
    localStorage.setItem(
      ACTIVE_SESSION_KEY,
      JSON.stringify({
        hasUnsavedChanges: snapshot.hasUnsavedChanges,
        save: normalizeGameSave(snapshot.save),
        screen: isResumableScreen(snapshot.screen) ? snapshot.screen : 'ludus',
      }),
    );
  }

  clearSession(): void {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  }
}
