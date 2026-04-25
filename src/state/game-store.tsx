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
import { featureFlags } from '../config/features';
import { purchaseBuilding, upgradeBuilding } from '../domain/buildings/building-actions';
import { purchaseDormitoryBed } from '../domain/buildings/dormitory-actions';
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
  errorKey: string | null;
  refreshLocalSaves(): Promise<void>;
  refreshDemoSaves(): Promise<void>;
  createNewGame(input: NewGameInput): Promise<void>;
  loadLocalSave(saveId: string): Promise<void>;
  loadDemoSave(saveId: DemoSaveId): Promise<void>;
  resetActiveDemo(): Promise<void>;
  saveCurrentGame(): Promise<void>;
  changeLanguage(language: LanguageCode): Promise<void>;
  setGameSpeed(speed: GameSpeed): void;
  purchaseBuilding(buildingId: BuildingId): void;
  purchaseDormitoryBed(): void;
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

function synchronizeLoadedSave(save: GameSave): GameSave {
  return synchronizePlanning(synchronizeContracts(synchronizeBetting(save)));
}

export function GameStoreProvider({ children }: { children: ReactNode }) {
  const { language, setLanguage, navigate } = useUiStore();
  const [saveService] = useState(createSaveService);
  const [currentSave, setCurrentSave] = useState<GameSave | null>(null);
  const [localSaves, setLocalSaves] = useState<GameSaveMetadata[]>([]);
  const [demoSaves, setDemoSaves] = useState<GameSaveMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const effectAccumulatorMinutes = useRef(0);
  const lastTickAt = useRef<number | null>(null);
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
          language,
        });

        effectAccumulatorMinutes.current = 0;
        lastTickAt.current = null;
        setCurrentSave(save);
        setLocalSaves(await saveService.listLocalSaves());
        navigate('ludus');
      } catch {
        setErrorKey('ludus.saveError');
      } finally {
        setIsLoading(false);
      }
    },
    [language, navigate, saveService],
  );

  const loadLocalSave = useCallback(
    async (saveId: string) => {
      setIsLoading(true);
      setErrorKey(null);

      try {
        const save = synchronizeLoadedSave(await saveService.loadLocalSave(saveId));

        effectAccumulatorMinutes.current = 0;
        lastTickAt.current = null;
        setCurrentSave(save);
        setLanguage(save.settings.language);
        navigate('ludus');
      } catch {
        setErrorKey('loadGame.error');
      } finally {
        setIsLoading(false);
      }
    },
    [navigate, saveService, setLanguage],
  );

  const loadDemoSave = useCallback(
    async (saveId: DemoSaveId) => {
      if (!featureFlags.enableDemoMode) {
        setErrorKey('demoMode.unavailable');
        return;
      }

      setIsLoading(true);
      setErrorKey(null);

      try {
        const save = synchronizeLoadedSave(await saveService.loadDemoSave(saveId));

        effectAccumulatorMinutes.current = 0;
        lastTickAt.current = null;
        setCurrentSave(save);
        setLanguage(save.settings.language);
        navigate('ludus');
      } catch {
        setErrorKey('demoMode.loadError');
      } finally {
        setIsLoading(false);
      }
    },
    [navigate, saveService, setLanguage],
  );

  const resetActiveDemo = useCallback(async () => {
    const demoSaveId = currentSave?.metadata?.demoSaveId;

    if (!demoSaveId) {
      return;
    }

    await loadDemoSave(demoSaveId);
  }, [currentSave, loadDemoSave]);

  const saveCurrentGame = useCallback(async () => {
    if (!currentSave) {
      return;
    }

    if (currentSave.metadata?.isDemo) {
      setErrorKey(null);
      return;
    }

    setIsLoading(true);
    setErrorKey(null);

    try {
      const updatedSave = await saveService.updateLocalSave(currentSave);

      setCurrentSave(updatedSave);
      setLocalSaves(await saveService.listLocalSaves());
    } catch {
      setErrorKey('ludus.saveError');
    } finally {
      setIsLoading(false);
    }
  }, [currentSave, saveService]);

  const changeLanguage = useCallback(
    async (nextLanguage: LanguageCode) => {
      setLanguage(nextLanguage);

      if (!currentSave) {
        return;
      }

      const saveWithLanguage = {
        ...currentSave,
        settings: {
          ...currentSave.settings,
          language: nextLanguage,
        },
      };

      setCurrentSave(saveWithLanguage);

      if (!saveWithLanguage.metadata?.isDemo) {
        await saveService.updateLocalSave(saveWithLanguage);
      }
    },
    [currentSave, saveService, setLanguage],
  );

  const setGameSpeedAction = useCallback((speed: GameSpeed) => {
    setCurrentSave((save) => {
      if (!save) {
        return save;
      }

      return setSaveGameSpeed(save, speed);
    });
  }, []);

  const purchaseBuildingAction = useCallback((buildingId: BuildingId) => {
    setCurrentSave((save) => {
      if (!save) {
        return save;
      }

      const result = purchaseBuilding(save, buildingId);

      return result.save;
    });
  }, []);

  const upgradeBuildingAction = useCallback((buildingId: BuildingId) => {
    setCurrentSave((save) => {
      if (!save) {
        return save;
      }

      const result = upgradeBuilding(save, buildingId);

      return result.save;
    });
  }, []);

  const purchaseDormitoryBedAction = useCallback(() => {
    setCurrentSave((save) => {
      if (!save) {
        return save;
      }

      const result = purchaseDormitoryBed(save);

      return result.save;
    });
  }, []);

  const buyMarketGladiatorAction = useCallback((candidateId: string) => {
    setCurrentSave((save) => {
      if (!save) {
        return save;
      }

      const result = buyMarketGladiator(save, candidateId);

      return result.save;
    });
  }, []);

  const sellGladiatorAction = useCallback((gladiatorId: string) => {
    setCurrentSave((save) => {
      if (!save) {
        return save;
      }

      const result = sellGladiator(save, gladiatorId);

      return result.save;
    });
  }, []);

  const updateGladiatorRoutineAction = useCallback(
    (gladiatorId: string, update: GladiatorRoutineUpdate) => {
      setCurrentSave((save) => {
        if (!save) {
          return save;
        }

        return updateGladiatorRoutine(save, gladiatorId, update);
      });
    },
    [],
  );

  const setAutomaticAssignmentAction = useCallback(
    (gladiatorId: string, allowAutomaticAssignment: boolean) => {
      setCurrentSave((save) => {
        if (!save) {
          return save;
        }

        return setAutomaticAssignment(save, gladiatorId, allowAutomaticAssignment);
      });
    },
    [],
  );

  const setManualBuildingOverrideAction = useCallback(
    (gladiatorId: string, buildingId?: BuildingId) => {
      setCurrentSave((save) => {
        if (!save) {
          return save;
        }

        return setManualBuildingOverride(save, gladiatorId, buildingId);
      });
    },
    [],
  );

  const applyPlanningRecommendationsAction = useCallback(() => {
    setCurrentSave((save) => {
      if (!save) {
        return save;
      }

      return applyPlanningRecommendations(save);
    });
  }, []);

  const acceptWeeklyContract = useCallback((contractId: string) => {
    setCurrentSave((save) => {
      if (!save) {
        return save;
      }

      return acceptWeeklyContractAction(save, contractId).save;
    });
  }, []);

  const resolveGameEventChoice = useCallback((eventId: string, choiceId: string) => {
    setCurrentSave((save) => {
      if (!save) {
        return save;
      }

      return resolveGameEventChoiceAction(save, eventId, choiceId).save;
    });
  }, []);

  const scoutOpponent = useCallback((gladiatorId: string) => {
    setCurrentSave((save) => {
      if (!save) {
        return save;
      }

      return scoutOpponentAction(save, gladiatorId).save;
    });
  }, []);

  const clearError = useCallback(() => setErrorKey(null), []);

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
      errorKey,
      refreshLocalSaves,
      refreshDemoSaves,
      createNewGame,
      loadLocalSave,
      loadDemoSave,
      resetActiveDemo,
      saveCurrentGame,
      changeLanguage,
      setGameSpeed: setGameSpeedAction,
      purchaseBuilding: purchaseBuildingAction,
      purchaseDormitoryBed: purchaseDormitoryBedAction,
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
    isLoading,
    loadDemoSave,
    loadLocalSave,
    localSaves,
    purchaseBuildingAction,
    purchaseDormitoryBedAction,
    refreshLocalSaves,
    refreshDemoSaves,
    resetActiveDemo,
    saveCurrentGame,
    resolveGameEventChoice,
    scoutOpponent,
    sellGladiatorAction,
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
