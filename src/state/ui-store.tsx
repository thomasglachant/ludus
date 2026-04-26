import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ScreenName } from '../app/routes';
import type { LanguageCode } from '../domain/types';
import { translate } from '../i18n';

type TranslationParams = Record<string, string | number>;

interface ModalBase {
  titleKey: string;
  titleParams?: TranslationParams;
  testId?: string;
}

export interface ConfirmModalRequest extends ModalBase {
  kind: 'confirm';
  cancelLabelKey?: string;
  confirmLabelKey?: string;
  content?: ReactNode;
  messageKey: string;
  messageParams?: TranslationParams;
  onConfirm(): void;
  size?: 'default' | 'wide';
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
}

export type UiModalRequest = ConfirmModalRequest | FormModalRequest;
export type UiModalState = UiModalRequest & { id: string };

interface UiStoreValue {
  activeModal: UiModalState | null;
  language: LanguageCode;
  screen: ScreenName;
  closeModal(): void;
  openConfirmModal(request: ConfirmModalRequest): void;
  openFormModal(request: FormModalRequest): void;
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

export function UiStoreProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(getInitialLanguage);
  const [screen, setScreen] = useState<ScreenName>('mainMenu');
  const [activeModal, setActiveModal] = useState<UiModalState | null>(null);

  const value = useMemo<UiStoreValue>(() => {
    const setLanguage = (nextLanguage: LanguageCode) => {
      localStorage.setItem('ludus:language', nextLanguage);
      setLanguageState(nextLanguage);
    };

    const openModal = (request: UiModalRequest) => {
      setActiveModal({
        ...request,
        id: crypto.randomUUID(),
      });
    };

    return {
      activeModal,
      language,
      screen,
      closeModal: () => setActiveModal(null),
      openConfirmModal: openModal,
      openFormModal: openModal,
      setLanguage,
      navigate: setScreen,
      t: (key, params) => translate(language, key, params),
    };
  }, [activeModal, language, screen]);

  return <UiStoreContext.Provider value={value}>{children}</UiStoreContext.Provider>;
}

export function useUiStore() {
  const context = useContext(UiStoreContext);

  if (!context) {
    throw new Error('useUiStore must be used inside UiStoreProvider');
  }

  return context;
}
