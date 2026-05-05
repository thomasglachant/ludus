import {
  adjustDebugTreasury as adjustDebugTreasuryAction,
  advanceDebugToDay as advanceDebugToDayAction,
  createDebugInjuryAlert as createDebugInjuryAlertAction,
  levelUpDebugGladiator as levelUpDebugGladiatorAction,
} from '../domain/debug/debug-actions';
import {
  resolveGameEventChoice as resolveGameEventChoiceAction,
  triggerDebugDailyEvent as triggerDebugDailyEventAction,
} from '../domain/events/event-actions';
import {
  buyoutLoan as buyoutLoanAction,
  takeLoan as takeLoanAction,
} from '../domain/economy/economy-actions';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { getGameSessionRoute } from '../app/routes';
import { featureFlags } from '../config/features';
import { refreshGameAlerts } from '../domain/alerts/alert-actions';
import {
  purchaseBuilding,
  purchaseBuildingImprovement,
  purchaseBuildingSkill,
  selectBuildingPolicy,
  upgradeBuilding,
} from '../domain/buildings/building-actions';
import { buyMarketGladiator, sellGladiator } from '../domain/market/market-actions';
import {
  completeSundayArenaDay as completeSundayArenaDayAction,
  resolvePendingGameAction as resolvePendingGameActionAction,
  resolveWeekStep,
  synchronizeEconomyProjection,
} from '../domain/weekly-simulation/weekly-simulation-actions';
import {
  updateDailyPlanBuildingActivitySelection as updateDailyPlanBuildingActivitySelectionAction,
  updateDailyPlan as updateDailyPlanAction,
  synchronizePlanning,
} from '../domain/planning/planning-actions';
import { getActiveGameInterruption } from '../domain/game-flow/interruption';
import { allocateGladiatorSkillPoint as allocateGladiatorSkillPointAction } from '../domain/gladiators/progression';
import { pruneExpiredStatusEffects } from '../domain/status-effects/status-effect-actions';
import type { GladiatorSkillName } from '../domain/gladiators/skills';
import type {
  BuildingId,
  DemoSaveId,
  GameSave,
  GameSaveMetadata,
  LanguageCode,
  LoanId,
  PendingActionTrigger,
  DayOfWeek,
  DailyPlanBuildingActivitySelectionUpdate,
  DailyPlanUpdate,
} from '../domain/types';
import { CloudSaveProvider } from '../persistence/cloud-save-provider';
import { DemoSaveProvider } from '../persistence/demo-save-provider';
import { LocalSaveProvider } from '../persistence/local-save-provider';
import { SaveService } from '../persistence/save-service';
import { GameStoreContext, type GameStoreValue, type NewGameInput } from './game-store-context';
import { useUiStore } from './ui-store-context';
import { GAME_BALANCE } from '../game-data/balance';

const AUTO_SAVE_INTERVAL_MS = 30_000;
const ALERT_REFRESH_INTERVAL_MS = 5_000;
const GAME_CLOCK_INTERVAL_MS = 1_000;
const GAME_CLOCK_START_MINUTES = GAME_BALANCE.time.dayStartHour * 60;
const GAME_CLOCK_END_MINUTES = GAME_BALANCE.time.dayEndHour * 60;

function createSaveService() {
  return new SaveService(
    new LocalSaveProvider(),
    new CloudSaveProvider(),
    featureFlags.enableDemoMode ? new DemoSaveProvider() : undefined,
  );
}

function synchronizeDerivedSave(save: GameSave): GameSave {
  return refreshGameAlerts(synchronizeEconomyProjection(synchronizePlanning(save)));
}

function synchronizeLoadedSave(save: GameSave): GameSave {
  return synchronizeDerivedSave(pruneExpiredStatusEffects(save));
}

export function GameStoreProvider({ children }: { children: ReactNode }) {
  const {
    activeModal,
    activeSurface,
    closeAllModals,
    modalStack,
    screen,
    setLanguage,
    navigate,
    openModal,
    pushModal,
  } = useUiStore();
  const [saveService] = useState(createSaveService);
  const [initialRoute] = useState(() => getGameSessionRoute(window.location.pathname));
  const initialRouteGameId = initialRoute?.gameId;
  const initialRouteScreen = initialRoute?.screen ?? 'ludus';
  const [currentSave, setCurrentSave] = useState<GameSave | null>(null);
  const [localSaves, setLocalSaves] = useState<GameSaveMetadata[]>([]);
  const [demoSaves, setDemoSaves] = useState<GameSaveMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGamePaused, setIsGamePaused] = useState(false);
  const [debugTimeScale, setDebugTimeScaleState] = useState(1);
  const [gameClockMinutes, setGameClockMinutes] = useState(GAME_CLOCK_START_MINUTES);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [saveNoticeKey, setSaveNoticeKey] = useState<string | null>(null);
  const hasLoadedInitialRouteGame = useRef(false);
  const currentSaveRef = useRef<GameSave | null>(null);
  const activeModalRef = useRef(activeModal);
  const activeSurfaceRef = useRef(activeSurface);
  const isGamePausedRef = useRef(isGamePaused);
  const hasUnsavedChangesRef = useRef(false);
  const isSavingRef = useRef(false);
  const isAutoSavingRef = useRef(false);
  const dirtyRevisionRef = useRef(0);

  const refreshLocalSaves = useCallback(async () => {
    setIsLoading(true);
    setErrorKey(null);

    try {
      setLocalSaves(await saveService.listLocalSaves());
    } catch {
      setErrorKey('loadGame.error');
    } finally {
      setIsLoading(false);
    }
  }, [saveService]);

  const refreshDemoSaves = useCallback(async () => {
    if (!featureFlags.enableDemoMode) {
      setDemoSaves([]);
      return;
    }

    setIsLoading(true);
    setErrorKey(null);

    try {
      setDemoSaves(await saveService.listDemoSaves());
    } catch {
      setErrorKey('loadGame.error');
    } finally {
      setIsLoading(false);
    }
  }, [saveService]);

  const createNewGame = useCallback(
    async (input: NewGameInput) => {
      setIsLoading(true);
      setErrorKey(null);

      try {
        const save = await saveService.createLocalSave({
          ludusName: input.ludusName,
        });

        dirtyRevisionRef.current = 0;
        setHasUnsavedChanges(false);
        setLastSavedAt(save.updatedAt);
        setSaveNoticeKey(null);
        setCurrentSave(save);
        setLocalSaves(await saveService.listLocalSaves());
        navigate('ludus', { gameId: save.gameId });
      } catch {
        setErrorKey('ludus.saveError');
      } finally {
        setIsLoading(false);
      }
    },
    [navigate, saveService],
  );

  const loadLocalSave = useCallback(
    async (saveId: string) => {
      setIsLoading(true);
      setErrorKey(null);

      try {
        const save = synchronizeLoadedSave(await saveService.loadLocalSave(saveId));

        dirtyRevisionRef.current = 0;
        setHasUnsavedChanges(false);
        setLastSavedAt(save.updatedAt);
        setSaveNoticeKey(null);
        setCurrentSave(save);
        navigate('ludus', { gameId: save.gameId });
        return true;
      } catch {
        setErrorKey('loadGame.error');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [navigate, saveService],
  );

  const loadDemoSave = useCallback(
    async (saveId: DemoSaveId) => {
      if (!featureFlags.enableDemoMode) {
        setErrorKey('demoMode.unavailable');
        return false;
      }

      setIsLoading(true);
      setErrorKey(null);

      try {
        const demoTemplate = synchronizeLoadedSave(await saveService.loadDemoSave(saveId));
        const save = await saveService.createLocalSaveFromDemoTemplate(demoTemplate);

        dirtyRevisionRef.current = 0;
        setHasUnsavedChanges(false);
        setLastSavedAt(save.updatedAt);
        setSaveNoticeKey(null);
        setCurrentSave(save);
        setLocalSaves(await saveService.listLocalSaves());
        navigate('ludus', { gameId: save.gameId });
        return true;
      } catch {
        setErrorKey('demoMode.loadError');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [navigate, saveService],
  );

  const resetActiveDemo = useCallback(async () => {
    const demoSaveId = currentSave?.metadata?.demoSaveId;

    if (!demoSaveId) {
      return;
    }

    setIsLoading(true);
    setErrorKey(null);

    try {
      const demoTemplate = synchronizeLoadedSave(await saveService.loadDemoSave(demoSaveId));
      const resetSave = await saveService.updateLocalSave({
        ...demoTemplate,
        gameId: currentSave.gameId,
        saveId: currentSave.saveId,
        createdAt: currentSave.createdAt,
        metadata: {
          demoSaveId,
        },
      });

      dirtyRevisionRef.current = 0;
      setHasUnsavedChanges(false);
      setLastSavedAt(resetSave.updatedAt);
      setSaveNoticeKey(null);
      setCurrentSave(resetSave);
      setLocalSaves(await saveService.listLocalSaves());
    } catch {
      setErrorKey('demoMode.loadError');
    } finally {
      setIsLoading(false);
    }
  }, [currentSave, saveService]);

  const saveCurrentGame = useCallback(async () => {
    if (!currentSave) {
      return;
    }

    setIsSaving(true);
    setErrorKey(null);
    setSaveNoticeKey(null);

    try {
      const updatedSave = await saveService.updateLocalSave(currentSave);

      setCurrentSave(updatedSave);
      setLocalSaves(await saveService.listLocalSaves());
      dirtyRevisionRef.current = 0;
      setHasUnsavedChanges(false);
      setLastSavedAt(updatedSave.updatedAt);
      setSaveNoticeKey('ludus.saveSuccess');
    } catch {
      setErrorKey('ludus.saveError');
      setSaveNoticeKey(null);
    } finally {
      setIsSaving(false);
    }
  }, [currentSave, saveService]);

  const changeLanguage = useCallback(
    async (nextLanguage: LanguageCode) => {
      setLanguage(nextLanguage);
      setSaveNoticeKey(null);
    },
    [setLanguage],
  );

  const applyPlayerChange = useCallback((updateSave: (save: GameSave) => GameSave) => {
    setCurrentSave((save) => {
      if (!save) {
        return save;
      }

      const actionSave = updateSave(save);
      const updatedSave = actionSave === save ? save : synchronizeDerivedSave(actionSave);

      if (updatedSave !== save) {
        dirtyRevisionRef.current += 1;
        setHasUnsavedChanges(true);
        setSaveNoticeKey(null);
      }

      return updatedSave;
    });
  }, []);

  const adjustDebugTreasury = useCallback(
    (amount: number) => {
      applyPlayerChange((save) => {
        if (!featureFlags.enableDebugUi) {
          return save;
        }

        return adjustDebugTreasuryAction(save, amount);
      });
    },
    [applyPlayerChange],
  );

  const levelUpDebugGladiator = useCallback(
    (gladiatorId: string) => {
      applyPlayerChange((save) => {
        if (!featureFlags.enableDebugUi) {
          return save;
        }

        return levelUpDebugGladiatorAction(save, gladiatorId);
      });
    },
    [applyPlayerChange],
  );

  const createDebugInjuryAlert = useCallback(
    (gladiatorId: string) => {
      applyPlayerChange((save) => {
        if (!featureFlags.enableDebugUi) {
          return save;
        }

        return createDebugInjuryAlertAction(save, gladiatorId);
      });
    },
    [applyPlayerChange],
  );

  const advanceDebugToDay = useCallback(
    (dayOfWeek: DayOfWeek) => {
      applyPlayerChange((save) => {
        if (!featureFlags.enableDebugUi) {
          return save;
        }

        return advanceDebugToDayAction(save, dayOfWeek);
      });
    },
    [applyPlayerChange],
  );

  const setDebugTimeScale = useCallback((multiplier: number) => {
    if (!featureFlags.enableDebugUi) {
      return;
    }

    setDebugTimeScaleState(
      GAME_BALANCE.debug.timeScaleOptions.includes(
        multiplier as (typeof GAME_BALANCE.debug.timeScaleOptions)[number],
      )
        ? multiplier
        : 1,
    );
  }, []);

  const purchaseBuildingAction = useCallback(
    (buildingId: BuildingId) => {
      applyPlayerChange((save) => purchaseBuilding(save, buildingId).save);
    },
    [applyPlayerChange],
  );

  const upgradeBuildingAction = useCallback(
    (buildingId: BuildingId) => {
      applyPlayerChange((save) => upgradeBuilding(save, buildingId).save);
    },
    [applyPlayerChange],
  );

  const purchaseBuildingImprovementAction = useCallback(
    (buildingId: BuildingId, improvementId: string) => {
      applyPlayerChange(
        (save) => purchaseBuildingImprovement(save, buildingId, improvementId).save,
      );
    },
    [applyPlayerChange],
  );

  const purchaseBuildingSkillAction = useCallback(
    (buildingId: BuildingId, skillId: string) => {
      applyPlayerChange((save) => purchaseBuildingSkill(save, buildingId, skillId).save);
    },
    [applyPlayerChange],
  );

  const selectBuildingPolicyAction = useCallback(
    (buildingId: BuildingId, policyId: string) => {
      applyPlayerChange((save) => selectBuildingPolicy(save, buildingId, policyId).save);
    },
    [applyPlayerChange],
  );

  const buyMarketGladiatorAction = useCallback(
    (candidateId: string) => {
      applyPlayerChange((save) => buyMarketGladiator(save, candidateId).save);
    },
    [applyPlayerChange],
  );

  const sellGladiatorAction = useCallback(
    (gladiatorId: string) => {
      applyPlayerChange((save) => sellGladiator(save, gladiatorId).save);
    },
    [applyPlayerChange],
  );

  const allocateGladiatorSkillPoint = useCallback(
    (gladiatorId: string, skill: GladiatorSkillName) => {
      applyPlayerChange((save) => ({
        ...save,
        gladiators: save.gladiators.map((gladiator) =>
          gladiator.id === gladiatorId
            ? allocateGladiatorSkillPointAction(gladiator, skill)
            : gladiator,
        ),
      }));
    },
    [applyPlayerChange],
  );

  const updateDailyPlan = useCallback(
    (update: DailyPlanUpdate) => {
      applyPlayerChange((save) => updateDailyPlanAction(save, update));
    },
    [applyPlayerChange],
  );

  const updateDailyPlanBuildingActivitySelection = useCallback(
    (update: DailyPlanBuildingActivitySelectionUpdate) => {
      applyPlayerChange((save) => updateDailyPlanBuildingActivitySelectionAction(save, update));
    },
    [applyPlayerChange],
  );

  const resolveGameEventChoice = useCallback(
    (eventId: string, choiceId: string) => {
      applyPlayerChange((save) => resolveGameEventChoiceAction(save, eventId, choiceId).save);
    },
    [applyPlayerChange],
  );

  const triggerDebugDailyEvent = useCallback(
    (definitionId: string) => {
      applyPlayerChange((save) => {
        if (!featureFlags.enableDebugUi) {
          return save;
        }

        return triggerDebugDailyEventAction(save, definitionId);
      });
    },
    [applyPlayerChange],
  );

  const completeSundayArenaDay = useCallback(() => {
    applyPlayerChange((save) => completeSundayArenaDayAction(save));
  }, [applyPlayerChange]);

  const advanceWeekStepAction = useCallback(
    (options?: { ignoreModalPause?: boolean }) => {
      if (
        (activeModalRef.current || activeSurfaceRef.current.kind !== 'buildings') &&
        !options?.ignoreModalPause
      ) {
        return;
      }

      applyPlayerChange((save) => resolveWeekStep(save));
    },
    [applyPlayerChange],
  );

  const resolvePendingGameAction = useCallback(
    (trigger?: PendingActionTrigger) => {
      const save = currentSaveRef.current;
      const pendingTrigger = trigger ?? save?.time.pendingActionTrigger;

      if (!save || !pendingTrigger) {
        return;
      }

      applyPlayerChange((currentSaveForAction) =>
        resolvePendingGameActionAction(currentSaveForAction, pendingTrigger),
      );
      setGameClockMinutes(0);

      if (pendingTrigger === 'enterArena' && save.time.dayOfWeek === GAME_BALANCE.arena.dayOfWeek) {
        closeAllModals();
        navigate('arena', { gameId: save.gameId });
      }
    },
    [applyPlayerChange, closeAllModals, navigate],
  );

  const toggleGamePause = useCallback(() => {
    setIsGamePaused((paused) => !paused);
  }, []);

  const takeLoan = useCallback(
    (loanId: LoanId) => {
      applyPlayerChange((save) => takeLoanAction(save, loanId).save);
    },
    [applyPlayerChange],
  );

  const buyoutLoan = useCallback(
    (loanInstanceId: string) => {
      applyPlayerChange((save) => buyoutLoanAction(save, loanInstanceId).save);
    },
    [applyPlayerChange],
  );

  const clearError = useCallback(() => setErrorKey(null), []);

  useEffect(() => {
    currentSaveRef.current = currentSave;
  }, [currentSave]);

  useEffect(() => {
    activeModalRef.current = activeModal;
  }, [activeModal]);

  useEffect(() => {
    activeSurfaceRef.current = activeSurface;
  }, [activeSurface]);

  useEffect(() => {
    isGamePausedRef.current = isGamePaused;
  }, [isGamePaused]);

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  useEffect(() => {
    isSavingRef.current = isSaving;
  }, [isSaving]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentSave((save) => (save ? refreshGameAlerts(save) : save));
    }, ALERT_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!initialRouteGameId || hasLoadedInitialRouteGame.current) {
      return undefined;
    }

    hasLoadedInitialRouteGame.current = true;
    setIsLoading(true);
    setErrorKey(null);

    void saveService
      .loadLatestLocalSaveForGame(initialRouteGameId)
      .then(async (routeSave) => {
        const save = synchronizeLoadedSave(routeSave);

        dirtyRevisionRef.current = 0;
        setHasUnsavedChanges(false);
        setLastSavedAt(save.updatedAt);
        setSaveNoticeKey(null);
        setCurrentSave(save);
        setLocalSaves(await saveService.listLocalSaves());
        navigate(initialRouteScreen, { gameId: save.gameId });
      })
      .catch(() => {
        setErrorKey('loadGame.error');
        window.history.replaceState(null, '', '/');
        navigate('mainMenu');
      })
      .finally(() => {
        setIsLoading(false);
      });

    return undefined;
  }, [initialRouteGameId, initialRouteScreen, navigate, saveService]);

  useEffect(() => {
    const flushLocalAutoSave = () => {
      const save = currentSaveRef.current;

      if (!save || !hasUnsavedChangesRef.current) {
        return;
      }

      try {
        void saveService.updateLocalSave(save);
      } catch {
        // The page is unloading; the regular auto-save loop will surface errors while playing.
      }
    };

    window.addEventListener('pagehide', flushLocalAutoSave);

    return () => window.removeEventListener('pagehide', flushLocalAutoSave);
  }, [saveService]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const save = currentSaveRef.current;

      if (
        !save ||
        !hasUnsavedChangesRef.current ||
        isSavingRef.current ||
        isAutoSavingRef.current
      ) {
        return;
      }

      const savedDirtyRevision = dirtyRevisionRef.current;

      isAutoSavingRef.current = true;
      setIsSaving(true);
      setErrorKey(null);

      void saveService
        .updateLocalSave(save)
        .then(async (updatedSave) => {
          setCurrentSave((latestSave) => {
            if (!latestSave || latestSave.saveId !== updatedSave.saveId) {
              return latestSave;
            }

            return {
              ...latestSave,
              updatedAt: updatedSave.updatedAt,
            };
          });
          setLocalSaves(await saveService.listLocalSaves());
          setLastSavedAt(updatedSave.updatedAt);

          if (dirtyRevisionRef.current === savedDirtyRevision) {
            setHasUnsavedChanges(false);
          }
        })
        .catch(() => {
          setErrorKey('ludus.saveError');
        })
        .finally(() => {
          isAutoSavingRef.current = false;
          setIsSaving(false);
        });
    }, AUTO_SAVE_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [saveService]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const save = currentSaveRef.current;

      if (
        !save ||
        activeModalRef.current ||
        activeSurfaceRef.current.kind !== 'buildings' ||
        isGamePausedRef.current ||
        save.time.pendingActionTrigger ||
        save.time.phase !== 'planning'
      ) {
        return;
      }

      setGameClockMinutes((minutes) => {
        const nextMinutes = minutes + GAME_BALANCE.time.minutesPerRealSecond * debugTimeScale;

        if (nextMinutes < GAME_CLOCK_END_MINUTES) {
          return nextMinutes;
        }

        applyPlayerChange((currentSaveForStep) => resolveWeekStep(currentSaveForStep));

        return GAME_CLOCK_START_MINUTES;
      });
    }, GAME_CLOCK_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [applyPlayerChange, debugTimeScale]);

  useEffect(() => {
    if (!currentSave || (screen !== 'ludus' && screen !== 'arena')) {
      return;
    }

    if (
      currentSave.ludus.gameStatus !== 'lost' &&
      currentSave.events.pendingEvents.length === 0 &&
      currentSave.time.dayOfWeek === GAME_BALANCE.arena.dayOfWeek &&
      currentSave.time.phase === 'arena' &&
      !currentSave.time.pendingActionTrigger &&
      !currentSave.arena.arenaDay
    ) {
      applyPlayerChange((save) => resolveWeekStep(save));
      return;
    }

    const interruption = getActiveGameInterruption(currentSave);

    if (interruption?.kind === 'dailyEvent') {
      const hasDailyEventModal = modalStack.some(
        (modal) => modal.kind === 'dailyEvent' && modal.eventId === interruption.eventId,
      );

      if (!hasDailyEventModal) {
        const request = { eventId: interruption.eventId, kind: 'dailyEvent' as const };

        if (activeModal) {
          pushModal(request);
        } else {
          openModal(request);
        }
      }

      return;
    }

    if (interruption?.kind === 'sundayArena') {
      if (screen !== 'arena') {
        navigate('arena', { gameId: currentSave.gameId });
      }

      return;
    }

    if (screen === 'arena') {
      navigate('ludus', { gameId: currentSave.gameId });
    }
  }, [
    activeModal,
    applyPlayerChange,
    currentSave,
    modalStack,
    navigate,
    openModal,
    pushModal,
    screen,
  ]);

  const value = useMemo<GameStoreValue>(() => {
    const isTimeControlLocked = Boolean(currentSave?.time.pendingActionTrigger);
    const displayedClockMinutes = isTimeControlLocked ? 0 : gameClockMinutes;
    const clockHours = Math.floor(displayedClockMinutes / 60);
    const clockMinutes = displayedClockMinutes % 60;

    return {
      currentSave,
      localSaves,
      demoSaves,
      isLoading,
      isSaving,
      isGamePaused:
        isGamePaused ||
        Boolean(activeModal) ||
        activeSurface.kind !== 'buildings' ||
        isTimeControlLocked,
      isTimeControlLocked,
      debugTimeScale,
      gameClockLabel: `${clockHours.toString().padStart(2, '0')}:${clockMinutes
        .toString()
        .padStart(2, '0')}`,
      hasUnsavedChanges,
      lastSavedAt,
      errorKey,
      saveNoticeKey,
      refreshLocalSaves,
      refreshDemoSaves,
      createNewGame,
      loadLocalSave,
      loadDemoSave,
      resetActiveDemo,
      saveCurrentGame,
      changeLanguage,
      purchaseBuilding: purchaseBuildingAction,
      purchaseBuildingImprovement: purchaseBuildingImprovementAction,
      purchaseBuildingSkill: purchaseBuildingSkillAction,
      selectBuildingPolicy: selectBuildingPolicyAction,
      upgradeBuilding: upgradeBuildingAction,
      buyMarketGladiator: buyMarketGladiatorAction,
      sellGladiator: sellGladiatorAction,
      allocateGladiatorSkillPoint,
      updateDailyPlan,
      updateDailyPlanBuildingActivitySelection,
      resolveGameEventChoice,
      triggerDebugDailyEvent,
      adjustDebugTreasury,
      levelUpDebugGladiator,
      createDebugInjuryAlert,
      advanceDebugToDay,
      setDebugTimeScale,
      completeSundayArenaDay,
      advanceWeekStep: advanceWeekStepAction,
      resolvePendingGameAction,
      toggleGamePause,
      takeLoan,
      buyoutLoan,
      clearError,
    };
  }, [
    adjustDebugTreasury,
    advanceDebugToDay,
    advanceWeekStepAction,
    activeModal,
    activeSurface,
    allocateGladiatorSkillPoint,
    buyoutLoan,
    buyMarketGladiatorAction,
    changeLanguage,
    clearError,
    createNewGame,
    createDebugInjuryAlert,
    demoSaves,
    debugTimeScale,
    errorKey,
    gameClockMinutes,
    hasUnsavedChanges,
    isGamePaused,
    isLoading,
    isSaving,
    lastSavedAt,
    levelUpDebugGladiator,
    loadDemoSave,
    loadLocalSave,
    localSaves,
    purchaseBuildingAction,
    purchaseBuildingImprovementAction,
    purchaseBuildingSkillAction,
    refreshLocalSaves,
    refreshDemoSaves,
    resetActiveDemo,
    resolveGameEventChoice,
    resolvePendingGameAction,
    saveCurrentGame,
    saveNoticeKey,
    setDebugTimeScale,
    takeLoan,
    triggerDebugDailyEvent,
    toggleGamePause,
    updateDailyPlan,
    updateDailyPlanBuildingActivitySelection,
    currentSave,
    completeSundayArenaDay,
    sellGladiatorAction,
    selectBuildingPolicyAction,
    upgradeBuildingAction,
  ]);

  return <GameStoreContext.Provider value={value}>{children}</GameStoreContext.Provider>;
}
