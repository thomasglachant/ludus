import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UiStoreProvider, useUiStore } from './ui-store';
import { GameStoreProvider, useGameStore } from './game-store';

vi.mock('../config/features', () => ({
  featureFlags: {
    enableDebugUi: false,
    enableDemoMode: true,
  },
}));

function GameStoreHarness() {
  const store = useGameStore();
  const uiStore = useUiStore();

  return (
    <div>
      <button
        type="button"
        onClick={() => void store.createNewGame({ ludusName: 'Test Ludus', ownerName: 'Marcus' })}
      >
        Create
      </button>
      <button type="button" onClick={() => store.setGameSpeed(2)}>
        Change speed
      </button>
      <button type="button" onClick={() => store.setGameSpeed(0)}>
        Stop speed
      </button>
      <button type="button" onClick={() => void store.saveCurrentGame()}>
        Save
      </button>
      <button
        type="button"
        onClick={() => void store.loadLocalSave(store.currentSave?.saveId ?? '')}
      >
        Load local
      </button>
      <button type="button" onClick={() => void store.loadDemoSave('demo-early-ludus')}>
        Load demo
      </button>
      <button type="button" onClick={() => void store.changeLanguage('fr')}>
        Change language
      </button>
      <output data-testid="dirty">{String(store.hasUnsavedChanges)}</output>
      <output data-testid="saving">{String(store.isSaving)}</output>
      <output data-testid="last-saved">{store.lastSavedAt ?? ''}</output>
      <output data-testid="error">{store.errorKey ?? ''}</output>
      <output data-testid="notice">{store.saveNoticeKey ?? ''}</output>
      <output data-testid="save-id">{store.currentSave?.saveId ?? ''}</output>
      <output data-testid="speed">{store.currentSave?.time.speed ?? ''}</output>
      <output data-testid="screen">{uiStore.screen}</output>
      <output data-testid="language">{uiStore.language}</output>
    </div>
  );
}

function renderHarness() {
  return render(
    <UiStoreProvider>
      <GameStoreProvider>
        <GameStoreHarness />
      </GameStoreProvider>
    </UiStoreProvider>,
  );
}

async function createGame(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Create' }));
  await waitFor(() => expect(screen.getByTestId('save-id')).not.toHaveTextContent(''));
}

describe('GameStore save UI state', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/');
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts a newly created game as clean with a last saved timestamp', async () => {
    const user = userEvent.setup();

    renderHarness();

    await createGame(user);

    expect(screen.getByTestId('dirty')).toHaveTextContent('false');
    expect(screen.getByTestId('last-saved')).not.toHaveTextContent('');
  });

  it('marks player actions as dirty', async () => {
    const user = userEvent.setup();

    renderHarness();
    await createGame(user);
    await user.click(screen.getByRole('button', { name: 'Change speed' }));

    expect(screen.getByTestId('dirty')).toHaveTextContent('true');
  });

  it('clears dirty state after a successful save', async () => {
    const user = userEvent.setup();

    renderHarness();
    await createGame(user);
    await user.click(screen.getByRole('button', { name: 'Change speed' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(screen.getByTestId('dirty')).toHaveTextContent('false'));
    expect(screen.getByTestId('notice')).toHaveTextContent('ludus.saveSuccess');
    expect(screen.getByTestId('speed')).toHaveTextContent('2');

    const saveId = screen.getByTestId('save-id').textContent ?? '';
    const storedSave = JSON.parse(localStorage.getItem(`ludus:save:${saveId}`) ?? '{}') as {
      time?: { speed?: number };
    };

    expect(storedSave.time?.speed).toBe(1);
  });

  it('automatically saves dirty local games on the autosave interval', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderHarness();
    await createGame(user);

    const saveId = screen.getByTestId('save-id').textContent ?? '';

    await user.click(screen.getByRole('button', { name: 'Stop speed' }));
    expect(screen.getByTestId('dirty')).toHaveTextContent('true');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });

    await waitFor(() => expect(screen.getByTestId('dirty')).toHaveTextContent('false'));

    const storedSave = JSON.parse(localStorage.getItem(`ludus:save:${saveId}`) ?? '{}') as {
      time?: { speed?: number };
    };

    expect(storedSave.time?.speed).toBe(1);
    expect(screen.getByTestId('last-saved')).not.toHaveTextContent('');
  });

  it('keeps dirty state and exposes an error when save fails', async () => {
    const user = userEvent.setup();

    renderHarness();
    await createGame(user);
    await user.click(screen.getByRole('button', { name: 'Change speed' }));
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('ludus.saveError'));
    expect(screen.getByTestId('dirty')).toHaveTextContent('true');
  });

  it('loads a local save as clean', async () => {
    const user = userEvent.setup();

    renderHarness();
    await createGame(user);
    await user.click(screen.getByRole('button', { name: 'Change speed' }));
    expect(screen.getByTestId('dirty')).toHaveTextContent('true');

    await user.click(screen.getByRole('button', { name: 'Load local' }));

    await waitFor(() => expect(screen.getByTestId('dirty')).toHaveTextContent('false'));
    expect(screen.getByTestId('speed')).toHaveTextContent('1');
  });

  it('restores the active browser session after a remount', async () => {
    const user = userEvent.setup();

    const { unmount } = renderHarness();
    await createGame(user);
    await waitFor(() => expect(screen.getByTestId('screen')).toHaveTextContent('ludus'));

    const saveId = screen.getByTestId('save-id').textContent ?? '';

    await user.click(screen.getByRole('button', { name: 'Change speed' }));
    await waitFor(() => {
      const rawSession = localStorage.getItem('ludus:active-session');
      const session = rawSession
        ? (JSON.parse(rawSession) as { save?: { time?: { speed?: number } } })
        : null;

      expect(session?.save?.time?.speed).toBe(2);
    });

    unmount();
    renderHarness();

    await waitFor(() => expect(screen.getByTestId('save-id')).toHaveTextContent(saveId));
    await waitFor(() => expect(screen.getByTestId('screen')).toHaveTextContent('ludus'));
    expect(screen.getByTestId('dirty')).toHaveTextContent('true');
    expect(screen.getByTestId('speed')).toHaveTextContent('2');
  });

  it('throttles active browser session writes while game time is ticking', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const setItemSpy = vi.spyOn(localStorage, 'setItem');

    renderHarness();
    await createGame(user);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });

    setItemSpy.mockClear();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });

    const activeSessionWrites = setItemSpy.mock.calls.filter(
      ([key]) => key === 'ludus:active-session',
    );

    expect(activeSessionWrites).toHaveLength(1);
  });

  it('starts demo templates as normal local saves', async () => {
    const user = userEvent.setup();

    renderHarness();
    await user.click(screen.getByRole('button', { name: 'Load demo' }));
    await waitFor(() => expect(screen.getByTestId('save-id')).not.toHaveTextContent(''));

    const saveId = screen.getByTestId('save-id').textContent ?? '';

    expect(saveId).not.toBe('demo-early-ludus');
    expect(screen.getByTestId('dirty')).toHaveTextContent('false');
    expect(screen.getByTestId('notice')).toHaveTextContent('');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(screen.getByTestId('notice')).toHaveTextContent('ludus.saveSuccess'),
    );
    expect(localStorage.getItem(`ludus:save:${saveId}`)).not.toBeNull();
  });

  it('changes language as browser UI preference without updating save data', async () => {
    const user = userEvent.setup();

    renderHarness();
    await createGame(user);

    const saveId = screen.getByTestId('save-id').textContent ?? '';
    const storedSaveBeforeChange = localStorage.getItem(`ludus:save:${saveId}`);

    await user.click(screen.getByRole('button', { name: 'Change language' }));

    expect(screen.getByTestId('language')).toHaveTextContent('fr');
    expect(screen.getByTestId('dirty')).toHaveTextContent('false');
    expect(localStorage.getItem('ludus:language')).toBe('fr');
    expect(localStorage.getItem(`ludus:save:${saveId}`)).toBe(storedSaveBeforeChange);
  });
});
