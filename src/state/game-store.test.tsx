import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UiStoreProvider } from './ui-store';
import { GameStoreProvider, useGameStore } from './game-store';

vi.mock('../config/features', () => ({
  featureFlags: {
    enableDebugUi: false,
    enableDemoMode: true,
  },
}));

function GameStoreHarness() {
  const store = useGameStore();

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
      <output data-testid="dirty">{String(store.hasUnsavedChanges)}</output>
      <output data-testid="saving">{String(store.isSaving)}</output>
      <output data-testid="last-saved">{store.lastSavedAt ?? ''}</output>
      <output data-testid="error">{store.errorKey ?? ''}</output>
      <output data-testid="notice">{store.saveNoticeKey ?? ''}</output>
      <output data-testid="save-id">{store.currentSave?.saveId ?? ''}</output>
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
    vi.restoreAllMocks();
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
  });

  it('treats demo saves as read-only save no-ops', async () => {
    const user = userEvent.setup();

    renderHarness();
    await user.click(screen.getByRole('button', { name: 'Load demo' }));
    await waitFor(() =>
      expect(screen.getByTestId('notice')).toHaveTextContent('demoMode.readOnlySaveNotice'),
    );

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByTestId('dirty')).toHaveTextContent('false');
    expect(screen.getByTestId('notice')).toHaveTextContent('demoMode.readOnlySaveNotice');
    expect(localStorage.getItem('ludus:save:demo-early-ludus')).toBeNull();
    expect(localStorage.getItem('ludus:save-index')).toBeNull();
  });
});
