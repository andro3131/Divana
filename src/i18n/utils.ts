import { defaultLang, type Locale } from './ui';

export function getLocaleFromUrl(url: URL): Locale {
  const [, lang] = url.pathname.split('/');
  if (lang === 'en') return 'en';
  return defaultLang;
}

export function getLocalizedPath(path: string, locale: Locale): string {
  if (locale === defaultLang) return path;
  return `/${locale}${path}`;
}

export const sectionIds: Record<string, Record<Locale, string>> = {
  about: { sl: 'o-meni', en: 'about' },
  music: { sl: 'glasba', en: 'music' },
  gallery: { sl: 'galerija', en: 'gallery' },
  services: { sl: 'storitve', en: 'services' },
  danceEvenings: { sl: 'plesni-veceri', en: 'dance-evenings' },
  contact: { sl: 'kontakt', en: 'contact' },
};
