/**
 * i18n Hook for React components
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  Locale, 
  LOCALES, 
  messages, 
  getStoredLocale, 
  setStoredLocale, 
  getTranslation 
} from '@/i18n';

export function useI18n() {
  const [locale, setLocaleState] = useState<Locale>(getStoredLocale);

  // Sync with localStorage on mount
  useEffect(() => {
    const stored = getStoredLocale();
    if (stored !== locale) {
      setLocaleState(stored);
    }
  }, []);

  /**
   * Change locale and persist
   */
  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setStoredLocale(newLocale);
    
    // Update document lang attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLocale;
    }
  }, []);

  /**
   * Translate a key
   */
  const t = useCallback((key: string): string => {
    return getTranslation(messages[locale], key);
  }, [locale]);

  /**
   * Format a message with interpolation
   */
  const formatMessage = useCallback((key: string, values?: Record<string, string | number>): string => {
    let message = getTranslation(messages[locale], key);
    
    if (values) {
      Object.entries(values).forEach(([k, v]) => {
        message = message.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    
    return message;
  }, [locale]);

  /**
   * Get current locale info
   */
  const currentLocale = LOCALES.find(l => l.code === locale) || LOCALES[0];

  /**
   * Toggle between locales
   */
  const toggleLocale = useCallback(() => {
    const newLocale = locale === 'en' ? 'ml' : 'en';
    setLocale(newLocale);
  }, [locale, setLocale]);

  return {
    locale,
    setLocale,
    t,
    formatMessage,
    locales: LOCALES,
    currentLocale,
    toggleLocale,
    isRTL: false, // Malayalam is LTR
  };
}
