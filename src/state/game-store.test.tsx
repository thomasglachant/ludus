// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDailyPlanBucketBudget } from '../domain/planning/planning-actions';
import { UiStoreContext, type UiStoreValue } from './ui-store-context';
import { GameStoreProvider } from './game-store';
import { useGameStore, type GameStoreValue } from './game-store-context';

function createUiStore(overrides: Partial<UiStoreValue> = {}): UiStoreValue {
  const modalStack = overrides.modalStack ?? [];

  return {
    activeModal: modalStack.at(-1) ?? null,
    activeSurface: { kind: 'buildings' },
    modalStack,
    language: 'en',
    screen: 'ludus',
    backModal: vi.fn(),
    closeModal: vi.fn(),
    closeAllModals: vi.fn(),
    closeContextSheet: vi.fn(),
    closeSurface: vi.fn(),
    openContextSheet: vi.fn(),
    openEntity: vi.fn(),
    openModal: vi.fn(),
    openConfirmModal: vi.fn(),
    openFormModal: vi.fn(),
    openSurface: vi.fn(),
    pushModal: vi.fn(),
    replaceModal: vi.fn(),
    resetSurface: vi.fn(),
    setLanguage: vi.fn(),
    navigate: vi.fn(),
    t: (key) => key,
    ...overrides,
  };
}

function StoreProbe({ onValue }: { onValue(value: GameStoreValue): void }) {
  onValue(useGameStore());

  return null;
}

async function renderStore(uiStoreOverrides: Partial<UiStoreValue> = {}) {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  let latestStore: GameStoreValue | null = null;

  await act(async () => {
    root.render(
      <UiStoreContext.Provider value={createUiStore(uiStoreOverrides)}>
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

async function startWeek(getStore: () => GameStoreValue) {
  await act(async () => {
    getStore().resolvePendingGameAction('startWeek');
  });
}

async function advanceGameClock(milliseconds = 1_000) {
  await act(async () => {
    vi.advanceTimersByTime(milliseconds);
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

  it('refreshes Dormitory alerts immediately after buying a Dormitory place', async () => {
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
      getStore().purchaseBuildingImprovement('dormitory', 'dormitoryExtraBunk1');
    });

    expect(getStore().currentSave!.planning.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'alert-dormitory-open-register',
          actionKind: 'openMarket',
          buildingId: 'dormitory',
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
          id: 'alert-dormitory-open-register',
        }),
      ]),
    );
    expect(getStore().currentSave!.updatedAt).toBe(updatedAt);
    expect(getStore().hasUnsavedChanges).toBe(false);

    cleanup(container, root);
  });
});

describe('GameStoreProvider game clock', () => {
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

  const runningSurfaceKinds = [
    'gladiators',
    'planning',
    'finance',
    'market',
    'notifications',
  ] as const;

  it.each(runningSurfaceKinds)('advances while the %s surface is active', async (surfaceKind) => {
    const { container, getStore, root } = await renderStore({
      activeSurface: { kind: surfaceKind },
    });

    await createGame(getStore);
    await startWeek(getStore);

    expect(getStore().isGamePaused).toBe(false);
    expect(getStore().gameClockLabel).toBe('00:00');

    await advanceGameClock();

    expect(getStore().gameClockLabel).toBe('00:30');

    cleanup(container, root);
  });

  it('advances while an ordinary modal is active', async () => {
    const modal = { id: 'game-menu-modal', kind: 'gameMenu' as const };
    const { container, getStore, root } = await renderStore({
      activeModal: modal,
      modalStack: [modal],
    });

    await createGame(getStore);
    await startWeek(getStore);

    expect(getStore().isGamePaused).toBe(false);

    await advanceGameClock();

    expect(getStore().gameClockLabel).toBe('00:30');

    cleanup(container, root);
  });

  it('stays stopped while manually paused', async () => {
    const { container, getStore, root } = await renderStore();

    await createGame(getStore);
    await startWeek(getStore);

    act(() => {
      getStore().toggleGamePause();
    });

    expect(getStore().isGamePaused).toBe(true);

    await advanceGameClock();

    expect(getStore().gameClockLabel).toBe('00:00');

    cleanup(container, root);
  });

  it('stays stopped while a pending action trigger locks time controls', async () => {
    const { container, getStore, root } = await renderStore();

    await createGame(getStore);

    expect(getStore().isGamePaused).toBe(true);
    expect(getStore().isTimeControlLocked).toBe(true);

    await advanceGameClock();

    expect(getStore().gameClockLabel).toBe('00:00');

    cleanup(container, root);
  });

  it('stays stopped during event flow', async () => {
    const { container, getStore, root } = await renderStore();

    await createGame(getStore);
    await startWeek(getStore);

    act(() => {
      const save = getStore().currentSave;

      if (!save) {
        throw new Error('Expected a current save');
      }

      save.time.phase = 'event';
      getStore().takeLoan('smallLoan');
    });

    expect(getStore().isGamePaused).toBe(true);

    await advanceGameClock();

    expect(getStore().gameClockLabel).toBe('00:00');

    cleanup(container, root);
  });
});
