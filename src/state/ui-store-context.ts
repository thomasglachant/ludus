import { createContext, useContext, type ReactNode } from 'react';
import type { ScreenName } from '../app/routes';
import type { BuildingId, LanguageCode } from '../domain/types';

type TranslationParams = Record<string, string | number>;

interface ModalBase {
  titleKey: string;
  titleParams?: TranslationParams;
  testId?: string;
}

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

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

export interface ContractsModalRequest {
  kind: 'contracts';
}

export interface EventsModalRequest {
  kind: 'events';
}

export interface ArenaModalRequest {
  kind: 'arena';
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
  | ContractsModalRequest
  | EventsModalRequest
  | ArenaModalRequest;

export type UiModalState = UiModalRequest & { id: string };

export interface UiStoreValue {
  activeModal: UiModalState | null;
  modalStack: UiModalState[];
  isPixiDebugEnabled: boolean;
  language: LanguageCode;
  screen: ScreenName;
  backModal(): void;
  closeModal(): void;
  closeAllModals(): void;
  openModal(request: UiModalRequest): void;
  openConfirmModal(request: ConfirmModalRequest): void;
  openFormModal(request: FormModalRequest): void;
  pushModal(request: UiModalRequest): void;
  replaceModal(request: UiModalRequest): void;
  togglePixiDebug(): void;
  setLanguage(language: LanguageCode): void;
  navigate(screen: ScreenName, options?: { gameId?: string }): void;
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
