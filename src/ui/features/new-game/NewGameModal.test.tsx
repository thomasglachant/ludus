// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { GameStoreValue } from '@/state/game-store-context';
import type { UiStoreValue } from '@/state/ui-store-context';
import { TooltipProvider } from '@/ui/shared/primitives/Tooltip';
import { NewGameModal } from './NewGameModal';

const createNewGame = vi.fn<GameStoreValue['createNewGame']>();
const useGameStoreMock = vi.fn<() => GameStoreValue>();
const useUiStoreMock = vi.fn<() => UiStoreValue>();

vi.mock('@/state/game-store-context', () => ({
  useGameStore: () => useGameStoreMock(),
}));

vi.mock('@/state/ui-store-context', () => ({
  useUiStore: () => useUiStoreMock(),
}));

function createGameStore(): GameStoreValue {
  return {
    currentSave: null,
    localSaves: [],
    demoSaves: [],
    isLoading: false,
    isSaving: false,
    hasUnsavedChanges: false,
    isGamePaused: false,
    isTimeControlLocked: false,
    debugTimeScale: 1,
    gameClockLabel: '08:00',
    lastSavedAt: null,
    errorKey: null,
    saveNoticeKey: null,
    refreshLocalSaves: vi.fn(),
    refreshDemoSaves: vi.fn(),
    createNewGame,
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
    archiveNotification: vi.fn(),
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
  };
}

function createUiStore(): UiStoreValue {
  return {
    activeModal: null,
    activeSurface: { kind: 'buildings' },
    modalStack: [],
    language: 'en',
    screen: 'mainMenu',
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
  };
}

function renderModal() {
  const container = document.createElement('div');
  const root = createRoot(container);

  document.body.append(container);

  act(() => {
    root.render(
      <TooltipProvider delayDuration={100}>
        <NewGameModal onClose={vi.fn()} />
      </TooltipProvider>,
    );
  });

  return { container, root };
}

function inputText(input: HTMLInputElement, value: string) {
  act(() => {
    const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;

    valueSetter?.call(input, value);
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  });
}

function click(element: HTMLElement) {
  act(() => {
    element.click();
  });
}

describe('NewGameModal', () => {
  let mountedRoots: Root[] = [];

  beforeEach(() => {
    createNewGame.mockResolvedValue();
    useGameStoreMock.mockReturnValue(createGameStore());
    useUiStoreMock.mockReturnValue(createUiStore());
    mountedRoots = [];
  });

  afterEach(() => {
    for (const root of mountedRoots) {
      act(() => root.unmount());
    }

    document.body.replaceChildren();
    vi.clearAllMocks();
  });

  it('submits the typed ludus name', () => {
    const { root } = renderModal();
    mountedRoots.push(root);

    const input = document.body.querySelector<HTMLInputElement>(
      '[data-testid="new-game-ludus-name"]',
    );
    const submit = document.body.querySelector<HTMLButtonElement>(
      '[data-testid="new-game-submit"]',
    );

    expect(input).not.toBeNull();
    expect(submit).not.toBeNull();

    inputText(input as HTMLInputElement, 'Ludus Magnus');
    click(submit as HTMLButtonElement);

    expect(createNewGame).toHaveBeenCalledWith({ ludusName: 'Ludus Magnus' });
  });
});
