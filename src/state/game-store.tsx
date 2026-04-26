import {
  acceptWeeklyContract as acceptWeeklyContractAction,
  synchronizeContracts,
} from '../domain/contracts/contract-actions';
import { resolveGameEventChoice as resolveGameEventChoiceAction } from '../domain/events/event-actions';
import {
  scoutOpponent as scoutOpponentAction,
  synchronizeBetting,
} from '../domain/combat/combat-actions';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { isGameSessionPath } from '../app/routes';
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
import { setGameSpeed as setSaveGameSpeed, tickGame } from '../domain/time/time-actions';
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
import { ActiveSessionProvider } from '../persistence/active-session-provider';
import { useUiStore } from './ui-store';

interface NewGameInput {
  ownerName: string;
  ludusName: string;
}

interface GameStoreValue {
  currentSave: GameSave | null;
  localSaves: GameSaveMetadata[];
  demoSaves: GameSaveMetadata[];
  isLoading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  lastSavedAt: string | null;
  errorKey: string | null;
  saveNoticeKey: string | null;
  refreshLocalSaves(): Promise<void>;
  refreshDemoSaves(): Promise<void>;
  createNewGame(input: NewGameInput): Promise<void>;
  loadLocalSave(saveId: string): Promise<boolean>;
  loadDemoSave(saveId: DemoSaveId): Promise<boolean>;
  resetActiveDemo(): Promise<void>;
  saveCurrentGame(): Promise<void>;
  saveCurrentGameAs(input?: { ludusName?: string }): Promise<void>;
  changeLanguage(language: LanguageCode): Promise<void>;
  setGameSpeed(speed: GameSpeed): void;
  purchaseBuilding(buildingId: BuildingId): void;
  purchaseBuildingImprovement(buildingId: BuildingId, improvementId: string): void;
  selectBuildingPolicy(buildingId: BuildingId, policyId: string): void;
  upgradeBuilding(buildingId: BuildingId): void;
  buyMarketGladiator(candidateId: string): void;
  sellGladiator(gladiatorId: string): void;
  updateGladiatorRoutine(gladiatorId: string, update: GladiatorRoutineUpdate): void;
  setAutomaticAssignment(gladiatorId: string, allowAutomaticAssignment: boolean): void;
  setManualBuildingOverride(gladiatorId: string, buildingId?: BuildingId): void;
  applyPlanningRecommendations(): void;
  acceptWeeklyContract(contractId: string): void;
  resolveGameEventChoice(eventId: string, choiceId: string): void;
  scoutOpponent(gladiatorId: string): void;
  clearError(): void;
}

const GameStoreContext = createContext<GameStoreValue | null>(null);

function createSaveService() {
  return new SaveService(
    new LocalSaveProvider(),
    new CloudSaveProvider(),
    featureFlags.enableDemoMode ? new DemoSaveProvider() : undefined,
  );
}

function createActiveSessionProvider() {
  return new ActiveSessionProvider();
}

function synchronizeLoadedSave(save: GameSave): GameSave {
  return synchronizePlanning(synchronizeContracts(synchronizeBetting(save)));
}

export function GameStoreProvider({ children }: { children: ReactNode }) {
  const { screen, setLanguage, navigate } = useUiStore();
  const [saveService] = useState(createSaveService);
  const [activeSessionProvider] = useState(createActiveSessionProvider);
  const [initialActiveSession] = useState(() => {
    if (!isGameSessionPath(window.location.pathname)) {
      return null;
    }

    const session = activeSessionProvider.loadSession();

    if (!session) {
      window.history.replaceState(null, '', '/');
    }

    return session;
  });
  const [initialSave] = useState(() =>
    initialActiveSession ? synchronizeLoadedSave(initialActiveSession.save) : null,
  );
  const [currentSave, setCurrentSave] = useState<GameSave | null>(initialSave);
  const [localSaves, setLocalSaves] = useState<GameSaveMetadata[]>([]);
  const [demoSaves, setDemoSaves] = useState<GameSaveMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(
    initialActiveSession?.hasUnsavedChanges ?? false,
  );
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(initialSave?.updatedAt ?? null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [saveNoticeKey, setSaveNoticeKey] = useState<string | null>(null);
  const effectAccumulatorMinutes = useRef(0);
  const lastTickAt = useRef<number | null>(null);
  const activeSessionSaveTimeoutId = useRef<number | null>(null);
  const activeSaveId = currentSave?.saveId;
  const activeSpeed = currentSave?.time.speed;
  const isPaused = currentSave?.time.isPaused;

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
        setHasUnsavedChanges(false);
        setLastSavedAt(save.updatedAt);
        setSaveNoticeKey(null);
        setCurrentSave(save);
        setLocalSaves(await saveService.listLocalSaves());
        navigate('ludus');
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
        setHasUnsavedChanges(false);
        setLastSavedAt(save.updatedAt);
        setSaveNoticeKey(null);
        setCurrentSave(save);
        navigate('ludus');
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
        setHasUnsavedChanges(false);
        setLastSavedAt(save.updatedAt);
        setSaveNoticeKey(null);
        setCurrentSave(save);
        setLocalSaves(await saveService.listLocalSaves());
        navigate('ludus');
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
        saveId: currentSave.saveId,
        createdAt: currentSave.createdAt,
        metadata: {
          demoSaveId,
        },
      });

      effectAccumulatorMinutes.current = 0;
      lastTickAt.current = null;
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

  const clearError = useCallback(() => setErrorKey(null), []);

  useEffect(() => {
    if (!initialActiveSession) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => navigate(initialActiveSession.screen), 0);

    return () => window.clearTimeout(timeoutId);
  }, [initialActiveSession, navigate]);

  useEffect(() => {
    if (!currentSave) {
      return undefined;
    }

    if (activeSessionSaveTimeoutId.current !== null) {
      window.clearTimeout(activeSessionSaveTimeoutId.current);
    }

    activeSessionSaveTimeoutId.current = window.setTimeout(() => {
      try {
        activeSessionProvider.writeSession({
          hasUnsavedChanges,
          save: currentSave,
          screen,
        });
      } catch {
        setErrorKey('ludus.saveError');
      } finally {
        activeSessionSaveTimeoutId.current = null;
      }
    }, 750);

    return () => {
      if (activeSessionSaveTimeoutId.current !== null) {
        window.clearTimeout(activeSessionSaveTimeoutId.current);
        activeSessionSaveTimeoutId.current = null;
      }
    };
  }, [activeSessionProvider, currentSave, hasUnsavedChanges, screen]);

  useEffect(() => {
    const flushActiveSession = () => {
      if (!currentSave) {
        return;
      }

      try {
        activeSessionProvider.writeSession({
          hasUnsavedChanges,
          save: currentSave,
          screen,
        });
      } catch {
        // The page is unloading; normal save error UI may not render here.
      }
    };

    window.addEventListener('pagehide', flushActiveSession);

    return () => window.removeEventListener('pagehide', flushActiveSession);
  }, [activeSessionProvider, currentSave, hasUnsavedChanges, screen]);

  useEffect(() => {
    if (!activeSaveId || activeSpeed === undefined || activeSpeed === 0 || isPaused) {
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
          setHasUnsavedChanges(true);
          setSaveNoticeKey(null);
        }

        return result.save;
      });
    }, 1_000);

    return () => window.clearInterval(intervalId);
  }, [activeSaveId, activeSpeed, isPaused]);

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
      clearError,
    };
  }, [
    acceptWeeklyContract,
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

export function useGameStore() {
  const context = useContext(GameStoreContext);

  if (!context) {
    throw new Error('useGameStore must be used inside GameStoreProvider');
  }

  return context;
}
