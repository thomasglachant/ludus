import {
  resolveGameEventChoice as resolveGameEventChoiceAction,
  triggerDebugDailyEvent as triggerDebugDailyEventAction,
} from '../domain/events/event-actions';
import { adjustDebugTreasury as adjustDebugTreasuryAction } from '../domain/debug/debug-actions';
import {
  buyoutLoan as buyoutLoanAction,
  takeLoan as takeLoanAction,
} from '../domain/economy/economy-actions';
import { markArenaCombatPresented as markArenaCombatPresentedAction } from '../domain/combat/combat-actions';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { getGameSessionRoute } from '../app/routes';
import { featureFlags } from '../config/features';
import {
  purchaseBuilding,
  purchaseBuildingImprovement,
  purchaseBuildingSkill,
  selectBuildingPolicy,
  upgradeBuilding,
} from '../domain/buildings/building-actions';
import { buyMarketGladiator, sellGladiator } from '../domain/market/market-actions';
import {
  assignStaffToBuilding as assignStaffToBuildingAction,
  buyMarketStaff as buyMarketStaffAction,
  sellStaff as sellStaffAction,
} from '../domain/staff/staff-actions';
import {
  completeSundayArenaDay as completeSundayArenaDayAction,
  resolveWeekStep,
  synchronizeEconomyProjection,
} from '../domain/weekly-simulation/weekly-simulation-actions';
import {
  applyPlanningRecommendations,
  updateDailyPlanBuildingActivitySelection as updateDailyPlanBuildingActivitySelectionAction,
  updateDailyPlan as updateDailyPlanAction,
  synchronizePlanning,
} from '../domain/planning/planning-actions';
import { getActiveGameInterruption } from '../domain/game-flow/interruption';
import type {
  BuildingId,
  DemoSaveId,
  GameSave,
  GameSaveMetadata,
  LanguageCode,
  LoanId,
  DailyPlanBuildingActivitySelectionUpdate,
  DailyPlanUpdate,
} from '../domain/types';
import { CloudSaveProvider } from '../persistence/cloud-save-provider';
import { DemoSaveProvider } from '../persistence/demo-save-provider';
import { LocalSaveProvider } from '../persistence/local-save-provider';
import { SaveService } from '../persistence/save-service';
import { GameStoreContext, type GameStoreValue, type NewGameInput } from './game-store-context';
import { useUiStore } from './ui-store-context';

const AUTO_SAVE_INTERVAL_MS = 30_000;

function createSaveService() {
  return new SaveService(
    new LocalSaveProvider(),
    new CloudSaveProvider(),
    featureFlags.enableDemoMode ? new DemoSaveProvider() : undefined,
  );
}

function synchronizeLoadedSave(save: GameSave): GameSave {
  return synchronizeEconomyProjection(synchronizePlanning(save));
}

export function GameStoreProvider({ children }: { children: ReactNode }) {
  const { activeModal, screen, setLanguage, navigate, openModal } = useUiStore();
  const [saveService] = useState(createSaveService);
  const [initialRoute] = useState(() => getGameSessionRoute(window.location.pathname));
  const initialRouteGameId = initialRoute?.gameId;
  const initialRouteScreen = initialRoute?.screen ?? 'ludus';
  const [currentSave, setCurrentSave] = useState<GameSave | null>(null);
  const [localSaves, setLocalSaves] = useState<GameSaveMetadata[]>([]);
  const [demoSaves, setDemoSaves] = useState<GameSaveMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [saveNoticeKey, setSaveNoticeKey] = useState<string | null>(null);
  const hasLoadedInitialRouteGame = useRef(false);
  const currentSaveRef = useRef<GameSave | null>(null);
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
      const updatedSave = actionSave === save ? save : synchronizeEconomyProjection(actionSave);

      if (updatedSave !== save) {
        dirtyRevisionRef.current += 1;
        setHasUnsavedChanges(true);
        setSaveNoticeKey(null);
      }

      return updatedSave;
    });
  }, []);

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

  const buyMarketStaff = useCallback(
    (candidateId: string) => {
      applyPlayerChange((save) => buyMarketStaffAction(save, candidateId).save);
    },
    [applyPlayerChange],
  );

  const sellStaff = useCallback(
    (staffId: string) => {
      applyPlayerChange((save) => sellStaffAction(save, staffId).save);
    },
    [applyPlayerChange],
  );

  const applyPlanningRecommendationsAction = useCallback(() => {
    applyPlayerChange((save) => applyPlanningRecommendations(save));
  }, [applyPlayerChange]);

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

  const markArenaCombatPresented = useCallback(
    (combatId: string) => {
      applyPlayerChange((save) => markArenaCombatPresentedAction(save, combatId));
    },
    [applyPlayerChange],
  );

  const completeSundayArenaDay = useCallback(() => {
    applyPlayerChange((save) => completeSundayArenaDayAction(save));
  }, [applyPlayerChange]);

  const advanceWeekStepAction = useCallback(() => {
    applyPlayerChange((save) => resolveWeekStep(save));
  }, [applyPlayerChange]);

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

  const assignStaffToBuilding = useCallback(
    (staffId: string, buildingId?: BuildingId) => {
      applyPlayerChange((save) => assignStaffToBuildingAction(save, staffId, buildingId).save);
    },
    [applyPlayerChange],
  );

  const clearError = useCallback(() => setErrorKey(null), []);

  useEffect(() => {
    currentSaveRef.current = currentSave;
  }, [currentSave]);

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  useEffect(() => {
    isSavingRef.current = isSaving;
  }, [isSaving]);

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
    if (!currentSave || (screen !== 'ludus' && screen !== 'arena')) {
      return;
    }

    const interruption = getActiveGameInterruption(currentSave);

    if (interruption?.kind === 'dailyEvent') {
      if (!activeModal) {
        openModal({ kind: 'events' });
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
  }, [activeModal, currentSave, navigate, openModal, screen]);

  const value = useMemo<GameStoreValue>(() => {
    return {
      currentSave,
      localSaves,
      demoSaves,
      isLoading,
      isSaving,
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
      buyMarketStaff,
      sellStaff,
      applyPlanningRecommendations: applyPlanningRecommendationsAction,
      updateDailyPlan,
      updateDailyPlanBuildingActivitySelection,
      resolveGameEventChoice,
      triggerDebugDailyEvent,
      adjustDebugTreasury,
      markArenaCombatPresented,
      completeSundayArenaDay,
      advanceWeekStep: advanceWeekStepAction,
      takeLoan,
      buyoutLoan,
      assignStaffToBuilding,
      clearError,
    };
  }, [
    adjustDebugTreasury,
    advanceWeekStepAction,
    applyPlanningRecommendationsAction,
    assignStaffToBuilding,
    buyoutLoan,
    buyMarketGladiatorAction,
    buyMarketStaff,
    changeLanguage,
    clearError,
    createNewGame,
    demoSaves,
    errorKey,
    hasUnsavedChanges,
    isLoading,
    isSaving,
    lastSavedAt,
    loadDemoSave,
    loadLocalSave,
    localSaves,
    purchaseBuildingAction,
    purchaseBuildingImprovementAction,
    purchaseBuildingSkillAction,
    refreshLocalSaves,
    refreshDemoSaves,
    resetActiveDemo,
    saveCurrentGame,
    saveNoticeKey,
    resolveGameEventChoice,
    triggerDebugDailyEvent,
    takeLoan,
    updateDailyPlan,
    updateDailyPlanBuildingActivitySelection,
    markArenaCombatPresented,
    currentSave,
    completeSundayArenaDay,
    sellGladiatorAction,
    sellStaff,
    selectBuildingPolicyAction,
    upgradeBuildingAction,
  ]);

  return <GameStoreContext.Provider value={value}>{children}</GameStoreContext.Provider>;
}
