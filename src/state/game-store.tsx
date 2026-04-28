import {
  acceptWeeklyContract as acceptWeeklyContractAction,
  synchronizeContracts,
} from '../domain/contracts/contract-actions';
import { resolveGameEventChoice as resolveGameEventChoiceAction } from '../domain/events/event-actions';
import {
  markArenaCombatPresented as markArenaCombatPresentedAction,
  scoutOpponent as scoutOpponentAction,
  showArenaDaySummary as showArenaDaySummaryAction,
  startArenaDayCombats as startArenaDayCombatsAction,
  synchronizeBetting,
} from '../domain/combat/combat-actions';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { getGameIdFromGameSessionPath } from '../app/routes';
import { featureFlags } from '../config/features';
import {
  purchaseBuilding,
  purchaseBuildingImprovement,
  selectBuildingPolicy,
  upgradeBuilding,
} from '../domain/buildings/building-actions';
import { buyMarketGladiator, sellGladiator } from '../domain/market/market-actions';
import {
  applyPlanningRecommendations,
  setAutomaticAssignment,
  setManualBuildingOverride,
  synchronizePlanning,
  updateGladiatorRoutine,
} from '../domain/planning/planning-actions';
import {
  advanceToNextDay as advanceSaveToNextDay,
  completeSundayArenaDay as completeSundayArenaDayAction,
  setGameSpeed as setSaveGameSpeed,
  tickGame,
} from '../domain/time/time-actions';
import { getActiveGameInterruption, isGameInterrupted } from '../domain/game-flow/interruption';
import type {
  BuildingId,
  DemoSaveId,
  GameSave,
  GameSaveMetadata,
  GameSpeed,
  GladiatorRoutineUpdate,
  LanguageCode,
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
  return synchronizePlanning(synchronizeContracts(synchronizeBetting(save)));
}

export function GameStoreProvider({ children }: { children: ReactNode }) {
  const { activeModal, screen, setLanguage, navigate, openModal, replaceModal } = useUiStore();
  const [saveService] = useState(createSaveService);
  const [initialRouteGameId] = useState(() =>
    getGameIdFromGameSessionPath(window.location.pathname),
  );
  const [currentSave, setCurrentSave] = useState<GameSave | null>(null);
  const [localSaves, setLocalSaves] = useState<GameSaveMetadata[]>([]);
  const [demoSaves, setDemoSaves] = useState<GameSaveMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [saveNoticeKey, setSaveNoticeKey] = useState<string | null>(null);
  const effectAccumulatorMinutes = useRef(0);
  const lastTickAt = useRef<number | null>(null);
  const hasLoadedInitialRouteGame = useRef(false);
  const currentSaveRef = useRef<GameSave | null>(null);
  const hasUnsavedChangesRef = useRef(false);
  const isSavingRef = useRef(false);
  const isAutoSavingRef = useRef(false);
  const dirtyRevisionRef = useRef(0);
  const activeSaveId = currentSave?.saveId;
  const activeSpeed = currentSave?.time.speed;
  const isPaused = currentSave?.time.isPaused;
  const isSimulationBlocked = currentSave ? isGameInterrupted(currentSave) : false;

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
          ownerName: input.ownerName,
          ludusName: input.ludusName,
        });

        effectAccumulatorMinutes.current = 0;
        lastTickAt.current = null;
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

        effectAccumulatorMinutes.current = 0;
        lastTickAt.current = null;
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

        effectAccumulatorMinutes.current = 0;
        lastTickAt.current = null;
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

      effectAccumulatorMinutes.current = 0;
      lastTickAt.current = null;
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

  const saveCurrentGameAs = useCallback(
    async (input: { ludusName?: string } = {}) => {
      if (!currentSave) {
        return;
      }

      setIsSaving(true);
      setErrorKey(null);
      setSaveNoticeKey(null);

      try {
        const newSave = await saveService.createLocalSaveFromExisting(currentSave, input);

        setCurrentSave(newSave);
        setLocalSaves(await saveService.listLocalSaves());
        dirtyRevisionRef.current = 0;
        setHasUnsavedChanges(false);
        setLastSavedAt(newSave.updatedAt);
        setSaveNoticeKey('ludus.saveAsSuccess');
      } catch {
        setErrorKey('ludus.saveError');
        setSaveNoticeKey(null);
      } finally {
        setIsSaving(false);
      }
    },
    [currentSave, saveService],
  );

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

      const updatedSave = updateSave(save);

      if (updatedSave !== save) {
        dirtyRevisionRef.current += 1;
        setHasUnsavedChanges(true);
        setSaveNoticeKey(null);
      }

      return updatedSave;
    });
  }, []);

  const setGameSpeedAction = useCallback(
    (speed: GameSpeed) => {
      applyPlayerChange((save) => setSaveGameSpeed(save, speed));
    },
    [applyPlayerChange],
  );

  const advanceToNextDayAction = useCallback(() => {
    applyPlayerChange((save) => {
      const result = advanceSaveToNextDay(save, {
        effectAccumulatorMinutes: effectAccumulatorMinutes.current,
      });

      effectAccumulatorMinutes.current = result.effectAccumulatorMinutes;

      return result.save;
    });
  }, [applyPlayerChange]);

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

  const updateGladiatorRoutineAction = useCallback(
    (gladiatorId: string, update: GladiatorRoutineUpdate) => {
      applyPlayerChange((save) => updateGladiatorRoutine(save, gladiatorId, update));
    },
    [applyPlayerChange],
  );

  const setAutomaticAssignmentAction = useCallback(
    (gladiatorId: string, allowAutomaticAssignment: boolean) => {
      applyPlayerChange((save) =>
        setAutomaticAssignment(save, gladiatorId, allowAutomaticAssignment),
      );
    },
    [applyPlayerChange],
  );

  const setManualBuildingOverrideAction = useCallback(
    (gladiatorId: string, buildingId?: BuildingId) => {
      applyPlayerChange((save) => setManualBuildingOverride(save, gladiatorId, buildingId));
    },
    [applyPlayerChange],
  );

  const applyPlanningRecommendationsAction = useCallback(() => {
    applyPlayerChange((save) => applyPlanningRecommendations(save));
  }, [applyPlayerChange]);

  const acceptWeeklyContract = useCallback(
    (contractId: string) => {
      applyPlayerChange((save) => acceptWeeklyContractAction(save, contractId).save);
    },
    [applyPlayerChange],
  );

  const resolveGameEventChoice = useCallback(
    (eventId: string, choiceId: string) => {
      applyPlayerChange((save) => resolveGameEventChoiceAction(save, eventId, choiceId).save);
    },
    [applyPlayerChange],
  );

  const scoutOpponent = useCallback(
    (gladiatorId: string) => {
      applyPlayerChange((save) => scoutOpponentAction(save, gladiatorId).save);
    },
    [applyPlayerChange],
  );

  const startArenaDayCombats = useCallback(() => {
    applyPlayerChange((save) => startArenaDayCombatsAction(save));
  }, [applyPlayerChange]);

  const markArenaCombatPresented = useCallback(
    (combatId: string) => {
      applyPlayerChange((save) => markArenaCombatPresentedAction(save, combatId));
    },
    [applyPlayerChange],
  );

  const showArenaDaySummary = useCallback(() => {
    applyPlayerChange((save) => showArenaDaySummaryAction(save));
  }, [applyPlayerChange]);

  const completeSundayArenaDay = useCallback(() => {
    applyPlayerChange((save) => completeSundayArenaDayAction(save));
  }, [applyPlayerChange]);

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

        effectAccumulatorMinutes.current = 0;
        lastTickAt.current = null;
        dirtyRevisionRef.current = 0;
        setHasUnsavedChanges(false);
        setLastSavedAt(save.updatedAt);
        setSaveNoticeKey(null);
        setCurrentSave(save);
        setLocalSaves(await saveService.listLocalSaves());
        navigate('ludus', { gameId: save.gameId });
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
  }, [initialRouteGameId, navigate, saveService]);

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
    if (
      !activeSaveId ||
      activeSpeed === undefined ||
      activeSpeed === 0 ||
      isPaused ||
      isSimulationBlocked
    ) {
      lastTickAt.current = null;
      return undefined;
    }

    lastTickAt.current = Date.now();

    const intervalId = window.setInterval(() => {
      const now = Date.now();
      const elapsedRealMilliseconds = now - (lastTickAt.current ?? now);

      lastTickAt.current = now;

      setCurrentSave((save) => {
        if (!save) {
          return save;
        }

        const result = tickGame({
          currentSave: save,
          elapsedRealMilliseconds,
          speed: save.time.speed,
          effectAccumulatorMinutes: effectAccumulatorMinutes.current,
        });

        effectAccumulatorMinutes.current = result.effectAccumulatorMinutes;

        if (result.save !== save) {
          dirtyRevisionRef.current += 1;
          setHasUnsavedChanges(true);
          setSaveNoticeKey(null);
        }

        return result.save;
      });
    }, 1_000);

    return () => window.clearInterval(intervalId);
  }, [activeSaveId, activeSpeed, isPaused, isSimulationBlocked]);

  useEffect(() => {
    if (!currentSave || screen !== 'ludus') {
      return;
    }

    const interruption = getActiveGameInterruption(currentSave);

    if (interruption?.kind === 'dailyEvent') {
      if (!activeModal) {
        openModal({ kind: 'events' });
      }

      return;
    }

    if (interruption?.kind === 'sundayArena' && activeModal?.kind !== 'arena') {
      replaceModal({ kind: 'arena' });
    }
  }, [activeModal, currentSave, openModal, replaceModal, screen]);

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
      saveCurrentGameAs,
      changeLanguage,
      setGameSpeed: setGameSpeedAction,
      advanceToNextDay: advanceToNextDayAction,
      purchaseBuilding: purchaseBuildingAction,
      purchaseBuildingImprovement: purchaseBuildingImprovementAction,
      selectBuildingPolicy: selectBuildingPolicyAction,
      upgradeBuilding: upgradeBuildingAction,
      buyMarketGladiator: buyMarketGladiatorAction,
      sellGladiator: sellGladiatorAction,
      updateGladiatorRoutine: updateGladiatorRoutineAction,
      setAutomaticAssignment: setAutomaticAssignmentAction,
      setManualBuildingOverride: setManualBuildingOverrideAction,
      applyPlanningRecommendations: applyPlanningRecommendationsAction,
      acceptWeeklyContract,
      resolveGameEventChoice,
      scoutOpponent,
      startArenaDayCombats,
      markArenaCombatPresented,
      showArenaDaySummary,
      completeSundayArenaDay,
      clearError,
    };
  }, [
    acceptWeeklyContract,
    advanceToNextDayAction,
    applyPlanningRecommendationsAction,
    buyMarketGladiatorAction,
    changeLanguage,
    clearError,
    createNewGame,
    currentSave,
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
    refreshLocalSaves,
    refreshDemoSaves,
    resetActiveDemo,
    saveCurrentGame,
    saveCurrentGameAs,
    saveNoticeKey,
    resolveGameEventChoice,
    scoutOpponent,
    startArenaDayCombats,
    markArenaCombatPresented,
    showArenaDaySummary,
    completeSundayArenaDay,
    sellGladiatorAction,
    selectBuildingPolicyAction,
    setAutomaticAssignmentAction,
    setGameSpeedAction,
    setManualBuildingOverrideAction,
    updateGladiatorRoutineAction,
    upgradeBuildingAction,
  ]);

  return <GameStoreContext.Provider value={value}>{children}</GameStoreContext.Provider>;
}
