// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameStoreValue } from '../../state/game-store-context';
import type { UiStoreValue } from '../../state/ui-store-context';
import { createInitialSave } from '../../domain/saves/create-initial-save';
import type { Gladiator } from '../../domain/types';
import { DebugOverlay } from './DebugOverlay';

vi.mock('../../config/features', () => ({
  featureFlags: {
    enableDebugUi: true,
  },
}));

const useGameStoreMock = vi.fn<() => GameStoreValue>();
const useUiStoreMock = vi.fn<() => UiStoreValue>();

vi.mock('../../state/game-store-context', () => ({
  useGameStore: () => useGameStoreMock(),
}));

vi.mock('../../state/ui-store-context', () => ({
  useUiStore: () => useUiStoreMock(),
}));

function createGladiator(overrides: Partial<Gladiator> = {}): Gladiator {
  return {
    id: 'gladiator-test',
    name: 'Aulus',
    age: 20,
    experience: 90,
    strength: 3,
    agility: 3,
    defense: 2,
    life: 2,
    reputation: 0,
    wins: 0,
    losses: 0,
    traits: [],
    ...overrides,
  };
}

function createTestSave() {
  const save = createInitialSave({
    ludusName: 'Test Ludus',
    saveId: 'test-save',
    createdAt: '2026-05-01T08:00:00.000Z',
  });

  return {
    ...save,
    gladiators: [createGladiator()],
  };
}

function createGameStore(overrides: Partial<GameStoreValue> = {}): GameStoreValue {
  return {
    currentSave: createTestSave(),
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
  const labels: Record<string, string> = {
    'common.back': 'Back',
    'common.close': 'Close',
    'common.emptyList': 'Empty',
    'debug.title': 'Debug',
    'debug.ariaLabel': 'Debug tools',
    'debug.treasury': 'Treasury',
    'debug.levelUpGladiator': 'Level Up Gladiator',
    'debug.injuryAlert': 'Injury Alert',
    'debug.advanceToDay': 'Advance To Day',
    'debug.timeSpeed': 'Time Speed',
  };

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
    openModal: vi.fn(),
    openConfirmModal: vi.fn(),
    openFormModal: vi.fn(),
    openSurface: vi.fn(),
    pushModal: vi.fn(),
    replaceModal: vi.fn(),
    resetSurface: vi.fn(),
    setLanguage: vi.fn(),
    navigate: vi.fn(),
    t: (key, params) => {
      if (key.startsWith('days.')) {
        return key.replace('days.', '');
      }

      if (key === 'debug.gladiatorLevelUpOption') {
        return `${params?.name} ${params?.level}->${params?.nextLevel}`;
      }

      if (key === 'debug.advanceToDayOption') {
        return String(params?.day);
      }

      if (key === 'debug.injuryAlertOption') {
        return String(params?.name);
      }

      if (key === 'debug.timeSpeedOption') {
        return `x${params?.multiplier}`;
      }

      return labels[key] ?? key;
    },
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

describe('DebugOverlay', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    useUiStoreMock.mockReturnValue(createUiStore());
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.clearAllMocks();
  });

  function renderOverlay(store = createGameStore()) {
    useGameStoreMock.mockReturnValue(store);

    act(() => {
      root.render(<DebugOverlay />);
    });

    click(container.querySelector<HTMLButtonElement>('button')!);

    return store;
  }

  it('shows the debug enhancement categories', () => {
    renderOverlay();

    expect(getButton(container, 'debug-item-level-up-gladiator').textContent).toBe(
      'Level Up Gladiator',
    );
    expect(getButton(container, 'debug-item-injury-alert').textContent).toBe('Injury Alert');
    expect(getButton(container, 'debug-item-advance-to-day').textContent).toBe('Advance To Day');
    expect(getButton(container, 'debug-item-time-speed').textContent).toBe('Time Speed');
  });

  it('levels up a selected gladiator from the debug menu', () => {
    const levelUpDebugGladiator = vi.fn();
    const store = renderOverlay(createGameStore({ levelUpDebugGladiator }));

    click(getButton(container, 'debug-item-level-up-gladiator'));
    click(
      getButton(container, `debug-item-level-up-gladiator-${store.currentSave!.gladiators[0].id}`),
    );

    expect(levelUpDebugGladiator).toHaveBeenCalledWith('gladiator-test');
  });

  it('advances to the selected day from the debug menu', () => {
    const advanceDebugToDay = vi.fn();
    renderOverlay(createGameStore({ advanceDebugToDay }));

    click(getButton(container, 'debug-item-advance-to-day'));
    click(getButton(container, 'debug-item-advance-to-day-wednesday'));

    expect(advanceDebugToDay).toHaveBeenCalledWith('wednesday');
  });

  it('creates an injury alert for a selected gladiator from the debug menu', () => {
    const createDebugInjuryAlert = vi.fn();
    const store = renderOverlay(createGameStore({ createDebugInjuryAlert }));

    click(getButton(container, 'debug-item-injury-alert'));
    click(getButton(container, `debug-item-injury-alert-${store.currentSave!.gladiators[0].id}`));

    expect(createDebugInjuryAlert).toHaveBeenCalledWith('gladiator-test');
  });

  it('marks and applies the selected time speed multiplier', () => {
    const setDebugTimeScale = vi.fn();
    renderOverlay(createGameStore({ debugTimeScale: 4, setDebugTimeScale }));

    click(getButton(container, 'debug-item-time-speed'));

    const speedButton = getButton(container, 'debug-item-time-speed-4');

    expect(speedButton.getAttribute('aria-pressed')).toBe('true');
    expect(speedButton.classList.contains('is-selected')).toBe(true);

    click(speedButton);

    expect(setDebugTimeScale).toHaveBeenCalledWith(4);
  });
});
