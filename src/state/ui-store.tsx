import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { GAME_SESSION_PATH, type ScreenName } from '../app/routes';
import type { BuildingId, LanguageCode } from '../domain/types';
import { translate } from '../i18n';

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

interface UiStoreValue {
  activeModal: UiModalState | null;
  modalStack: UiModalState[];
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
  setLanguage(language: LanguageCode): void;
  navigate(screen: ScreenName): void;
  t(key: string, params?: Record<string, string | number>): string;
}

const UiStoreContext = createContext<UiStoreValue | null>(null);

function getInitialLanguage(): LanguageCode {
  const storedLanguage = localStorage.getItem('ludus:language');

  if (storedLanguage === 'en' || storedLanguage === 'fr') {
    return storedLanguage;
  }

  return navigator.language.startsWith('fr') ? 'fr' : 'en';
}

function getPathForScreen(screen: ScreenName) {
  return screen === 'ludus' ? GAME_SESSION_PATH : '/';
}

function writeScreenPath(screen: ScreenName) {
  const nextPath = getPathForScreen(screen);

  if (window.location.pathname !== nextPath) {
    window.history.pushState(null, '', nextPath);
  }
}

function createModalState(request: UiModalRequest): UiModalState {
  return {
    ...request,
    id: crypto.randomUUID(),
  };
}

export function UiStoreProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(getInitialLanguage);
  const [screen, setScreen] = useState<ScreenName>('mainMenu');
  const [modalStack, setModalStack] = useState<UiModalState[]>([]);
  const activeModal = modalStack.at(-1) ?? null;
  const backModal = useCallback(
    () => setModalStack((currentStack) => currentStack.slice(0, -1)),
    [],
  );
  const closeModal = useCallback(
    () => setModalStack((currentStack) => currentStack.slice(0, -1)),
    [],
  );
  const closeAllModals = useCallback(() => setModalStack([]), []);
  const openModal = useCallback((request: UiModalRequest) => {
    setModalStack([createModalState(request)]);
  }, []);
  const openConfirmModal = useCallback((request: ConfirmModalRequest) => {
    setModalStack((currentStack) => [...currentStack, createModalState(request)]);
  }, []);
  const openFormModal = useCallback((request: FormModalRequest) => {
    setModalStack((currentStack) => [...currentStack, createModalState(request)]);
  }, []);
  const pushModal = useCallback((request: UiModalRequest) => {
    setModalStack((currentStack) => [...currentStack, createModalState(request)]);
  }, []);
  const replaceModal = useCallback((request: UiModalRequest) => {
    setModalStack((currentStack) => [...currentStack.slice(0, -1), createModalState(request)]);
  }, []);
  const setLanguage = useCallback((nextLanguage: LanguageCode) => {
    localStorage.setItem('ludus:language', nextLanguage);
    setLanguageState(nextLanguage);
  }, []);
  const navigate = useCallback((nextScreen: ScreenName) => {
    writeScreenPath(nextScreen);
    setScreen(nextScreen);
    setModalStack([]);
  }, []);
  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(language, key, params),
    [language],
  );

  const value = useMemo<UiStoreValue>(() => {
    return {
      activeModal,
      modalStack,
      language,
      screen,
      backModal,
      closeModal,
      closeAllModals,
      openModal,
      openConfirmModal,
      openFormModal,
      pushModal,
      replaceModal,
      setLanguage,
      navigate,
      t,
    };
  }, [
    activeModal,
    backModal,
    closeAllModals,
    closeModal,
    language,
    modalStack,
    navigate,
    openConfirmModal,
    openFormModal,
    openModal,
    pushModal,
    replaceModal,
    screen,
    setLanguage,
    t,
  ]);

  return <UiStoreContext.Provider value={value}>{children}</UiStoreContext.Provider>;
}

export function useUiStore() {
  const context = useContext(UiStoreContext);

  if (!context) {
    throw new Error('useUiStore must be used inside UiStoreProvider');
  }

  return context;
}
