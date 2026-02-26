import sl from './sl.json';
import en from './en.json';

export const languages = {
  sl: 'Slovenščina',
  en: 'English',
};

export const defaultLang = 'sl' as const;

const translations = { sl, en } as const;

export type Locale = keyof typeof translations;

export function useTranslations(lang: Locale) {
  return function t(key: string): string {
    const keys = key.split('.');
    let value: any = translations[lang];
    for (const k of keys) {
      value = value?.[k];
    }
    if (value === undefined) {
      let fallback: any = translations[defaultLang];
      for (const k of keys) {
        fallback = fallback?.[k];
      }
      return fallback ?? key;
    }
    return value;
  };
}
