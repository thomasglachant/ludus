// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createInitialSave } from '../../domain/saves/create-initial-save';
import type { GameStoreValue } from '../../state/game-store-context';
import type { LudusSurfaceState, UiModalRequest, UiStoreValue } from '../../state/ui-store-context';
import { GameShell } from './GameShell';

const openModal = vi.fn<(request: UiModalRequest) => void>();
const openSurface = vi.fn<(surface: LudusSurfaceState) => void>();
const navigate = vi.fn<UiStoreValue['navigate']>();
const useGameStoreMock = vi.fn<() => GameStoreValue>();
const useUiStoreMock = vi.fn<() => UiStoreValue>();

vi.mock('../../state/game-store-context', () => ({
  useGameStore: () => useGameStoreMock(),
}));

vi.mock('../../state/ui-store-context', () => ({
  useUiStore: () => useUiStoreMock(),
}));

function createTestSave() {
  const save = createInitialSave({
    ludusName: 'Test Ludus',
    saveId: 'test-save',
    createdAt: '2026-05-01T08:00:00.000Z',
  });
  const { pendingActionTrigger, ...time } = save.time;

  void pendingActionTrigger;

  return {
    ...save,
    time,
  };
}

function createGameStore(overrides: Partial<GameStoreValue> = {}): GameStoreValue {
  return {
    currentSave: createTestSave(),
    localSaves: [],
    demoSaves: [],
    isLoading: false,
    isSaving: false,
    isGamePaused: false,
    isTimeControlLocked: false,
    debugTimeScale: 1,
    gameClockLabel: '08:00',
    hasUnsavedChanges: false,
    lastSavedAt: null,
    errorKey: null,
    saveNoticeKey: null,
    refreshLocalSaves: vi.fn(),
    refreshDemoSaves: vi.fn(),
    createNewGame: vi.fn(),
    loadLocalSave: vi.fn(),
    loadDemoSave: vi.fn(),
    resetActiveDemo: vi.fn(),
    saveCurrentGame: vi.fn(),
    changeLanguage: vi.fn(),
    purchaseBuilding: vi.fn(),
    purchaseBuildingImprovement: vi.fn(),
    purchaseBuildingSkill: vi.fn(),
    selectBuildingPolicy: vi.fn(),
    upgradeBuilding: vi.fn(),
    buyMarketGladiator: vi.fn(),
    sellGladiator: vi.fn(),
    allocateGladiatorSkillPoint: vi.fn(),
    updateDailyPlan: vi.fn(),
    updateDailyPlanBuildingActivitySelection: vi.fn(),
    resolveGameEventChoice: vi.fn(),
    triggerDebugDailyEvent: vi.fn(),
    adjustDebugTreasury: vi.fn(),
    levelUpDebugGladiator: vi.fn(),
    createDebugInjuryAlert: vi.fn(),
    advanceDebugToDay: vi.fn(),
    setDebugTimeScale: vi.fn(),
    completeSundayArenaDay: vi.fn(),
    advanceWeekStep: vi.fn(),
    resolvePendingGameAction: vi.fn(),
    toggleGamePause: vi.fn(),
    takeLoan: vi.fn(),
    buyoutLoan: vi.fn(),
    clearError: vi.fn(),
    ...overrides,
  };
}

function createUiStore(): UiStoreValue {
  return {
    activeModal: null,
    activeSurface: { kind: 'buildings' },
    modalStack: [],
    language: 'en',
    screen: 'ludus',
    backModal: vi.fn(),
    closeModal: vi.fn(),
    closeAllModals: vi.fn(),
    closeContextSheet: vi.fn(),
    closeSurface: vi.fn(),
    openContextSheet: vi.fn(),
    openEntity: vi.fn(),
    openModal,
    openConfirmModal: vi.fn(),
    openFormModal: vi.fn(),
    openSurface,
    pushModal: vi.fn(),
    replaceModal: vi.fn(),
    resetSurface: vi.fn(),
    setLanguage: vi.fn(),
    navigate,
    t: (key, params) => (params ? `${key}:${JSON.stringify(params)}` : key),
  };
}

function getButton(container: HTMLElement, testId: string): HTMLButtonElement {
  const button = container.querySelector<HTMLButtonElement>(`[data-testid="${testId}"]`);

  if (!button) {
    throw new Error(`Missing button ${testId}`);
  }

  return button;
}

function click(button: HTMLButtonElement) {
  act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

describe('GameShell smoke flows', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    openModal.mockClear();
    openSurface.mockClear();
    navigate.mockClear();
    useGameStoreMock.mockReturnValue(createGameStore());
    useUiStoreMock.mockReturnValue(createUiStore());

    act(() => {
      root.render(<GameShell />);
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('opens primary surfaces from the bottom navigation', () => {
    expect(container.querySelector('[data-testid="bottom-navigation-events"]')).toBeNull();

    click(getButton(container, 'bottom-navigation-planning'));
    click(getButton(container, 'bottom-navigation-finance'));
    click(getButton(container, 'bottom-navigation-buildings'));
    click(getButton(container, 'bottom-navigation-market'));

    expect(openSurface).toHaveBeenNthCalledWith(1, { kind: 'planning' });
    expect(openSurface).toHaveBeenNthCalledWith(2, { kind: 'finance' });
    expect(openSurface).toHaveBeenNthCalledWith(3, { kind: 'buildings' });
    expect(openSurface).toHaveBeenNthCalledWith(4, { kind: 'market' });
  });

  it('opens finance surface from the treasury button', () => {
    click(getButton(container, 'topbar-treasury'));

    expect(openSurface).toHaveBeenCalledWith({ kind: 'finance' });
  });

  it('does not render the legacy building efficiency metric in the overview', () => {
    expect(container.textContent).not.toContain('buildingsOverview.efficiencyValue');
    expect(container.textContent).not.toContain('buildingPanel.efficiency');
  });

  it('renders the pending start week action and hides manual time controls', () => {
    const resolvePendingGameAction = vi.fn();
    const save = {
      ...createTestSave(),
      time: {
        ...createTestSave().time,
        pendingActionTrigger: 'startWeek' as const,
      },
    };

    useGameStoreMock.mockReturnValue(
      createGameStore({
        currentSave: save,
        gameClockLabel: '00:00',
        isGamePaused: true,
        isTimeControlLocked: true,
        resolvePendingGameAction,
      }),
    );

    act(() => {
      root.render(<GameShell />);
    });

    expect(container.querySelector('[data-testid="topbar-pause-button"]')).toBeNull();
    expect(container.textContent).toContain('gameActionDock.startWeekTitle');
    expect(container.textContent).toContain('gameActionDock.startWeekDescription');

    click(getButton(container, 'game-action-dock-startWeek'));

    expect(resolvePendingGameAction).toHaveBeenCalledWith('startWeek');
  });

  it('renders the pending arena action', () => {
    const resolvePendingGameAction = vi.fn();
    const save = {
      ...createTestSave(),
      time: {
        ...createTestSave().time,
        dayOfWeek: 'sunday' as const,
        phase: 'arena' as const,
        pendingActionTrigger: 'enterArena' as const,
      },
    };

    useGameStoreMock.mockReturnValue(
      createGameStore({
        currentSave: save,
        gameClockLabel: '00:00',
        isGamePaused: true,
        isTimeControlLocked: true,
        resolvePendingGameAction,
      }),
    );

    act(() => {
      root.render(<GameShell />);
    });

    expect(container.textContent).toContain('gameActionDock.enterArenaTitle');
    expect(container.textContent).toContain('gameActionDock.enterArenaDescription');

    click(getButton(container, 'game-action-dock-enterArena'));

    expect(resolvePendingGameAction).toHaveBeenCalledWith('enterArena');
  });
});
