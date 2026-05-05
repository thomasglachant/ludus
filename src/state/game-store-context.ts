import { createContext, useContext } from 'react';
import type { GladiatorSkillName } from '../domain/gladiators/skills';
import type {
  BuildingId,
  DailyPlanBuildingActivitySelectionUpdate,
  DailyPlanUpdate,
  DemoSaveId,
  GameSave,
  GameSaveMetadata,
  LanguageCode,
  LoanId,
  DayOfWeek,
  PendingActionTrigger,
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
  isGamePaused: boolean;
  isTimeControlLocked: boolean;
  debugTimeScale: number;
  gameClockLabel: string;
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
  purchaseBuilding(buildingId: BuildingId): void;
  purchaseBuildingImprovement(buildingId: BuildingId, improvementId: string): void;
  purchaseBuildingSkill(buildingId: BuildingId, skillId: string): void;
  selectBuildingPolicy(buildingId: BuildingId, policyId: string): void;
  upgradeBuilding(buildingId: BuildingId): void;
  buyMarketGladiator(candidateId: string): void;
  sellGladiator(gladiatorId: string): void;
  archiveNotification(notificationId: string): void;
  allocateGladiatorSkillPoint(gladiatorId: string, skill: GladiatorSkillName): void;
  updateDailyPlan(update: DailyPlanUpdate): void;
  updateDailyPlanBuildingActivitySelection(update: DailyPlanBuildingActivitySelectionUpdate): void;
  resolveGameEventChoice(eventId: string, choiceId: string): void;
  triggerDebugDailyEvent(definitionId: string): void;
  adjustDebugTreasury(amount: number): void;
  levelUpDebugGladiator(gladiatorId: string): void;
  createDebugInjuryAlert(gladiatorId: string): void;
  advanceDebugToDay(dayOfWeek: DayOfWeek): void;
  setDebugTimeScale(multiplier: number): void;
  completeSundayArenaDay(): void;
  advanceWeekStep(): void;
  resolvePendingGameAction(trigger?: PendingActionTrigger): void;
  toggleGamePause(): void;
  takeLoan(loanId: LoanId): void;
  buyoutLoan(loanInstanceId: string): void;
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
