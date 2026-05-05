import { createContext, useContext, type ReactNode } from 'react';
import type { ScreenName } from '../app/routes';
import type { BuildingId, LanguageCode } from '../domain/types';

type TranslationParams = Record<string, string | number>;

interface ModalBase {
  titleKey: string;
  titleParams?: TranslationParams;
  testId?: string;
}

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ConfirmModalRequest extends ModalBase {
  kind: 'confirm';
  cancelLabelKey?: string;
  confirmLabelKey?: string;
  content?: ReactNode;
  messageKey: string;
  messageParams?: TranslationParams;
  onConfirm(): void;
  size?: ModalSize;
  tone?: 'default' | 'danger';
}

export interface FormModalField {
  autoComplete?: string;
  defaultValue?: string;
  id: string;
  labelKey: string;
  placeholderKey?: string;
  required?: boolean;
}

export interface FormModalRequest extends ModalBase {
  kind: 'form';
  cancelLabelKey?: string;
  fields: FormModalField[];
  submitLabelKey?: string;
  onSubmit(values: Record<string, string>): void;
  size?: ModalSize;
}

export interface GameMenuModalRequest {
  kind: 'gameMenu';
}

export interface OptionsModalRequest {
  kind: 'options';
}

export interface LoadGameModalRequest {
  kind: 'loadGame';
}

export interface NewGameModalRequest {
  kind: 'newGame';
}

export interface MarketModalRequest {
  kind: 'market';
}

export interface BuildingModalRequest {
  buildingId: BuildingId;
  kind: 'building';
}

export interface GladiatorModalRequest {
  gladiatorId: string;
  kind: 'gladiator';
}

export interface WeeklyPlanningModalRequest {
  kind: 'weeklyPlanning';
}

export interface BuildingsListModalRequest {
  kind: 'buildingsList';
}

export interface GladiatorsListModalRequest {
  kind: 'gladiatorsList';
}

export interface FinanceModalRequest {
  kind: 'finance';
}

export interface DailyEventModalRequest {
  eventId: string;
  kind: 'dailyEvent';
}

export interface ArenaModalRequest {
  kind: 'arena';
}

export type BuildingSurfaceTab =
  | 'configuration'
  | 'finance'
  | 'gladiators'
  | 'overview'
  | 'upgrades';
export type ContentPresentation = 'contextSheet' | 'modal' | 'surface';
export type LudusSurfaceKind =
  | 'buildings'
  | 'finance'
  | 'gladiators'
  | 'market'
  | 'notifications'
  | 'planning';
export type RosterFilter = 'all' | 'injured' | 'levelUp' | 'ready';
export type SurfaceContextSource = 'alert' | 'building' | 'finance' | 'roster';

export interface LudusContextSheetState {
  id: string;
  kind: 'buildingSkill' | 'gladiator' | 'ledgerEntry';
  source: SurfaceContextSource;
}

export interface LudusSurfaceState {
  contextSheet?: LudusContextSheetState;
  kind: LudusSurfaceKind;
  rosterFilter?: RosterFilter;
  selectedBuildingId?: BuildingId;
  selectedBuildingTab?: BuildingSurfaceTab;
  selectedGladiatorId?: string;
  selectedSkillId?: string;
}

export type OpenEntityTarget =
  | { buildingId: BuildingId; kind: 'building'; tab?: BuildingSurfaceTab }
  | { gladiatorId: string; kind: 'gladiator' };

export interface OpenEntityOptions {
  presentation?: ContentPresentation;
  source: SurfaceContextSource;
}

export type UiModalRequest =
  | ConfirmModalRequest
  | FormModalRequest
  | GameMenuModalRequest
  | OptionsModalRequest
  | LoadGameModalRequest
  | NewGameModalRequest
  | MarketModalRequest
  | BuildingModalRequest
  | GladiatorModalRequest
  | WeeklyPlanningModalRequest
  | BuildingsListModalRequest
  | GladiatorsListModalRequest
  | FinanceModalRequest
  | DailyEventModalRequest
  | ArenaModalRequest;

export type UiModalState = UiModalRequest & { id: string };

export interface UiStoreValue {
  activeModal: UiModalState | null;
  activeSurface: LudusSurfaceState;
  modalStack: UiModalState[];
  language: LanguageCode;
  screen: ScreenName;
  backModal(): void;
  closeModal(): void;
  closeAllModals(): void;
  closeContextSheet(): void;
  closeSurface(): void;
  openContextSheet(contextSheet: LudusContextSheetState): void;
  openEntity(target: OpenEntityTarget, options: OpenEntityOptions): void;
  openModal(request: UiModalRequest): void;
  openConfirmModal(request: ConfirmModalRequest): void;
  openFormModal(request: FormModalRequest): void;
  openSurface(surface: LudusSurfaceState): void;
  pushModal(request: UiModalRequest): void;
  replaceModal(request: UiModalRequest): void;
  resetSurface(): void;
  setLanguage(language: LanguageCode): void;
  navigate(screen: ScreenName, options?: { gameId?: string; preserveModal?: boolean }): void;
  t(key: string, params?: Record<string, string | number>): string;
}

export const UiStoreContext = createContext<UiStoreValue | null>(null);

export function useUiStore() {
  const context = useContext(UiStoreContext);

  if (!context) {
    throw new Error('useUiStore must be used inside UiStoreProvider');
  }

  return context;
}
