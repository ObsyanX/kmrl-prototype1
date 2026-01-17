/**
 * Internationalization (i18n) Setup
 * Supports English and Malayalam
 */

import enMessages from './en.json';
import mlMessages from './ml.json';

export type Locale = 'en' | 'ml';

export const LOCALES: { code: Locale; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
];

export const messages: Record<Locale, typeof enMessages> = {
  en: enMessages,
  ml: mlMessages as typeof enMessages,
};

export const DEFAULT_LOCALE: Locale = 'en';

/**
 * Get stored locale from localStorage
 */
export function getStoredLocale(): Locale {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('metromind-locale');
    if (stored && (stored === 'en' || stored === 'ml')) {
      return stored;
    }
  }
  return DEFAULT_LOCALE;
}

/**
 * Store locale preference
 */
export function setStoredLocale(locale: Locale): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('metromind-locale', locale);
  }
}

/**
 * Get nested translation value
 */
export function getTranslation(
  translations: Record<string, any>,
  key: string
): string {
  const keys = key.split('.');
  let value: any = translations;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key; // Return key if translation not found
    }
  }
  
  return typeof value === 'string' ? value : key;
}

/**
 * Simple translation function (no React context needed)
 */
export function t(key: string, locale: Locale = getStoredLocale()): string {
  return getTranslation(messages[locale], key);
}

export { enMessages, mlMessages };
