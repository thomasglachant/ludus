import { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  GAME_SESSION_PATH,
  getArenaSessionPath,
  getGameSessionPath,
  getGameSessionRoute,
  type ScreenName,
} from '../app/routes';
import type { LanguageCode } from '../domain/types';
import { translate } from '../i18n';
import {
  UiStoreContext,
  type ConfirmModalRequest,
  type FormModalRequest,
  type LudusContextSheetState,
  type LudusSurfaceState,
  type OpenEntityOptions,
  type OpenEntityTarget,
  type UiModalRequest,
  type UiModalState,
  type UiStoreValue,
} from './ui-store-context';

export type {
  BuildingSurfaceTab,
  ConfirmModalRequest,
  ContentPresentation,
  FormModalField,
  FormModalRequest,
  LudusContextSheetState,
  LudusSurfaceKind,
  LudusSurfaceState,
  ModalSize,
  OpenEntityOptions,
  OpenEntityTarget,
  RosterFilter,
  SurfaceContextSource,
  UiModalRequest,
  UiModalState,
} from './ui-store-context';

function getInitialLanguage(): LanguageCode {
  const storedLanguage = localStorage.getItem('ludus:language');

  if (storedLanguage === 'en' || storedLanguage === 'fr') {
    return storedLanguage;
  }

  return navigator.language.startsWith('fr') ? 'fr' : 'en';
}

function getInitialScreen(): ScreenName {
  return getGameSessionRoute(window.location.pathname)?.screen ?? 'mainMenu';
}

function getPathForScreen(screen: ScreenName, options: { gameId?: string } = {}) {
  if (screen !== 'ludus' && screen !== 'arena') {
    return '/';
  }

  if (screen === 'arena') {
    return options.gameId ? getArenaSessionPath(options.gameId) : `${GAME_SESSION_PATH}/arena`;
  }

  return options.gameId ? getGameSessionPath(options.gameId) : GAME_SESSION_PATH;
}

function writeScreenPath(screen: ScreenName, options?: { gameId?: string }) {
  const nextPath = getPathForScreen(screen, options);

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
  const [screen, setScreen] = useState<ScreenName>(getInitialScreen);
  const [activeSurface, setActiveSurface] = useState<LudusSurfaceState>({ kind: 'buildings' });
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
  const resetSurface = useCallback(() => setActiveSurface({ kind: 'buildings' }), []);
  const closeSurface = resetSurface;
  const openSurface = useCallback((surface: LudusSurfaceState) => {
    setModalStack([]);
    setActiveSurface(surface);
  }, []);
  const openContextSheet = useCallback((contextSheet: LudusContextSheetState) => {
    setActiveSurface((currentSurface) => ({
      ...currentSurface,
      contextSheet,
    }));
  }, []);
  const closeContextSheet = useCallback(() => {
    setActiveSurface(({ contextSheet, ...surface }) => {
      void contextSheet;

      return surface;
    });
  }, []);
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
  const openEntity = useCallback(
    (target: OpenEntityTarget, options: OpenEntityOptions) => {
      const presentation = options.presentation ?? 'surface';

      if (target.kind === 'building') {
        if (presentation === 'modal') {
          openModal({ buildingId: target.buildingId, kind: 'building' });
          return;
        }

        openSurface({
          kind: 'buildings',
          selectedBuildingId: target.buildingId,
          selectedBuildingTab: target.tab ?? 'overview',
        });
        return;
      }

      if (presentation === 'modal') {
        openModal({ gladiatorId: target.gladiatorId, kind: 'gladiator' });
        return;
      }

      if (presentation === 'contextSheet') {
        openContextSheet({
          id: target.gladiatorId,
          kind: 'gladiator',
          source: options.source,
        });
        return;
      }

      openSurface({
        kind: 'gladiators',
        selectedGladiatorId: target.gladiatorId,
      });
    },
    [openContextSheet, openModal, openSurface],
  );
  const setLanguage = useCallback((nextLanguage: LanguageCode) => {
    localStorage.setItem('ludus:language', nextLanguage);
    setLanguageState(nextLanguage);
  }, []);
  const navigate = useCallback(
    (nextScreen: ScreenName, options?: { gameId?: string; preserveModal?: boolean }) => {
      writeScreenPath(nextScreen, options);
      setScreen(nextScreen);

      if (!options?.preserveModal) {
        setModalStack([]);
        resetSurface();
      }
    },
    [resetSurface],
  );
  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(language, key, params),
    [language],
  );

  const value = useMemo<UiStoreValue>(() => {
    return {
      activeModal,
      activeSurface,
      modalStack,
      language,
      screen,
      backModal,
      closeModal,
      closeAllModals,
      closeContextSheet,
      closeSurface,
      openContextSheet,
      openEntity,
      openModal,
      openConfirmModal,
      openFormModal,
      openSurface,
      pushModal,
      replaceModal,
      resetSurface,
      setLanguage,
      navigate,
      t,
    };
  }, [
    activeModal,
    activeSurface,
    backModal,
    closeAllModals,
    closeContextSheet,
    closeModal,
    closeSurface,
    language,
    modalStack,
    navigate,
    openContextSheet,
    openEntity,
    openConfirmModal,
    openFormModal,
    openModal,
    openSurface,
    pushModal,
    replaceModal,
    resetSurface,
    screen,
    setLanguage,
    t,
  ]);

  return <UiStoreContext.Provider value={value}>{children}</UiStoreContext.Provider>;
}
