import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ScreenName } from '../app/routes';
import type { LanguageCode } from '../domain/types';
import { translate } from '../i18n';

interface UiStoreValue {
  language: LanguageCode;
  screen: ScreenName;
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

  const value = useMemo<UiStoreValue>(() => {
    const setLanguage = (nextLanguage: LanguageCode) => {
      localStorage.setItem('ludus:language', nextLanguage);
      setLanguageState(nextLanguage);
    };

    return {
      language,
      screen,
      setLanguage,
      navigate: setScreen,
      t: (key, params) => translate(language, key, params),
    };
  }, [language, screen]);

  return <UiStoreContext.Provider value={value}>{children}</UiStoreContext.Provider>;
}

export function useUiStore() {
  const context = useContext(UiStoreContext);

  if (!context) {
    throw new Error('useUiStore must be used inside UiStoreProvider');
  }

  return context;
}
