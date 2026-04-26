import { beforeEach, describe, expect, it } from 'vitest';
import { createInitialSave } from '../domain/saves/create-initial-save';
import { ActiveSessionProvider } from './active-session-provider';

describe('ActiveSessionProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('writes and loads the active browser session separately from local saves', () => {
    const provider = new ActiveSessionProvider();
    const save = createInitialSave({
      ownerName: 'Flavia',
      ludusName: 'Aquila',
      saveId: 'save-local',
      createdAt: '2026-04-25T12:00:00.000Z',
    });

    provider.writeSession({
      hasUnsavedChanges: true,
      save: {
        ...save,
        time: {
          ...save.time,
          speed: 2,
        },
      },
      screen: 'market',
    });

    expect(localStorage.getItem('ludus:save:save-local')).toBeNull();
    expect(provider.loadSession()).toMatchObject({
      hasUnsavedChanges: true,
      save: {
        saveId: 'save-local',
        time: {
          speed: 2,
        },
      },
      screen: 'market',
    });
  });

  it('clears corrupted active session data', () => {
    const provider = new ActiveSessionProvider();

    localStorage.setItem('ludus:active-session', '{');

    expect(provider.loadSession()).toBeNull();
    expect(localStorage.getItem('ludus:active-session')).toBeNull();
  });
});
