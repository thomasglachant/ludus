import type { LanguageCode } from '../domain/types';
import en from './locales/en.json';
import fr from './locales/fr.json';

type TranslationDictionary = Record<string, string>;

const dictionaries: Record<LanguageCode, TranslationDictionary> = {
  en,
  fr,
};

export function translate(
  language: LanguageCode,
  key: string,
  params: Record<string, string | number> = {},
) {
  const template = dictionaries[language][key] ?? dictionaries.en[key] ?? key;

  return Object.entries(params).reduce(
    (value, [paramKey, paramValue]) => value.replaceAll(`{${paramKey}}`, String(paramValue)),
    template,
  );
}

export function getAvailableLanguages(): LanguageCode[] {
  return ['en', 'fr'];
}
