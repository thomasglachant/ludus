// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createInitialSave } from '../../domain/saves/create-initial-save';
import type { GameStoreValue } from '../../state/game-store-context';
import type { UiModalRequest, UiStoreValue } from '../../state/ui-store-context';
import { GameShell } from './GameShell';

const openModal = vi.fn<(request: UiModalRequest) => void>();
const navigate = vi.fn<UiStoreValue['navigate']>();
const useGameStoreMock = vi.fn<() => GameStoreValue>();
const useUiStoreMock = vi.fn<() => UiStoreValue>();

vi.mock('../../state/game-store-context', () => ({
  useGameStore: () => useGameStoreMock(),
}));

vi.mock('../../state/ui-store-context', () => ({
  useUiStore: () => useUiStoreMock(),
}));

vi.mock('../map/PixiLudusMap', () => ({
  PixiLudusMap: () => <div data-testid="pixi-ludus-map" />,
}));

function createTestSave() {
  return createInitialSave({
    ludusName: 'Test Ludus',
    saveId: 'test-save',
    createdAt: '2026-05-01T08:00:00.000Z',
  });
}

function createGameStore(): GameStoreValue {
  return {
    currentSave: createTestSave(),
    localSaves: [],
    demoSaves: [],
    isLoading: false,
    isSaving: false,
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
    buyMarketStaff: vi.fn(),
    sellStaff: vi.fn(),
    applyPlanningRecommendations: vi.fn(),
    updateDailyPlan: vi.fn(),
    updateDailyPlanBuildingActivitySelection: vi.fn(),
    resolveGameEventChoice: vi.fn(),
    triggerDebugDailyEvent: vi.fn(),
    adjustDebugTreasury: vi.fn(),
    markArenaCombatPresented: vi.fn(),
    completeSundayArenaDay: vi.fn(),
    advanceWeekStep: vi.fn(),
    takeLoan: vi.fn(),
    buyoutLoan: vi.fn(),
    assignStaffToBuilding: vi.fn(),
    clearError: vi.fn(),
  };
}

function createUiStore(): UiStoreValue {
  return {
    activeModal: null,
    modalStack: [],
    isPixiDebugEnabled: false,
    language: 'en',
    screen: 'ludus',
    backModal: vi.fn(),
    closeModal: vi.fn(),
    closeAllModals: vi.fn(),
    openModal,
    openConfirmModal: vi.fn(),
    openFormModal: vi.fn(),
    pushModal: vi.fn(),
    replaceModal: vi.fn(),
    togglePixiDebug: vi.fn(),
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

  it('opens primary macro panels from the bottom navigation', () => {
    click(getButton(container, 'bottom-navigation-weeklyPlanning'));
    click(getButton(container, 'bottom-navigation-finance'));
    click(getButton(container, 'bottom-navigation-buildingsList'));

    expect(openModal).toHaveBeenNthCalledWith(1, { kind: 'weeklyPlanning' });
    expect(openModal).toHaveBeenNthCalledWith(2, { kind: 'finance' });
    expect(openModal).toHaveBeenNthCalledWith(3, { kind: 'buildingsList' });
  });

  it('opens finances from the treasury button', () => {
    click(getButton(container, 'topbar-treasury'));

    expect(openModal).toHaveBeenCalledWith({ kind: 'finance' });
  });
});
