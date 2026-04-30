import { createContext, useContext } from 'react';
import type {
  BuildingId,
  DemoSaveId,
  GameSave,
  GameSaveMetadata,
  GameSpeed,
  GladiatorRoutineUpdate,
  LanguageCode,
} from '../domain/types';

export interface NewGameInput {
  ludusName: string;
}

export interface GameStoreValue {
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
  changeLanguage(language: LanguageCode): Promise<void>;
  setGameSpeed(speed: GameSpeed): void;
  advanceToNextDay(): void;
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
  resolveGameEventChoice(eventId: string, choiceId: string): void;
  triggerDebugDailyEvent(definitionId: string): void;
  adjustDebugTreasury(amount: number): void;
  markArenaCombatPresented(combatId: string): void;
  completeSundayArenaDay(): void;
  clearError(): void;
}

export const GameStoreContext = createContext<GameStoreValue | null>(null);

export function useGameStore() {
  const context = useContext(GameStoreContext);

  if (!context) {
    throw new Error('useGameStore must be used inside GameStoreProvider');
  }

  return context;
}
