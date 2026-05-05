// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDailyPlanBucketBudget } from '../domain/planning/planning-actions';
import { UiStoreContext, type UiStoreValue } from './ui-store-context';
import { GameStoreProvider } from './game-store';
import { useGameStore, type GameStoreValue } from './game-store-context';

function createUiStore(): UiStoreValue {
  return {
    activeModal: null,
    modalStack: [],
    language: 'en',
    screen: 'ludus',
    backModal: vi.fn(),
    closeModal: vi.fn(),
    closeAllModals: vi.fn(),
    openModal: vi.fn(),
    openConfirmModal: vi.fn(),
    openFormModal: vi.fn(),
    pushModal: vi.fn(),
    replaceModal: vi.fn(),
    setLanguage: vi.fn(),
    navigate: vi.fn(),
    t: (key) => key,
  };
}

function StoreProbe({ onValue }: { onValue(value: GameStoreValue): void }) {
  onValue(useGameStore());

  return null;
}

async function renderStore() {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  let latestStore: GameStoreValue | null = null;

  await act(async () => {
    root.render(
      <UiStoreContext.Provider value={createUiStore()}>
        <GameStoreProvider>
          <StoreProbe
            onValue={(value) => {
              latestStore = value;
            }}
          />
        </GameStoreProvider>
      </UiStoreContext.Provider>,
    );
  });

  return {
    container,
    getStore() {
      if (!latestStore) {
        throw new Error('Game store was not rendered');
      }

      return latestStore;
    },
    root,
  };
}

async function createGame(getStore: () => GameStoreValue) {
  await act(async () => {
    await getStore().createNewGame({ ludusName: 'Ludus Magnus' });
  });
}

function cleanup(container: HTMLElement, root: Root) {
  act(() => {
    root.unmount();
  });
  container.remove();
}

describe('GameStoreProvider alerts refresh', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-01T08:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('refreshes Domus alerts immediately after a Domus upgrade', async () => {
    const { container, getStore, root } = await renderStore();
    await createGame(getStore);
    const candidateId = getStore().currentSave!.market.availableGladiators[0].id;

    act(() => {
      getStore().buyMarketGladiator(candidateId);
    });

    expect(
      getStore().currentSave!.planning.alerts.some((alert) => alert.actionKind === 'openMarket'),
    ).toBe(false);

    act(() => {
      getStore().takeLoan('smallLoan');
      getStore().upgradeBuilding('domus');
    });

    expect(getStore().currentSave!.planning.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'alert-domus-open-register',
          actionKind: 'openMarket',
          buildingId: 'domus',
        }),
      ]),
    );

    cleanup(container, root);
  });

  it('refreshes planning alerts immediately after planning updates', async () => {
    const { container, getStore, root } = await renderStore();
    await createGame(getStore);
    const candidateId = getStore().currentSave!.market.availableGladiators[0].id;

    act(() => {
      getStore().buyMarketGladiator(candidateId);
    });

    expect(getStore().currentSave!.planning.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'alert-weekly-planning-empty',
        }),
      ]),
    );

    for (const dayOfWeek of [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ] as const) {
      const budget = getDailyPlanBucketBudget(getStore().currentSave!, 'gladiatorTimePoints');

      act(() => {
        getStore().updateDailyPlan({
          activity: 'training',
          bucket: 'gladiatorTimePoints',
          dayOfWeek,
          points: budget,
        });
      });
    }

    expect(
      getStore().currentSave!.planning.alerts.some(
        (alert) => alert.actionKind === 'openWeeklyPlanning',
      ),
    ).toBe(false);

    cleanup(container, root);
  });

  it('refreshes alerts periodically without marking the save dirty', async () => {
    const { container, getStore, root } = await renderStore();
    await createGame(getStore);
    const save = getStore().currentSave!;
    const updatedAt = save.updatedAt;

    save.planning.alerts = [];

    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    expect(getStore().currentSave!.planning.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'alert-domus-open-register',
        }),
      ]),
    );
    expect(getStore().currentSave!.updatedAt).toBe(updatedAt);
    expect(getStore().hasUnsavedChanges).toBe(false);

    cleanup(container, root);
  });
});
