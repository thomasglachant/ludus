export const LANGUAGE_CODES = ['fr', 'en'] as const;

export type LanguageCode = (typeof LANGUAGE_CODES)[number];
